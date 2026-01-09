import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { SubjectService } from './subject.service';
import {
  CreateSubjectDto,
  CreateSubjectResponseDto,
  SubjectDetailDto,
  SubjectsResponseDto,
  UpdateSubjectDto,
  UpdateSubjectResponseDto,
} from './subject.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TEACHER)
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async getAllSubjects(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('program') programId?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy: string = 'name',
    @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
    @Query('is_active') isActive?: string,
  ): Promise<SubjectsResponseDto> {
    try {
      const allowedSortFields = [
        'code',
        'name',
        'total_hours',
        'credits',
        'program_name',
        'created_at',
      ];
      if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'name';
      }

      if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
        sortOrder = 'ASC';
      }

      // Parse is_active query parameter
      let isActiveBoolean: boolean | undefined;
      if (isActive !== undefined) {
        isActiveBoolean = isActive.toLowerCase() === 'true';
      }

      const result = await this.subjectService.getAllSubjects({
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        programId: programId ? parseInt(programId) : undefined,
        search,
        sortBy,
        sortOrder,
        isActive: isActiveBoolean,
      });

      return {
        success: true,
        message: 'Subject list fetched successfully',
        data: result.subjects,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch subject list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getASubject(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: SubjectDetailDto;
  }> {
    try {
      const subject = await this.subjectService.getSubjectById(id);

      return {
        success: true,
        message: 'Subject details fetched successfully',
        data: subject,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch subject details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @Roles(Role.ADMIN)
  async createSubject(
    @Body() createSubjectDto: CreateSubjectDto,
  ): Promise<CreateSubjectResponseDto> {
    try {
      const subject = await this.subjectService.createSubject(createSubjectDto);

      return {
        success: true,
        message: 'Subject created successfully',
        data: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          description: subject.description,
          total_hours: subject.total_hours,
          credits: subject.credits,
          program_name: subject.program_name,
          program_id: subject.program_id,
          teacher_name: subject.teacher_name,
          teacher_code: subject.teacher_code,
          teacher_info_id: subject.teacher_info_id,
          semester_names: subject.semester_names,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create subject',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<UpdateSubjectResponseDto> {
    try {
      const hasUpdates = Object.keys(updateSubjectDto).length > 0;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      const subject = await this.subjectService.updateSubject(
        id,
        updateSubjectDto,
      );

      return {
        success: true,
        message: 'Subject updated successfully',
        data: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          description: subject.description,
          total_hours: subject.total_hours,
          credits: subject.credits,
          program_name: subject.program_name,
          program_id: subject.program_id,
          teacher_name: subject.teacher_name,
          teacher_code: subject.teacher_code,
          teacher_info_id: subject.teacher_info_id,
          semester_names: subject.semester_names,
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
          message: 'Failed to update subject',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async deleteSubject(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await this.subjectService.deleteSubject(id);

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
          message: 'Failed to delete subject',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
