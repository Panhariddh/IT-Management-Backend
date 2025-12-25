import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { UserModel } from 'src/app/database/models/user.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';

import { DepartmentDetailDto, DepartmentDto, MetaDto } from './department.dto';
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
      head_user_id: dept.head_user_id || undefined,
      head_name: dept.head
        ? `${dept.head.name_en}${dept.head.name_kh ? ` (${dept.head.name_kh})` : ''}`
        : undefined,
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
      relations: ['head'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // Get additional statistics
    const [totalHods, totalSections] = await Promise.all([
      this.getHodCountByDepartment(department.id),
      this.getSectionCountByDepartment(department.id),
    ]);

    return {
      id: department.id,
      name: department.name,
      head_user_id: department.head_user_id || undefined,
      head_details: department.head
        ? {
            id: department.head.id,
            name_en: department.head.name_en,
            name_kh: department.head.name_kh,
            email: department.head.email,
          }
        : undefined,
      total_hods: totalHods,
      total_sections: totalSections,
      created_at: department.createdAt,
    };
  }

  private async getHodCountByDepartment(departmentId: number): Promise<number> {
    return await this.hodInfoRepository
      .createQueryBuilder('hod')
      .innerJoin('hod.user', 'user')
      .where('hod.department_id = :departmentId', { departmentId })
      .andWhere('hod.is_active = :isActive', { isActive: true })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .getCount();
  }

  private async getSectionCountByDepartment(
    departmentId: number,
  ): Promise<number> {
    return await this.sectionRepository
      .createQueryBuilder('section')
      .where('section.department_id = :departmentId', { departmentId })
      .getCount();
  }
}
