import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role } from 'src/app/common/enum/role.enum';
import { UserModel } from 'src/app/database/models/user.model';
import jwtConstants from 'src/app/utils/jwt.constants';
import { MoreThan, Repository } from 'typeorm';
import { EmailService } from '../email/email.service';

@Injectable()
export class PasswordService {
  // Inject dependencies
  constructor(
    // Inject user repository for database operations
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,

    // Inject email service
    private emailService: EmailService,

    // Inject JWT service
    private jwtService: JwtService,
  ) {}

  // password reset request method
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'If your email exists, you will receive a password reset link',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the reset token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (1 hour from now)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    // Update user
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = resetExpires;

    // Save user
    await this.userRepository.save(user);

    // Send email
    await this.emailService.sendPasswordResetEmail(
      email,
      resetToken,
      user.name_en || user.name_kh || 'User',
    );

    return { message: 'Password reset link sent to your email' };
  }

  // reset password method
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token is valid
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as old password',
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    user.password = hashedPassword;
    user.passwordChanged = true;
    user.lastPasswordChange = new Date();
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // Save user
    await this.userRepository.save(user);

    // Send confirmation email
    await this.emailService.sendPasswordChangedConfirmation(
      user.email,
      user.name_en || user.name_kh || 'User',
    );

    return { message: 'Password reset successfully' };
  }

  // change password method
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    // Check if current password is valid
    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    user.password = hashedPassword;
    user.passwordChanged = true;
    user.lastPasswordChange = new Date();

    // Save user
    await this.userRepository.save(user);

    // Send confirmation email
    await this.emailService.sendPasswordChangedConfirmation(
      user.email,
      user.name_en || user.name_kh || 'User',
    );

    return { message: 'Password changed successfully' };
  }

  // check password requires change method
  async checkPasswordRequiresChange(
    userId: string,
  ): Promise<{ requiresChange: boolean }> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role', 'passwordChanged'],
    });

    if (!user) {
      return { requiresChange: false };
    }

    // Only students need to change password if not changed before
    const requiresChange = user.role === Role.STUDENT && !user.passwordChanged;

    return { requiresChange };
  }

  async changeInitialPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      // Verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // Check if it's a password change token
      if (!payload.passwordChangeRequired) {
        console.log('ERROR: Token does not have passwordChangeRequired flag');
        throw new BadRequestException('Invalid password change token');
      }

      // Extract user ID
      const userId = payload.userId;

      // Check if user exists
      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        console.log('ERROR: User not found for ID:', userId);
        throw new NotFoundException('User not found');
      }

      // Check if new password is same as current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        console.log('ERROR: New password is same as current password');
        throw new BadRequestException(
          'New password cannot be the same as current password',
        );
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user
      user.password = hashedPassword;
      user.passwordChanged = true;
      user.lastPasswordChange = new Date();

      // Save user
      await this.userRepository.save(user);

      // Send confirmation email
      await this.emailService.sendPasswordChangedConfirmation(
        user.email,
        user.name_en || user.name_kh || 'User',
      );

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Password change token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        console.error('JWT Error details:', error.message);
        throw new BadRequestException('Invalid password change token');
      }
      throw error;
    }
  }
}
