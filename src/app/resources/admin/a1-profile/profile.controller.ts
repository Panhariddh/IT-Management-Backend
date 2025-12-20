import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
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
import {
  AdminProfileResponseDto,
  ChangePasswordByIdDto,
  ChangePasswordDto,
  ChangePasswordResponseDto,
  GetAdminProfileByIdDto,
  UpdateAdminProfileByIdDto,
  UpdateAdminProfileDto,
} from './profile.dto';
import { ProfileService } from './profile.service';

@Controller('admin/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req): Promise<AdminProfileResponseDto> {
    try {
      const userId = req.user.id;
      return await this.profileService.getProfile(userId);
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

  @Get(':id')
  async getProfileById(
    @Param() params: GetAdminProfileByIdDto,
  ): Promise<AdminProfileResponseDto> {
    try {
      return await this.profileService.getProfileById(params.id);
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

  @Put(':id')
  async updateProfileById(
    @Param() params: UpdateAdminProfileByIdDto,
    @Body() updateProfileDto: UpdateAdminProfileDto,
  ): Promise<AdminProfileResponseDto> {
    try {
      const hasUpdates = Object.keys(updateProfileDto).length > 0;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      return await this.profileService.updateProfileById(
        params.id,
        updateProfileDto,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
    @Param() params: ChangePasswordByIdDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    try {
      return await this.profileService.changePasswordById(
        params.id,
        changePasswordDto,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif)$/ }),
        ],
      }),
    )
    image: Express.Multer.File,
  ): Promise<AdminProfileResponseDto> {
    try {
      return await this.profileService.updateAvatarById(id, image);
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
          message: 'Failed to update profile image',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
