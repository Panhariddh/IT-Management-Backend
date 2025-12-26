import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    name: string,
  ): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"RTC KcKp" <${process.env.EMAIL_FROM || 'noreply@rtc.edu.kh'}>`,
      to: email,
      subject: 'Password Reset Request - RTC KcKp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #131C2E; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">RTC KcKp</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Hello ${name},</h2>
            <p>You have requested to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #131C2E; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">
              © 2025 RTC KcKp. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendPasswordChangedConfirmation(
    email: string,
    name: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"RTC KcKp" <${process.env.EMAIL_FROM || 'noreply@rtc.edu.kh'}>`,
      to: email,
      subject: 'Password Changed Successfully - RTC KcKp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #131C2E; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">RTC KcKp</h1>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2>Hello ${name},</h2>
            <p>Your password has been changed successfully.</p>
            <p>If you did not make this change, please contact the administrator immediately.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">
              © 2025 RTC KcKp. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password change confirmation:', error);
    }
  }
}
