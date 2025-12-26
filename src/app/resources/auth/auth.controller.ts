import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ChangePasswordGuard } from 'src/app/common/guards/change-password.guard';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Login
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(email, password, res);
  }

  // Logout
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { message: 'Logged out successfully.' };
  }

  // Forgot password
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    // Trigger password reset email
    return this.authService.requestPasswordReset(email);
  }

  // Reset password
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string, // token from email
    @Body('newPassword') newPassword: string, // new password
  ) {
    // Reset password using token and new password
    return this.authService.resetPassword(token, newPassword);
  }

  // Change password
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    const userId = (req.user as any).userId;
    return this.authService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  // Check if password change is required
  @UseGuards(JwtAuthGuard)
  @Get('check-password-required')
  async checkPasswordRequired(@Req() req: Request) {
    const userId = (req.user as any).userId;
    return this.authService.checkPasswordRequiresChange(userId);
  }

  // Change initial password using temporary token for password change student registration
  @UseGuards(ChangePasswordGuard)
  @Post('change-initial-password')
  async changeInitialPassword(
    @Req() req: Request,
    @Body('newPassword') newPassword: string,
  ) {
    const userId = (req.user as any).userId;
    const token = (req.user as any).tempToken;

    if (!token) {
      throw new BadRequestException('Invalid password change token');
    }

    // Use the correct method - changeInitialPassword, not resetPassword
    return this.authService.changeInitialPassword(token, newPassword);
  }

  // Check authentication
  @UseGuards(JwtAuthGuard)
  @Get('check')
  checkAuth(@Req() req: Request) {
    return req.user;
  }
}
