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
import { ProgramService } from './program.service';
import { CreateProgramDto, CreateProgramResponseDto, ProgramDetailDto, ProgramsResponseDto, UpdateProgramDto, UpdateProgramResponseDto } from './program.dto';


@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Get()
  async getAllPrograms(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('department') departmentId?: string,
    @Query('degree_lvl') degreeLvl?: string,
    @Query('search') search?: string,
    @Query('sort_by') sortBy: string = 'name',
    @Query('sort_order') sortOrder: 'ASC' | 'DESC' = 'ASC',
    @Query('is_active') isActive?: string,
  ): Promise<ProgramsResponseDto> {
    try {
      const allowedSortFields = [
        'name',
        'degree_lvl',
        'duration',
        'department_name',
        'created_at',
      ];
      if (!allowedSortFields.includes(sortBy)) {
        sortBy = 'name';
      }

      if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
        sortOrder = 'ASC';
      }

      // Validate degree_lvl if provided
      let validDegreeLvl: string | undefined;
      if (degreeLvl) {
        const degreeLevels = ['Bachelor', 'High Bachelor', 'Master', 'PHD'];
        const degreeLvlCapitalized = degreeLvl.charAt(0).toUpperCase() + degreeLvl.slice(1).toLowerCase();
        if (degreeLevels.includes(degreeLvlCapitalized)) {
          validDegreeLvl = degreeLvlCapitalized;
        }
      }

      // Parse is_active query parameter
      let isActiveBoolean: boolean | undefined;
      if (isActive !== undefined) {
        isActiveBoolean = isActive.toLowerCase() === 'true';
      }

      const result = await this.programService.getAllPrograms({
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        degreeLvl: validDegreeLvl,
        search,
        sortBy,
        sortOrder,
        isActive: isActiveBoolean,
      });

      return {
        success: true,
        message: 'Program list fetched successfully',
        data: result.programs,
        data_setup: result.dataSetup,
        meta: result.meta,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch program list',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Get a single program by ID
  @Get(':id')
  async getAProgram(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
    data: ProgramDetailDto;
  }> {
    try {
      const program = await this.programService.getProgramById(id);

      if (!program) {
        throw new HttpException(
          {
            success: false,
            message: 'Program not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Program details fetched successfully',
        data: program,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch program details',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create a new program
  @Post()
  async createProgram(
    @Body() createProgramDto: CreateProgramDto,
  ): Promise<CreateProgramResponseDto> {
    try {
      const program = await this.programService.createProgram(createProgramDto);

      return {
        success: true,
        message: 'Program created successfully',
        data: {
          ...program,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create program',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Update program
  @Patch(':id')
  async updateProgram(
    @Param('id') id: string,
    @Body() updateProgramDto: UpdateProgramDto,
  ): Promise<UpdateProgramResponseDto> {
    try {
      const hasUpdates = Object.keys(updateProgramDto).length > 0;
      if (!hasUpdates) {
        throw new BadRequestException('No update data provided');
      }

      const program = await this.programService.updateProgram(id, updateProgramDto);

      return {
        success: true,
        message: 'Program updated successfully',
        data: {
          ...program,
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
          message: 'Failed to update program',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Soft delete program
  @Delete(':id')
  async deleteProgram(@Param('id') id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const result = await this.programService.deleteProgram(id);

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
          message: 'Failed to delete program',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}