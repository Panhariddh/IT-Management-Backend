import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';

import { Role } from 'src/app/common/enum/role.enum';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
  GetProfileByIdDto,
  ProfileResponseDto,
  UpdateProfileByIdDto,
} from './profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(protected readonly profileService: ProfileService) {}

  // Get current user profile (no role restriction)
  @Get('me')
  async getCurrentProfile(@Req() req): Promise<ProfileResponseDto> {
    try {
      const userId = req.user.id;
      return await this.profileService.getCurrentProfile(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch profile',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get profile by ID with role-based access
  @Get(':id')
  async getProfileById(
    @Param() params: GetProfileByIdDto,
    @Req() req,
  ): Promise<ProfileResponseDto> {
    try {
      const userId = params.id;
      const currentUserRole = req.user.role;
      let allowedRoles: Role[] = [];

      // Define role-based access rules
      switch (currentUserRole) {
        case Role.ADMIN:
          allowedRoles = [
            Role.ADMIN,
            Role.HEAD_OF_DEPARTMENT,
            Role.TEACHER,
            Role.STUDENT,
          ];
          break;
        case Role.HEAD_OF_DEPARTMENT:
          allowedRoles = [Role.HEAD_OF_DEPARTMENT, Role.TEACHER];
          break;
        case Role.TEACHER:
          allowedRoles = [Role.TEACHER];
          break;
        case Role.STUDENT:
          allowedRoles = [Role.STUDENT];
          break;
        default:
          throw new HttpException(
            {
              success: false,
              message: 'Unauthorized access',
            },
            HttpStatus.FORBIDDEN,
          );
      }

      // User can always access their own profile
      if (userId === req.user.id) {
        return await this.profileService.getProfileById(userId, []);
      }

      return await this.profileService.getProfileById(userId, allowedRoles);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch profile',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateProfileById(
    @Param() params: GetProfileByIdDto,
    @Body() updateProfileDto: UpdateProfileByIdDto,
    @Req() req,
  ): Promise<ProfileResponseDto> {
    try {
      const hasUpdates = Object.keys(updateProfileDto).length > 0;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      const userId = params.id;
      const currentUserRole = req.user.role;
      let allowedRoles: Role[] = [];

      // Define role-based update rules
      switch (currentUserRole) {
        case Role.ADMIN:
          allowedRoles = [
            Role.ADMIN,
            Role.HEAD_OF_DEPARTMENT,
            Role.TEACHER,
            Role.STUDENT,
          ];
          break;
        case Role.HEAD_OF_DEPARTMENT:
          allowedRoles = [Role.HEAD_OF_DEPARTMENT, Role.TEACHER];
          break;
        case Role.TEACHER:
          allowedRoles = [Role.TEACHER];
          break;
        case Role.STUDENT:
          allowedRoles = [Role.STUDENT];
          break;
        default:
          throw new HttpException(
            {
              success: false,
              message: 'Unauthorized access',
            },
            HttpStatus.FORBIDDEN,
          );
      }

      // User can always update their own profile
      if (userId === req.user.id) {
        allowedRoles = [];
      }

      return await this.profileService.updateProfileById(
        userId,
        updateProfileDto,
        allowedRoles,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update profile',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('password/:id')
  async changePasswordById(
    @Param() params: GetProfileByIdDto,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ): Promise<ChangePasswordResponseDto> {
    try {
      const userId = params.id;

      // Users can only change their own password
      if (userId !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'You can only change your own password',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.changePasswordById(
        userId,
        changePasswordDto,
        [], // No role restriction for own password change
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to change password',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateAvatarById(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ): Promise<ProfileResponseDto> {
    try {
      const userId = id;

      // Users can only update their own avatar
      if (userId !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'You can only update your own avatar',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.updateAvatarById(
        userId,
        image,
        [], // No role restriction for own avatar
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to update profile image',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
