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

@Controller('teacher/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Get current teacher profile
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

  // Get teacher profile by ID (teachers can only view their own profile)
  @Get(':id')
  async getProfileById(@Param('id') id: string, @Req() req): Promise<any> {
    try {
      // Teachers can only view their own profile
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'Unauthorized to view this profile',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.getProfileById(id, [Role.TEACHER]);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
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

  // Update teacher profile (teachers can only update their own profile)
  @Put(':id')
  async updateProfileById(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileByIdDto,
    @Req() req,
  ): Promise<any> {
    try {
      // Teachers can only update their own profile
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'Unauthorized to update this profile',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.updateProfileById(id, updateProfileDto, [
        Role.TEACHER,
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

  // Change password (teachers can only change their own password)
  @Put('password/:id')
  async changePasswordById(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ): Promise<any> {
    try {
      // Teachers can only change their own password
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'Unauthorized to change password for this profile',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.changePasswordById(
        id,
        changePasswordDto,
        [Role.TEACHER],
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

  // Update avatar (teachers can only update their own avatar)
  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateAvatarById(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ): Promise<any> {
    try {
      // Teachers can only update their own avatar
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'Unauthorized to update avatar for this profile',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.updateAvatarById(id, image, [
        Role.TEACHER,
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
