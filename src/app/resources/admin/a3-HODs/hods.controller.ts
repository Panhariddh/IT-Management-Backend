import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import {
  CreateHodDto,
  CreateHodResponseDto,
  HodDetailDto,
  HodsResponseDto,
  UpdateHodDto,
  UpdateHodResponseDto,
} from '../a3-hods/hods.dto';
import { HodService } from '../a3-hods/hods.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class HodController {
  constructor(private readonly hodService: HodService) {}

  // Get all hods with pagination, filtering, and sorting
  @Get()
  async getAllHods(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('department') departmentId?: string,
    @Query('gender') gender?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy: string = 'id',
    @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
    @Query('is_active') isActive?: string,
  ): Promise<HodsResponseDto> {
    try {
      const allowedSortFields = [
        'name_en',
        'name_kh',
        'dob',
        'hod_id',
        'created_at',
      ];
      if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'name_en';
      }

      if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
        sortOrder = 'ASC';
      }

      let validGender: string | undefined;
      if (gender) {
        const genderLower = gender.toLowerCase();
        if (
          genderLower === 'male' ||
          genderLower === 'female' ||
          genderLower === 'm' ||
          genderLower === 'f'
        ) {
          if (genderLower === 'm') validGender = 'Male';
          else if (genderLower === 'f') validGender = 'Female';
          else
            validGender =
              gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        }
      }

      // Parse is_active query parameter
      let isActiveBoolean: boolean | undefined;
      if (isActive !== undefined) {
        isActiveBoolean = isActive.toLowerCase() === 'true';
      }

      const result = await this.hodService.getAllHods({
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        gender: validGender,
        search,
        sortBy,
        sortOrder,
        isActive: isActiveBoolean,
      });

      return {
        success: true,
        message: 'Hod list fetched successfully',
        data: result.hods,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch hod list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a single hod by ID
  @Get(':id')
  async getAHod(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: HodDetailDto;
  }> {
    try {
      const hod = await this.hodService.getHodById(id);

      if (!hod) {
        throw new HttpException(
          {
            success: false,
            message: 'Hod not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Hod details fetched successfully',
        data: hod,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch hod details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a new hod
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createHod(
    @Body() createHodDto: CreateHodDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<CreateHodResponseDto> {
    try {
      // Validate file type if image is provided
      if (imageFile) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
          throw new BadRequestException(
            'Invalid image format. Allowed: JPEG, PNG, JPG',
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          throw new BadRequestException(
            'Image size too large. Maximum size is 5MB',
          );
        }
      }

      const hod = await this.hodService.createHod(createHodDto, imageFile);

      return {
        success: true,
        message: 'Hod created successfully',
        data: {
          ...hod,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create hod',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Update hod
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateHod(
    @Param('id') id: string,
    @Body() updateHodDto: UpdateHodDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<UpdateHodResponseDto> {
    try {
      // Validate file type if image is provided
      if (imageFile) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
          throw new BadRequestException(
            'Invalid image format. Allowed: JPEG, PNG, JPG',
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          throw new BadRequestException(
            'Image size too large. Maximum size is 5MB',
          );
        }
      }

      // Check if at least one field is being updated
      const hasUpdates = Object.keys(updateHodDto).length > 0 || imageFile;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      const hod = await this.hodService.updateHod(id, updateHodDto, imageFile);

      return {
        success: true,
        message: 'Hod updated successfully',
        data: {
          ...hod,
        },
      };
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
          message: 'Failed to update hod',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Soft delete hod
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteHod(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await this.hodService.deleteHod(id);

      return {
        success: true,
        message: result.message,
      };
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
          message: 'Failed to delete hod',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get hod by user ID (useful for profile management)
  @Get('user/:userId')
  async getHodByUserId(@Param('userId') userId: string): Promise<{
    success: boolean;
    message: string;
    data: HodDetailDto;
  }> {
    try {
      const hod = await this.hodService.getHodByUserId(userId);

      if (!hod) {
        throw new HttpException(
          {
            success: false,
            message: 'Hod not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Hod details fetched successfully',
        data: hod,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch hod details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
