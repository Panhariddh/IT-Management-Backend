import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/app/common/enum/role.enum';
import { UserModel } from 'src/app/database/models/user.model';
import { Repository } from 'typeorm';
import { MinioService } from '../../services/minio/minio.service';
import {
  AdminProfileDto,
  AdminProfileResponseDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  UpdateAdminProfileDto,
} from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    private readonly minioService: MinioService,
  ) {}

  // Get current admin profile
  async getProfile(userId: string): Promise<AdminProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, role: Role.ADMIN },
      });

      if (!user) {
        throw new NotFoundException('Admin profile not found');
      }

      return {
        success: true,
        message: 'Admin profile retrieved successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve profile');
    }
  }

  // Get admin profile by ID
  async getProfileById(userId: string): Promise<AdminProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, role: Role.ADMIN },
      });

      if (!user) {
        throw new NotFoundException('Admin profile not found');
      }

      return {
        success: true,
        message: 'Admin profile retrieved successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve profile');
    }
  }

  private formatDate(dateValue: Date | string): string {
    try {
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      } else if (typeof dateValue === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      }
      return '';
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // Update current admin profile
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
    return this.updateProfileById(userId, updateProfileDto);
  }

  // Update admin profile by ID
  async updateProfileById(
    userId: string,
    updateProfileDto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(UserModel, {
        where: { id: userId, role: Role.ADMIN },
      });

      if (!user) {
        throw new NotFoundException('Admin profile not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateProfileDto.email && updateProfileDto.email !== user.email) {
        const existingUser = await queryRunner.manager.findOne(UserModel, {
          where: { email: updateProfileDto.email },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new BadRequestException('Email already exists');
        }
        user.email = updateProfileDto.email;
      }

      // Handle password change if provided
      if (updateProfileDto.currentPassword && updateProfileDto.newPassword) {
        const isPasswordValid = await bcrypt.compare(
          updateProfileDto.currentPassword,
          user.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Current password is incorrect');
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(
          updateProfileDto.newPassword,
          user.password,
        );

        if (isSamePassword) {
          throw new BadRequestException(
            'New password must be different from current password',
          );
        }

        user.password = await bcrypt.hash(updateProfileDto.newPassword, 10);
      } else if (
        (updateProfileDto.currentPassword && !updateProfileDto.newPassword) ||
        (!updateProfileDto.currentPassword && updateProfileDto.newPassword)
      ) {
        throw new BadRequestException(
          'Both current password and new password are required to change password',
        );
      }

      // Update other fields
      if (updateProfileDto.name_kh !== undefined) {
        user.name_kh = updateProfileDto.name_kh;
      }
      if (updateProfileDto.name_en !== undefined) {
        user.name_en = updateProfileDto.name_en;
      }
      if (updateProfileDto.phone !== undefined) {
        user.phone = updateProfileDto.phone;
      }
      if (updateProfileDto.gender !== undefined) {
        user.gender = updateProfileDto.gender;
      }
      if (updateProfileDto.dob !== undefined) {
        user.dob = new Date(updateProfileDto.dob);
      }
      if (updateProfileDto.address !== undefined) {
        user.address = updateProfileDto.address;
      }

      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Profile updated successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile');
    } finally {
      await queryRunner.release();
    }
  }

  // Change current admin password
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    return this.changePasswordById(userId, changePasswordDto);
  }

  // Change password by ID (for admin to reset others' passwords)
  async changePasswordById(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, role: Role.ADMIN },
      });

      if (!user) {
        throw new NotFoundException('Admin profile not found');
      }

      // If current password is provided (user changing their own password)
      if (changePasswordDto.currentPassword) {
        const isPasswordValid = await bcrypt.compare(
          changePasswordDto.currentPassword,
          user.password,
        );

        if (!isPasswordValid) {
          throw new BadRequestException('Current password is incorrect');
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(
          changePasswordDto.newPassword,
          user.password,
        );

        if (isSamePassword) {
          throw new BadRequestException(
            'New password must be different from current password',
          );
        }
      }
      // If no current password provided (admin resetting someone else's password)
      // You might want to add authorization check here

      user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  // Update current admin avatar
  async updateAvatar(
    userId: string,
    image: Express.Multer.File,
  ): Promise<AdminProfileResponseDto> {
    return this.updateAvatarById(userId, image);
  }

  // Update admin avatar by ID
  async updateAvatarById(
    userId: string,
    image: Express.Multer.File,
  ): Promise<AdminProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, role: Role.ADMIN },
      });

      if (!user) {
        throw new NotFoundException('Admin profile not found');
      }

      // Delete old image if exists
      if (user.image) {
        try {
          const oldObjectName = this.extractObjectName(user.image);
          if (oldObjectName) {
            await this.minioService.deleteImage(oldObjectName);
          }
        } catch (error) {
          console.error('Failed to delete old image:', error);
        }
      }

      // Upload new image
      const fileName = `${Date.now()}-${image.originalname}`;
      const objectName = `admin-profiles/${fileName}`;
      await this.minioService.uploadImage(image, `admin-profiles`);

      // Store the full proxied URL
      const imageUrl = this.minioService.getProxiedUrl(objectName);
      user.image = imageUrl;
      await this.userRepository.save(user);

      return {
        success: true,
        message: 'Profile image updated successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile image');
    }
  }

  private extractObjectName(imageUrl: string): string | null {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const imagesIndex = pathParts.indexOf('images');
      if (imagesIndex !== -1) {
        return pathParts.slice(imagesIndex + 1).join('/');
      }
    } catch (error) {
      return imageUrl.includes('/') ? imageUrl : null;
    }
    return null;
  }

  private mapToProfileDto(user: UserModel): AdminProfileDto {
    // Process image URL
    let imageUrl = user.image;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = this.minioService.getProxiedUrl(imageUrl);
    }

    return {
      id: user.id,
      name_kh: user.name_kh,
      name_en: user.name_en,
      email: user.email,
      phone: user.phone,
      gender: user.gender,
      dob: this.formatDate(user.dob),
      address: user.address,
      role: user.role,
      image: imageUrl,
      is_active: user.is_active,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }
}
