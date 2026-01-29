import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  Param,
  Req,
  
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import {
  StudentDetailDto,
  StudentsResponseDto,
} from './students.dto';

import { TeacherStudentService } from './students.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
export class TeacherStudentController {
  constructor(private readonly studentService: TeacherStudentService) {}

  @Get()
  async getAllStudents(
    @Req() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    // ❌ remove department query param
    @Query('section') sectionId?: string,
    @Query('program') programId?: string,
    @Query('academic_year') academicYearId?: string,
    @Query('gender') gender?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy: string = 'id',
    @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<StudentsResponseDto> {
    try {
      // ✅ from your JwtStrategy validate() return
      const userId = req.user?.userId;
      if (!userId) {
        throw new HttpException(
          { success: false, message: 'Unauthorized: userId not found' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      const allowedSortFields = ['name_en', 'name_kh', 'dob', 'student_id'];
      if (!allowedSortFields.includes(sortBy)) sortBy = 'name_en';
      if (sortOrder !== 'ASC' && sortOrder !== 'DESC') sortOrder = 'ASC';

      let validGender: string | undefined;
      if (gender) {
        const genderLower = gender.toLowerCase();
        if (['male', 'female', 'm', 'f'].includes(genderLower)) {
          if (genderLower === 'm') validGender = 'Male';
          else if (genderLower === 'f') validGender = 'Female';
          else validGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        }
      }

      const result = await this.studentService.getAllStudents({
        userId, 
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        sectionId: sectionId ? parseInt(sectionId) : undefined,
        programId: programId ? parseInt(programId) : undefined,
        academicYearId: academicYearId ? parseInt(academicYearId) : undefined,
        gender: validGender,
        search,
        sortBy,
        sortOrder,
      });

      return {
        success: true,
        message: 'Student list fetched successfully',
        data: result.students,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch student list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a single student by ID
  @Get(':id')
  async getAStudent(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: StudentDetailDto;
  }> {
    try {
      const student = await this.studentService.getStudentById(id);

      if (!student) {
        throw new HttpException(
          {
            success: false,
            message: 'Student not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Student details fetched successfully',
        data: student,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch student details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
