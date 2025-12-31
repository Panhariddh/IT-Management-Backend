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
import { In, Repository } from 'typeorm';

import { MinioService } from '../../services/minio/minio.service';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  ProfileDto,
  ProfileResponseDto,
  UpdateProfileByIdDto,
} from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
    private readonly minioService: MinioService,
  ) {}

  // Get profile by ID with specific role-based access
  async getProfileById(
    userId: string,
    roles: Role[] = [],
  ): Promise<ProfileResponseDto> {
    try {
      let query = this.userRepository.createQueryBuilder('user');

      if (roles && roles.length > 0) {
        query = query.where('user.id = :userId AND user.role IN (:...roles)', {
          userId,
          roles,
        });
      } else {
        query = query.where('user.id = :userId', { userId });
      }

      const user = await query.getOne();

      if (!user) {
        throw new NotFoundException('Profile not found');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in getProfileById:', error);
      throw new InternalServerErrorException('Failed to retrieve profile');
    }
  }

  // Get current user profile
  async getCurrentProfile(userId: string): Promise<ProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: {
          studentInfo: true,
          hodInfo: {
            department: true,
          },
          teacherInfo: {
            department: true,
          },
        },
      });

      if (!user) {
        throw new NotFoundException('Profile not found');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: this.mapToProfileDto(user),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve profile');
    }
  }

  // Update profile by ID with specific role-based access
  async updateProfileById(
    userId: string,
    updateProfileDto: UpdateProfileByIdDto,
    roles: Role[] = [],
  ): Promise<ProfileResponseDto> {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Build where condition properly
      let whereCondition: any = { id: userId };

      // Apply role-based access
      if (roles && roles.length > 0) {
        // For single role, use equality
        if (roles.length === 1) {
          // Use the string, not array
          whereCondition.role = roles[0];
        } else {
          // For multiple roles, use In operator
          whereCondition.role = In(roles);
        }
      }

      const user = await queryRunner.manager.findOne(UserModel, {
        where: whereCondition,
      });

      if (!user) {
        console.log('User not found with conditions:', whereCondition);
        throw new NotFoundException('Profile not found');
      }

      // Email validation
      if (updateProfileDto.email && updateProfileDto.email !== user.email) {
        console.log('Checking email uniqueness...');
        const existingUser = await queryRunner.manager.findOne(UserModel, {
          where: { email: updateProfileDto.email },
        });
        if (existingUser && existingUser.id !== userId) {
          console.log('Email already exists:', updateProfileDto.email);
          throw new BadRequestException('Email already exists');
        }
        user.email = updateProfileDto.email;
      }

      // Password change logic
      await this.handlePasswordChange(updateProfileDto, user);

      // Update other fields
      this.updateUserFields(user, updateProfileDto);

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

  // Change password by ID with specific role-based access
  async changePasswordById(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    roles: Role[] = [],
  ): Promise<ChangePasswordResponseDto> {
    try {
      // Build where condition properly
      let whereCondition: any = { id: userId };

      // Apply role-based access
      if (roles && roles.length > 0) {
        // For single role, use equality
        if (roles.length === 1) {
          whereCondition.role = roles[0];
        } else {
          whereCondition.role = In(roles);
        }
      }

      const user = await this.userRepository.findOne({
        where: whereCondition,
      });

      if (!user) {
        throw new NotFoundException('Profile not found');
      }

      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const isSamePassword = await bcrypt.compare(
        changePasswordDto.newPassword,
        user.password,
      );

      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
      }

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

  // Update avatar by ID with specific role-based access
  async updateAvatarById(
    userId: string,
    image: Express.Multer.File,
    roles: Role[] = [],
  ): Promise<ProfileResponseDto> {
    try {
      let whereCondition: any = { id: userId };

      if (roles && roles.length > 0) {
        if (roles.length === 1) {
          whereCondition.role = roles[0];
        } else {
          whereCondition.role = In(roles);
        }
      }

      const user = await this.userRepository.findOne({
        where: whereCondition,
      });

      if (!user) {
        throw new NotFoundException('Profile not found');
      }

      // Delete old image
      if (user.image) {
        await this.deleteOldImage(user.image);
      }

      // Upload new image based on role-specific folder
      const folder = `${user.role.toLowerCase()}-profiles`;
      const fileName = `${Date.now()}-${image.originalname}`;
      const objectName = `${folder}/${fileName}`;

      await this.minioService.uploadImage(image, folder);
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

  // Private helper methods
  private async handlePasswordChange(
    updateProfileDto: UpdateProfileByIdDto,
    user: UserModel,
  ): Promise<void> {
    if (updateProfileDto.currentPassword && updateProfileDto.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

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
  }

  // Update user fields
  private updateUserFields(
    user: UserModel,
    updateProfileDto: UpdateProfileByIdDto,
  ): void {
    const fields = [
      'name_kh',
      'name_en',
      'phone',
      'gender',
      'dob',
      'address',
    ] as const;

    fields.forEach((field) => {
      if (updateProfileDto[field] !== undefined) {
        if (field === 'dob') {
          user[field] = new Date(updateProfileDto[field] as string);
        } else {
          user[field] = updateProfileDto[field] as any;
        }
      }
    });
  }

  // Delete old image
  private async deleteOldImage(imageUrl: string): Promise<void> {
    try {
      const oldObjectName = this.extractObjectName(imageUrl);
      if (oldObjectName) {
        await this.minioService.deleteImage(oldObjectName);
      }
    } catch (error) {
      console.error('Failed to delete old image:', error);
    }
  }

  // Extract object name from image URL
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

  // Format date
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

  // Map user to profile DTO
  private mapToProfileDto(user: UserModel): ProfileDto {
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

      studentInfo: user.studentInfo
        ? {
            student_id: user.studentInfo.student_id,
            student_year: user.studentInfo.student_year,
            academic_year_id: user.studentInfo.academic_year_id,
          }
        : undefined,

      hodInfo: user.hodInfo
        ? {
            hod_id: user.hodInfo.hod_id,
            departmentInfo: {
              department_id: user.hodInfo.department.id,
              department_name: user.hodInfo.department.name,
            },
          }
        : undefined,

      teacherInfo: user.teacherInfo
        ? {
            teacher_id: user.teacherInfo.teacher_id,
            departmentInfo: {
              department_id: user.teacherInfo.department?.id ?? null,
              department_name: user.teacherInfo.department?.name ?? null,
            },
          }
        : undefined,
    };
  }
}
