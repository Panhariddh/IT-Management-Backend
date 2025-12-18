import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  Param,
  BadRequestException,
  UploadedFile,
  Post,
  UseInterceptors,
  Body,
  NotFoundException,
  HttpCode,
  Delete,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { TeacherService } from './teachers.service';
import {
  CreateTeacherDto,
  CreateTeacherResponseDto,
  TeacherDetailDto,
  TeachersResponseDto,
  UpdateTeacherDto,
  UpdateTeacherResponseDto,
} from './teachers.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // Get all teachers with pagination, filtering, and sorting
  @Get()
  async getAllTeachers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('department') departmentId?: string,
    @Query('gender') gender?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy: string = 'id',
    @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
    @Query('is_active') isActive?: string,
  ): Promise<TeachersResponseDto> {
    try {
      const allowedSortFields = ['name_en', 'name_kh', 'dob', 'teacher_id', 'created_at'];
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

      const result = await this.teacherService.getAllTeachers({
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
        message: 'Teacher list fetched successfully',
        data: result.teachers,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch teacher list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a single teacher by ID
  @Get(':id')
  async getATeacher(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: TeacherDetailDto;
  }> {
    try {
      const teacher = await this.teacherService.getTeacherById(id);

      if (!teacher) {
        throw new HttpException(
          {
            success: false,
            message: 'Teacher not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Teacher details fetched successfully',
        data: teacher,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch teacher details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a new teacher
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createTeacher(
    @Body() createTeacherDto: CreateTeacherDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<CreateTeacherResponseDto> {
    try {
      // Validate file type if image is provided
      if (imageFile) {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
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

      const teacher = await this.teacherService.createTeacher(
        createTeacherDto,
        imageFile,
      );

      return {
        success: true,
        message: 'Teacher created successfully',
        data: {
          ...teacher,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create teacher',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Update teacher
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async updateTeacher(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ): Promise<UpdateTeacherResponseDto> {
    try {
      // Validate file type if image is provided
      if (imageFile) {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
        ];
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
      const hasUpdates = Object.keys(updateTeacherDto).length > 0 || imageFile;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      const teacher = await this.teacherService.updateTeacher(
        id,
        updateTeacherDto,
        imageFile,
      );

      return {
        success: true,
        message: 'Teacher updated successfully',
        data: {
          ...teacher,
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
          message: 'Failed to update teacher',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Soft delete teacher
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteTeacher(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await this.teacherService.deleteTeacher(id);

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
          message: 'Failed to delete teacher',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get teacher by user ID (useful for profile management)
  @Get('user/:userId')
  async getTeacherByUserId(@Param('userId') userId: string): Promise<{
    success: boolean;
    message: string;
    data: TeacherDetailDto;
  }> {
    try {
      const teacher = await this.teacherService.getTeacherByUserId(userId);

      if (!teacher) {
        throw new HttpException(
          {
            success: false,
            message: 'Teacher not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Teacher details fetched successfully',
        data: teacher,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch teacher details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}