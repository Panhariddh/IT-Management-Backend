import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { UserModel } from 'src/app/database/models/user.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';

import {
  CreateDepartmentDto,
  CreateDepartmentResponseDto,
  CreateSectionDto,
  CreateUpdateSectionResponseDto,
  DepartmentDetailDto,
  DepartmentDto,
  MetaDto,
  SectionDetailDto,
  SectionDto,
  UpdateDepartmentDto,
  UpdateDepartmentResponseDto,
  UpdateSectionDto,
} from './department.dto';
import { SectionModel } from 'src/app/database/models/division/section.model';

interface GetAllDepartmentsParams {
  page: number;
  limit: number;
  search?: string;
}

interface GetAllDepartmentsResult {
  departments: DepartmentDto[];
  meta: MetaDto;
}

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(DepartmentModel)
    private departmentRepository: Repository<DepartmentModel>,
    @InjectRepository(HodInfoModel)
    private hodInfoRepository: Repository<HodInfoModel>,
    @InjectRepository(SectionModel)
    private sectionRepository: Repository<SectionModel>,
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}

  async getAllDepartments(
    params: GetAllDepartmentsParams,
  ): Promise<GetAllDepartmentsResult> {
    const { page, limit, search } = params;
    const skip = (page - 1) * limit;

    // Build query
    const query = this.departmentRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.head', 'head')
      .orderBy('department.name', 'ASC');

    // Apply search filter
    if (search) {
      const cleanSearch = search.trim().toLowerCase();

      query.andWhere('LOWER(department.name) LIKE :search', {
        search: `%${cleanSearch}%`,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const departments = await query.skip(skip).take(limit).getMany();

    // Transform to DTO
    const departmentDtos: DepartmentDto[] = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      description: dept.description || undefined,
      created_at: dept.createdAt,
    }));

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    return {
      departments: departmentDtos,
      meta,
    };
  }

  async getDepartmentById(id: string): Promise<DepartmentDetailDto> {
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Get sections belonging to this department
    const sections = await this.sectionRepository.find({
      where: { department_id: department.id },
      order: { name: 'ASC' },
    });

    // Transform sections to DTO
    const sectionDtos: SectionDto[] = sections.map((section) => ({
      id: section.id,
      name: section.name,
      created_at: section.createdAt,
    }));

    return {
      id: department.id,
      name: department.name,
      description: department.description || undefined,
      created_at: department.createdAt,
      sections: sectionDtos,
    };
  }

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<CreateDepartmentResponseDto> {
    // Check if department name already exists
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });

    if (existingDepartment) {
      throw new BadRequestException(
        `Department "${createDepartmentDto.name}" already exists`,
      );
    }

    // Validate head_user_id if provided
    if (createDepartmentDto.head_user_id) {
      const headUser = await this.userRepository.findOne({
        where: { id: createDepartmentDto.head_user_id },
      });

      if (!headUser) {
        throw new NotFoundException(
          `User with ID ${createDepartmentDto.head_user_id} not found`,
        );
      }
    }

    // Create department
    const department = this.departmentRepository.create({
      name: createDepartmentDto.name,
      description: createDepartmentDto.description,
      head_user_id: createDepartmentDto.head_user_id || null,
    });

    const savedDepartment = await this.departmentRepository.save(department);

    // Fetch with relations for response
    const departmentWithHead = await this.departmentRepository.findOne({
      where: { id: savedDepartment.id },
      relations: ['head'],
    });

    if (!departmentWithHead) {
      throw new Error('Failed to fetch created department data');
    }

    return {
      success: true,
      message: 'Department created successfully',
      data: {
        id: departmentWithHead.id,
        name: departmentWithHead.name,
        description: departmentWithHead.description || undefined,
        head_user_id: departmentWithHead.head_user_id || undefined,
        head_name: departmentWithHead.head
          ? `${departmentWithHead.head.name_en}${departmentWithHead.head.name_kh ? ` (${departmentWithHead.head.name_kh})` : ''}`
          : undefined,
      },
    };
  }

  async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<UpdateDepartmentResponseDto> {
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['head'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if new name conflicts with existing department
    if (
      updateDepartmentDto.name &&
      updateDepartmentDto.name !== department.name
    ) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: updateDepartmentDto.name },
      });

      if (existingDepartment && existingDepartment.id !== parseInt(id)) {
        throw new BadRequestException(
          `Department "${updateDepartmentDto.name}" already exists`,
        );
      }
    }

    // Validate head_user_id if provided
    if (updateDepartmentDto.head_user_id !== undefined) {
      if (updateDepartmentDto.head_user_id) {
        const headUser = await this.userRepository.findOne({
          where: { id: updateDepartmentDto.head_user_id },
        });

        if (!headUser) {
          throw new NotFoundException(
            `User with ID ${updateDepartmentDto.head_user_id} not found`,
          );
        }
      }
    }

    // Update department
    const updateData: any = {};
    if (updateDepartmentDto.name !== undefined)
      updateData.name = updateDepartmentDto.name;
    if (updateDepartmentDto.description !== undefined)
      updateData.description = updateDepartmentDto.description;
    if (updateDepartmentDto.head_user_id !== undefined)
      updateData.head_user_id = updateDepartmentDto.head_user_id || null;

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    await this.departmentRepository.update(parseInt(id), updateData);

    // Fetch updated department with relations
    const updatedDepartment = await this.departmentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['head'],
    });

    if (!updatedDepartment) {
      throw new Error('Failed to fetch updated department data');
    }

    return {
      success: true,
      message: 'Department updated successfully',
      data: {
        id: updatedDepartment.id,
        name: updatedDepartment.name,
        description: updatedDepartment.description || undefined,
        head_user_id: updatedDepartment.head_user_id || undefined,
        head_name: updatedDepartment.head
          ? `${updatedDepartment.head.name_en}${updatedDepartment.head.name_kh ? ` (${updatedDepartment.head.name_kh})` : ''}`
          : undefined,
      },
    };
  }

  async deleteDepartment(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Check if department has sections
    const sectionCount = await this.sectionRepository.count({
      where: { department_id: parseInt(id) },
    });

    if (sectionCount > 0) {
      throw new BadRequestException(
        `Cannot delete department "${department.name}" because it has ${sectionCount} section(s). Please delete or move the sections first.`,
      );
    }

    // Check if department has HODs assigned
    const hodCount = await this.hodInfoRepository.count({
      where: { department_id: parseInt(id), is_active: true },
    });

    if (hodCount > 0) {
      throw new BadRequestException(
        `Cannot delete department "${department.name}" because it has ${hodCount} HOD(s) assigned. Please reassign or remove the HODs first.`,
      );
    }

    await this.departmentRepository.delete(parseInt(id));

    return {
      success: true,
      message: `Department "${department.name}" deleted successfully`,
    };
  }

  async getSectionById(
    departmentId: string,
    sectionId: string,
  ): Promise<SectionDetailDto> {
    // Verify department exists
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(departmentId) },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    const section = await this.sectionRepository.findOne({
      where: {
        id: parseInt(sectionId),
        department_id: parseInt(departmentId),
      },
      relations: ['department'],
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in department ${departmentId}`,
      );
    }

    return {
      id: section.id,
      name: section.name,
      description: section.description || undefined,
      department_name: section.department?.name,
      created_at: section.createdAt,
    };
  }

  async createSection(
    departmentId: string,
    createSectionDto: CreateSectionDto,
  ): Promise<CreateUpdateSectionResponseDto> {
    // Verify department exists
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(departmentId) },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    // Check if section name already exists in this department
    const existingSection = await this.sectionRepository.findOne({
      where: {
        name: createSectionDto.name,
        department_id: parseInt(departmentId),
      },
    });

    if (existingSection) {
      throw new NotFoundException(
        `Section "${createSectionDto.name}" already exists in this department`,
      );
    }

    // Create section
    const section = this.sectionRepository.create({
      name: createSectionDto.name,
      description: createSectionDto.description,
      department_id: parseInt(departmentId),
    });

    const savedSection = await this.sectionRepository.save(section);

    // Fetch with relations for response
    const sectionWithDepartment = await this.sectionRepository.findOne({
      where: { id: savedSection.id },
      relations: ['department'],
    });

    if (!sectionWithDepartment) {
      throw new Error('Failed to fetch created section data');
    }

    return {
      success: true,
      message: 'Section created successfully',
      data: {
        id: sectionWithDepartment.id,
        name: sectionWithDepartment.name,
        description: sectionWithDepartment.description || undefined,
        department_id: sectionWithDepartment.department_id,
        department_name: sectionWithDepartment.department?.name,
      },
    };
  }

  async updateSection(
    departmentId: string,
    sectionId: string,
    updateSectionDto: UpdateSectionDto,
  ): Promise<CreateUpdateSectionResponseDto> {
    // Verify department exists
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(departmentId) },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    // Find section
    const section = await this.sectionRepository.findOne({
      where: {
        id: parseInt(sectionId),
        department_id: parseInt(departmentId),
      },
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in department ${departmentId}`,
      );
    }

    // Check if new name conflicts with existing section in same department
    if (updateSectionDto.name && updateSectionDto.name !== section.name) {
      const existingSection = await this.sectionRepository.findOne({
        where: {
          name: updateSectionDto.name,
          department_id: parseInt(departmentId),
        },
      });

      if (existingSection && existingSection.id !== parseInt(sectionId)) {
        throw new NotFoundException(
          `Section "${updateSectionDto.name}" already exists in this department`,
        );
      }
    }

    // Update section
    const updateData: any = {};
    if (updateSectionDto.name !== undefined)
      updateData.name = updateSectionDto.name;
    if (updateSectionDto.description !== undefined)
      updateData.description = updateSectionDto.description;

    // Only allow changing department if explicitly provided
    if (updateSectionDto.department_id !== undefined) {
      updateData.department_id = updateSectionDto.department_id;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No update data provided');
    }

    await this.sectionRepository.update(parseInt(sectionId), updateData);

    // Fetch updated section with relations
    const updatedSection = await this.sectionRepository.findOne({
      where: { id: parseInt(sectionId) },
      relations: ['department'],
    });

    if (!updatedSection) {
      throw new Error('Failed to fetch updated section data');
    }

    return {
      success: true,
      message: 'Section updated successfully',
      data: {
        id: updatedSection.id,
        name: updatedSection.name,
        description: updatedSection.description || undefined,
        department_id: updatedSection.department_id,
        department_name: updatedSection.department?.name,
      },
    };
  }

  async deleteSection(
    departmentId: string,
    sectionId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Verify department exists
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(departmentId) },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    const section = await this.sectionRepository.findOne({
      where: {
        id: parseInt(sectionId),
        department_id: parseInt(departmentId),
      },
    });

    if (!section) {
      throw new NotFoundException(
        `Section with ID ${sectionId} not found in department ${departmentId}`,
      );
    }

    await this.sectionRepository.delete(parseInt(sectionId));

    return {
      success: true,
      message: `Section "${section.name}" deleted successfully`,
    };
  }
}
