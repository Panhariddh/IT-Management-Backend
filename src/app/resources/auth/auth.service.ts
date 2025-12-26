import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Response } from 'express';
import { UserModel } from 'src/app/database/models/user.model';
import jwtConstants from 'src/app/utils/jwt.constants';
import { Repository } from 'typeorm';

import { Role } from 'src/app/common/enum/role.enum';
import { PasswordService } from '../services/password/password.service';

@Injectable()
export class AuthService {
  // Inject dependencies
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>, // Inject user repository, provides the database repository for user operations
    private jwtService: JwtService, // Inject JWT service, provides JWT handling without manual creation
    private passwordService: PasswordService, // Inject password service, provides password logic
  ) {}

  // Validate user
  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // Compare hashed password
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  // Login function
  async login(email: string, password: string, res: Response) {
    // Validate user
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // For students, check if they need to change password
    if (user.role === Role.STUDENT && !user.passwordChanged) {
      // Return special flag indicating password change required
      const tempToken = this.jwtService.sign(
        { userId: user.id, role: user.role, passwordChangeRequired: true },
        { secret: jwtConstants.secret, expiresIn: '15m' },
      );

      // Set secure cookie
      return {
        requiresPasswordChange: true,
        tempToken,
        user: {
          id: user.id,
          email: user.email,
          name_kh: user.name_kh,
          name_en: user.name_en,
          role: user.role,
        },
      };
    }

    // Generate JWT
    const payload = { userId: user.id, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '7d',
    });

    // Set secure cookie
    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development',
    });

    return { user, token };
  }

  // password reset request method
  async requestPasswordReset(email: string) {
    return this.passwordService.requestPasswordReset(email);
  }

  // reset password method
  async resetPassword(token: string, newPassword: string) {
    return this.passwordService.resetPassword(token, newPassword);
  }

  // change password method
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.passwordService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  // Check if password change is required
  async checkPasswordRequiresChange(userId: string) {
    return this.passwordService.checkPasswordRequiresChange(userId);
  }

  // Logout function
  logout(res: Response) {
    res.cookie('jwt', '', { maxAge: 0 });
  }

  // Change initial password using temporary token (delegates to PasswordService)
  async changeInitialPassword(token: string, newPassword: string) {
    return this.passwordService.changeInitialPassword(token, newPassword);
  }
}
