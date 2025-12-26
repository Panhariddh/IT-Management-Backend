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
  DataSetupDto,
  DepartmentDetailDto,
  DepartmentDto,
  MetaDto,
  SectionDetailDto,
  SectionDto,
  UpdateDepartmentDto,
  UpdateDepartmentResponseDto,
  UpdateSectionDto,
  UserOptionDto,
} from './department.dto';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { Role } from 'src/app/common/enum/role.enum';

interface GetAllDepartmentsParams {
  page: number;
  limit: number;
  search?: string;
}

interface GetAllDepartmentsResult {
  departments: DepartmentDto[];
  meta: MetaDto;
  dataSetup: DataSetupDto;
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
    const query = this.departmentRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.head', 'head')
      .orderBy('department.name', 'ASC');

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
      hod_name: dept.head
        ? `${dept.head.name_kh}${
            dept.head.name_kh ? ` (${dept.head.name_en})` : ''
          }`
        : undefined,
      hod_user_id: dept.head?.id,
      created_at: dept.createdAt,
    }));

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    const dataSetup = await this.getDataSetup();

    return {
      departments: departmentDtos,
      meta,
      dataSetup,
    };
  }

  private async getDataSetup(): Promise<DataSetupDto> {
    const headUserOptions = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.name_en', 'user.name_kh'])
      .where('user.is_active = :isActive', { isActive: true })
      .andWhere('(user.role = :hodRole)', {
        hodRole: Role.HEAD_OF_DEPARTMENT,
      })
      .orderBy('user.name_en', 'ASC')
      .getMany();

    // Transform to UserOptionDto
    const userOptions: UserOptionDto[] = headUserOptions.map((user) => ({
      id: user.id,
      name: user.name_kh ? `${user.name_kh} (${user.name_en})` : user.name_en,
    }));

    return {
      head_of_departments: userOptions,
    };
  }

  async getDepartmentById(id: string): Promise<DepartmentDetailDto> {
    // Add 'head' to relations to load the HOD information
    const department = await this.departmentRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['head'], // Add this line to load the head relation
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
      hod_name: department.head
        ? `${department.head.name_kh}${
            department.head.name_kh ? ` (${department.head.name_en})` : ''
          }`
        : undefined,
      hod_user_id: department.head?.id,
      created_at: department.createdAt,
      sections: sectionDtos,
    };
  }

  async createDepartment(
    createDepartmentDto: CreateDepartmentDto,
  ): Promise<CreateDepartmentResponseDto> {
    // Check duplicate department name
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: createDepartmentDto.name },
    });

    if (existingDepartment) {
      throw new BadRequestException(
        `Department "${createDepartmentDto.name}" already exists`,
      );
    }
    let headUser: UserModel | undefined;

    if (createDepartmentDto.hod_user_id) {
      const user = await this.userRepository.findOne({
        where: { id: createDepartmentDto.hod_user_id },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${createDepartmentDto.hod_user_id} not found`,
        );
      }

      headUser = user;
    }

    const department = this.departmentRepository.create({
      name: createDepartmentDto.name,
      description: createDepartmentDto.description,
      ...(headUser && { head: headUser }),
    });

    const savedDepartment = await this.departmentRepository.save(department);

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
        hod_user_id: departmentWithHead.head?.id,
        hod_name: departmentWithHead.head
          ? `${departmentWithHead.head.name_kh}${
              departmentWithHead.head.name_kh
                ? ` (${departmentWithHead.head.name_en})`
                : ''
            }`
          : undefined,
      },
    };
  }

  async updateDepartment(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<UpdateDepartmentResponseDto> {
    const departmentId = parseInt(id, 10);

    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
      relations: ['head'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    if (
      updateDepartmentDto.name &&
      updateDepartmentDto.name !== department.name
    ) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { name: updateDepartmentDto.name },
      });

      if (existingDepartment && existingDepartment.id !== departmentId) {
        throw new BadRequestException(
          `Department "${updateDepartmentDto.name}" already exists`,
        );
      }
    }

    if (updateDepartmentDto.name !== undefined) {
      department.name = updateDepartmentDto.name;
    }

    if (updateDepartmentDto.description !== undefined) {
      department.description = updateDepartmentDto.description;
    }

    if (updateDepartmentDto.hod_user_id !== undefined) {
      const headUser = await this.userRepository.findOne({
        where: { id: updateDepartmentDto.hod_user_id },
      });

      if (!headUser) {
        throw new NotFoundException(
          `User with ID ${updateDepartmentDto.hod_user_id} not found`,
        );
      }

      department.head = headUser;
    }

    const savedDepartment = await this.departmentRepository.save(department);

    return {
      success: true,
      message: 'Department updated successfully',
      data: {
        id: savedDepartment.id,
        name: savedDepartment.name,
        description: savedDepartment.description || undefined,
        hod_user_id: savedDepartment.head?.id,
        hod_name: savedDepartment.head
          ? `${savedDepartment.head.name_kh}${
              savedDepartment.head.name_kh
                ? ` (${savedDepartment.head.name_en})`
                : ''
            }`
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
