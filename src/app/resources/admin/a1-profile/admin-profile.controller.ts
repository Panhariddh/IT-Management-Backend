import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
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

@Controller('admin/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  @Roles(Role.ADMIN)
  async getProfileById(@Param('id') id: string): Promise<any> {
    try {
      // Admin can access any profile regardless of role
      return await this.profileService.getProfileById(id, []);
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

  @Put(':id')
  @Roles(Role.ADMIN)
  async updateProfileById(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileByIdDto,
  ): Promise<any> {
    try {
      // Admin can update any profile regardless of role
      return await this.profileService.updateProfileById(
        id,
        updateProfileDto,
        [],
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

  @Put('password/:id')
  @Roles(Role.ADMIN)
  async changePasswordById(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<any> {
    try {
      // Admin can change any password regardless of role
      return await this.profileService.changePasswordById(
        id,
        changePasswordDto,
        [],
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

  @Put('avatar/:id')
  @UseInterceptors(FileInterceptor('image'))
  @Roles(Role.ADMIN)
  async updateAvatarById(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<any> {
    try {
      // Admin can update any avatar regardless of role
      return await this.profileService.updateAvatarById(id, image, []);
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
