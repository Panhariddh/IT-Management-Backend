import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
  Param,
  Post,
  Body,
  NotFoundException,
  BadRequestException,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/app/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/app/common/guards/roles.guard';
import { Roles } from 'src/app/common/decorators/roles.decorator';
import { Role } from 'src/app/common/enum/role.enum';
import { DepartmentService } from './department.service';
import {
  DepartmentResponseDto,
  DepartmentDetailDto,
  CreateSectionDto,
  CreateUpdateSectionResponseDto,
  UpdateSectionDto,
  SectionResponseDto,
  UpdateDepartmentDto,
  UpdateDepartmentResponseDto,
  CreateDepartmentDto,
  CreateDepartmentResponseDto,
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


  // Create a new department
@Post()
async createDepartment(
  @Body() createDepartmentDto: CreateDepartmentDto,
): Promise<CreateDepartmentResponseDto> {
  try {
    const result = await this.departmentService.createDepartment(
      createDepartmentDto,
    );
    return result;
  } catch (error) {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      {
        success: false,
        message: 'Failed to create department',
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// Update a department
@Patch(':id')
async updateDepartment(
  @Param('id') id: string,
  @Body() updateDepartmentDto: UpdateDepartmentDto,
): Promise<UpdateDepartmentResponseDto> {
  try {
    const result = await this.departmentService.updateDepartment(
      id,
      updateDepartmentDto,
    );
    return result;
  } catch (error) {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      {
        success: false,
        message: 'Failed to update department',
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// Delete a department
@Delete(':id')
@HttpCode(HttpStatus.OK)
async deleteDepartment(
  @Param('id') id: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const result = await this.departmentService.deleteDepartment(id);
    return result;
  } catch (error) {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      {
        success: false,
        message: 'Failed to delete department',
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

  // Get a single section in a department
  @Get(':departmentId/sections/:sectionId')
  async getSectionById(
    @Param('departmentId') departmentId: string,
    @Param('sectionId') sectionId: string,
  ): Promise<SectionResponseDto> {
    try {
      const section = await this.departmentService.getSectionById(
        departmentId,
        sectionId,
      );

      return {
        success: true,
        message: 'Section details fetched successfully',
        data: section,
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
          message: 'Failed to fetch section details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a new section in a department
  @Post(':departmentId/sections')
  async createSection(
    @Param('departmentId') departmentId: string,
    @Body() createSectionDto: CreateSectionDto,
  ): Promise<CreateUpdateSectionResponseDto> {
    try {
      // Override department_id from path parameter
      createSectionDto.department_id = parseInt(departmentId);

      const result = await this.departmentService.createSection(
        departmentId,
        createSectionDto,
      );
      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create section',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Update a section in a department
  @Patch(':departmentId/sections/:sectionId')
  async updateSection(
    @Param('departmentId') departmentId: string,
    @Param('sectionId') sectionId: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ): Promise<CreateUpdateSectionResponseDto> {
    try {
      const result = await this.departmentService.updateSection(
        departmentId,
        sectionId,
        updateSectionDto,
      );
      return result;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update section',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Delete a section from a department
  @Delete(':departmentId/sections/:sectionId')
  @HttpCode(HttpStatus.OK)
  async deleteSection(
    @Param('departmentId') departmentId: string,
    @Param('sectionId') sectionId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await this.departmentService.deleteSection(
        departmentId,
        sectionId,
      );
      return result;
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
          message: 'Failed to delete section',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
