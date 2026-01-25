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
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>, 
    private jwtService: JwtService, 
    private passwordService: PasswordService, 
  ) {}

  // Validate user
  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        hodInfo: { department: true }, // ✅ load department
        teacherInfo: true,
        studentInfo: true,
      },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _pw, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  // Login function
  async login(email: string, password: string, res: Response) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.is_active)
      throw new UnauthorizedException('Account is deactivated');

    const payload = { userId: user.id, role: user.role };
    const token = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '7d',
    });

    res.cookie('jwt', token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development',
    });

    const responseUser: any = {
      id: user.id,
      email: user.email,
      name_kh: user.name_kh,
      name_en: user.name_en,
      role: user.role,
      image: user.image,
    };

    if (user.role === Role.HEAD_OF_DEPARTMENT) {
      responseUser.department = user.hodInfo?.department
        ? {
            id: user.hodInfo.department.id,
            name: user.hodInfo.department.name,
          }
        : null;
    }

    return { user: responseUser, token };
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
