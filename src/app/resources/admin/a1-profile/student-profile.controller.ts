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

@Controller('student/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
export class StudentProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // Get current student profile
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

  // Get student profile by ID (students can only view their own profile)
  @Get(':id')
  async getProfileById(@Param('id') id: string, @Req() req): Promise<any> {
    try {
      // Students can only view their own profile
      if (id !== req.user.id) {
        throw new HttpException(
          {
            success: false,
            message: 'Unauthorized to view this profile',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.profileService.getProfileById(id, [Role.STUDENT]);
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

  // Update student profile (students can only update their own profile)
  @Put(':id')
  async updateProfileById(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileByIdDto,
    @Req() req,
  ): Promise<any> {
    try {
      // Students can only update their own profile
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
        Role.STUDENT,
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

  // Change password (students can only change their own password)
  @Put('password/:id')
  async changePasswordById(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ): Promise<any> {
    try {
      // Students can only change their own password
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
        [Role.STUDENT],
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

  // Update avatar (students can only update their own avatar)
  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('image'))
  async updateAvatarById(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Req() req,
  ): Promise<any> {
    try {
      // Students can only update their own avatar
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
        Role.STUDENT,
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
