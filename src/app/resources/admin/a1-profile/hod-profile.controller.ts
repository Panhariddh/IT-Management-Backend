import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { ChangePasswordDto, UpdateProfileByIdDto } from './profile.dto';
import { ProfileService } from './profile.service';

@Controller('hod/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HEAD_OF_DEPARTMENT)
export class HodProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Get current HOD profile
  @Get('me')
  async getCurrentProfile(@Req() req): Promise<any> {
    try {
      const userId = req.user.id;
      return await this.profileService.getCurrentProfile(userId);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get profile by ID (HOD can view their own profile and teacher profiles)
  @Get(':id')
  async getProfileById(@Param('id') id: string, @Req() req): Promise<any> {
    try {
      // HOD can view their own profile
      if (id === req.user.id) {
        return await this.profileService.getProfileById(id, [
          Role.HEAD_OF_DEPARTMENT,
        ]);
      }

      // HOD can view teacher profiles
      return await this.profileService.getProfileById(id, [Role.TEACHER]);
    } catch (error) {
      // If not found as teacher, maybe it's a HOD profile
      if (error.message.includes('Profile not found')) {
        throw new HttpException(
          {
            success: false,
            message: 'Profile not found or unauthorized to view',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update profile by ID (HOD can update their own profile and teacher profiles)
  @Put(':id')
  async updateProfileById(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileByIdDto,
    @Req() req,
  ): Promise<any> {
    try {
      // HOD can update their own profile
      if (id === req.user.id) {
        return await this.profileService.updateProfileById(
          id,
          updateProfileDto,
          [Role.HEAD_OF_DEPARTMENT],
        );
      }

      // HOD can update teacher profiles
      return await this.profileService.updateProfileById(id, updateProfileDto, [
        Role.TEACHER,
      ]);
    } catch (error) {
      if (error.message.includes('Profile not found')) {
        throw new HttpException(
          {
            success: false,
            message: 'Profile not found or unauthorized to update',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Change password (HOD can only change their own password)
  @Put('password/:id')
  async changePasswordById(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ): Promise<any> {
    try {
      // HOD can only change their own password
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'You can only change your own password',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.changePasswordById(
        id,
        changePasswordDto,
        [Role.HEAD_OF_DEPARTMENT],
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update avatar (HOD can only update their own avatar)
  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateAvatarById(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ): Promise<any> {
    try {
      // HOD can only update their own avatar
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'You can only update your own avatar',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.updateAvatarById(id, image, [
        Role.HEAD_OF_DEPARTMENT,
      ]);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
