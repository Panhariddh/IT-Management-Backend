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
import { SemesterService } from './semester.service';
import {
  CreateSemesterDto,
  CreateSemesterResponseDto,
  SemesterResponseDto,
  SemestersResponseDto,
  UpdateSemesterDto,
  UpdateSemesterResponseDto,
} from './semester.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Get()
  async getAllSemesters(
    @Param('programId') programId: string,
  ): Promise<SemestersResponseDto> {
    try {
      // Pass programId to service
      const result = await this.semesterService.getAllSemestersByProgram(
        parseInt(programId),
      );

      return {
        success: true,
        message: 'Semester list fetched successfully',
        data: result.semesters,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch semester list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getASemester(
    @Param('programId') programId: string,
    @Param('id') id: string,
  ): Promise<SemesterResponseDto> {
    try {
      const semester = await this.semesterService.getSemesterById(id);

      // Verify the semester belongs to the specified program
      if (semester.program_id !== parseInt(programId)) {
        throw new HttpException(
          {
            success: false,
            message: 'Semester does not belong to the specified program',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Semester details fetched successfully',
        data: semester,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch semester details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createSemester(
    @Param('programId') programId: string,
    @Body() createSemesterDto: CreateSemesterDto,
  ): Promise<CreateSemesterResponseDto> {
    try {
      // Get program ID from URL parameter, NOT from body
      const programIdNum = parseInt(programId);

      // Create a new DTO object with program_id from URL
      const semesterData = {
        ...createSemesterDto,
        program_id: programIdNum, // Add program_id from URL
      };

      const semester = await this.semesterService.createSemester(semesterData);

      return {
        success: true,
        message: 'Semester created successfully',
        data: semester,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create semester',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':id')
  async updateSemester(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ): Promise<UpdateSemesterResponseDto> {
    try {
      const hasUpdates = Object.keys(updateSemesterDto).length > 0;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      // If someone tries to send program_id in body (old format), remove it
      const { program_id, ...updateData } = updateSemesterDto as any;

      if (program_id !== undefined) {
        console.warn(
          'program_id in update body is ignored. Using URL programId instead.',
        );
      }

      const semester = await this.semesterService.updateSemester(id, {
        ...updateData,
        // Don't allow changing program via this endpoint
        // Program is fixed based on URL
      });

      return {
        success: true,
        message: 'Semester updated successfully',
        data: semester,
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
          message: 'Failed to update semester',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deleteSemester(
    @Param('programId') programId: string,
    @Param('id') id: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Verify the semester belongs to the specified program
      const semester = await this.semesterService.getSemesterById(id);
      if (semester.program_id !== parseInt(programId)) {
        throw new HttpException(
          {
            success: false,
            message: 'Semester does not belong to the specified program',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const result = await this.semesterService.deleteSemester(id);

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
          message: 'Failed to delete semester',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
