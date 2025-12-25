import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { DepartmentService } from './department.service';
import {
  DepartmentResponseDto,
  DepartmentDetailDto,
} from './department.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // Get all departments with pagination and search
  @Get()
  async getAllDepartments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<DepartmentResponseDto> {
    try {
      const result = await this.departmentService.getAllDepartments({
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        search,
      });

      return {
        success: true,
        message: 'Department list fetched successfully',
        data: result.departments,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch department list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a single department by ID
  @Get(':id')
  async getADepartment(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: DepartmentDetailDto;
  }> {
    try {
      const department = await this.departmentService.getDepartmentById(id);

      if (!department) {
        throw new HttpException(
          {
            success: false,
            message: 'Department not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Department details fetched successfully',
        data: department,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch department details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}