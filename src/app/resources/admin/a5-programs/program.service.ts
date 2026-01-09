import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { DegreeLevel } from 'src/app/common/enum/degree.enum';
import {
  CreateProgramDto,
  DataSetupDto,
  MetaDto,
  ProgramDetailDto,
  ProgramDto,
  UpdateProgramDto,
} from './program.dto';

interface GetAllProgramsParams {
  page: number;
  limit: number;
  departmentId?: number;
  degreeLvl?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isActive?: boolean;
}

interface GetAllProgramsResult {
  programs: ProgramDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class ProgramService {
  constructor(
    @InjectRepository(ProgramModel)
    private programRepository: Repository<ProgramModel>,
    @InjectRepository(DepartmentModel)
    private departmentRepository: Repository<DepartmentModel>,
  ) {}

  async getAllPrograms(
    params: GetAllProgramsParams,
  ): Promise<GetAllProgramsResult> {
    const {
      page,
      limit,
      departmentId,
      degreeLvl,
      search,
      sortBy,
      sortOrder,
      isActive,
    } = params;
    const skip = (page - 1) * limit;

    const query = this.programRepository
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.department', 'department');

    if (isActive !== undefined) {
      query.andWhere('program.is_active = :isActive', { isActive });
    } else {
      query.andWhere('program.is_active = :isActive', { isActive: true });
    }

    if (departmentId) {
      query.andWhere('program.department_id = :departmentId', { departmentId });
    }

    if (degreeLvl) {
      query.andWhere('program.degree_lvl = :degreeLvl', { degreeLvl });
    }

    if (search) {
      const cleanSearch = search.trim().toLowerCase();

      query.andWhere(
        `(
      LOWER(program.name) LIKE :search
      OR LOWER(department.name) LIKE :search
    )`,
        { search: `%${cleanSearch}%` },
      );
    }

    this.applySorting(query, sortBy, sortOrder);

    const total = await query.getCount();

    const programs = await query.skip(skip).take(limit).getMany();

    const programDtos: ProgramDto[] = programs.map((program) => ({
      id: program.id.toString(),
      name: program.name,
      degree_lvl: program.degree_lvl,
      duration: program.duration,
      department_name: program.department?.name || '',
      department_id: program.department_id || undefined,
    }));

    const dataSetup = await this.getDataSetup();

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    return {
      programs: programDtos,
      dataSetup,
      meta,
    };
  }

  async getProgramById(id: string): Promise<ProgramDetailDto> {
    const program = await this.programRepository.findOne({
      where: { id: parseInt(id), is_active: true },
      relations: ['department'],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    return {
      id: program.id.toString(),
      name: program.name,
      degree_lvl: program.degree_lvl,
      duration: program.duration,
      department_name: program.department?.name || '',
      department_id: program.department_id || undefined,
      created_at: program.createdAt,
      updated_at: program.updatedAt || program.createdAt,
    };
  }

  async createProgram(
    createProgramDto: CreateProgramDto,
  ): Promise<ProgramDetailDto> {
    if (
      createProgramDto.department_id !== undefined &&
      createProgramDto.department_id !== null
    ) {
      await this.validateDepartmentReference(createProgramDto.department_id);
    }

    const programData: Partial<ProgramModel> = {
      name: createProgramDto.name,
      degree_lvl: createProgramDto.degree_lvl,
      duration: createProgramDto.duration,
      is_active: true,
    };

    if (createProgramDto.department_id && createProgramDto.department_id > 0) {
      programData.department_id = createProgramDto.department_id;
    }

    const program = this.programRepository.create(programData);
    const savedProgram = await this.programRepository.save(program);

    const completeProgram = await this.programRepository.findOne({
      where: { id: savedProgram.id },
      relations: ['department'],
    });

    if (!completeProgram) {
      throw new Error('Failed to fetch created program data');
    }

    return {
      id: completeProgram.id.toString(),
      name: completeProgram.name,
      degree_lvl: completeProgram.degree_lvl,
      duration: completeProgram.duration,
      department_name: completeProgram.department?.name || '',
      department_id: completeProgram.department_id || undefined,
      created_at: completeProgram.createdAt,
      updated_at: completeProgram.updatedAt || completeProgram.createdAt,
    };
  }

  async updateProgram(
    id: string,
    updateProgramDto: UpdateProgramDto,
  ): Promise<ProgramDetailDto> {
    const program = await this.programRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['department'],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    if (updateProgramDto.department_id !== undefined) {
      if (
        updateProgramDto.department_id !== null &&
        updateProgramDto.department_id > 0
      ) {
        await this.validateDepartmentReference(updateProgramDto.department_id);
      }
    }

    // Update program
    if (updateProgramDto.name !== undefined) {
      program.name = updateProgramDto.name;
    }
    if (updateProgramDto.degree_lvl !== undefined) {
      program.degree_lvl = updateProgramDto.degree_lvl;
    }
    if (updateProgramDto.duration !== undefined) {
      program.duration = updateProgramDto.duration;
    }
    if (updateProgramDto.department_id !== undefined) {
      program.department_id =
        updateProgramDto.department_id > 0
          ? updateProgramDto.department_id
          : undefined;
    }
    if (updateProgramDto.is_active !== undefined) {
      program.is_active = updateProgramDto.is_active;
    }

    program.updatedAt = new Date();

    const updatedProgram = await this.programRepository.save(program);

    const completeProgram = await this.programRepository.findOne({
      where: { id: updatedProgram.id },
      relations: ['department'],
    });

    if (!completeProgram) {
      throw new Error('Failed to fetch updated program data');
    }

    return {
      id: completeProgram.id.toString(),
      name: completeProgram.name,
      degree_lvl: completeProgram.degree_lvl,
      duration: completeProgram.duration,
      department_name: completeProgram.department?.name || '',
      department_id: completeProgram.department_id || undefined,
      created_at: completeProgram.createdAt,
      updated_at: completeProgram.updatedAt || completeProgram.createdAt,
    };
  }

  async deleteProgram(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const program = await this.programRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    // Soft delete the program
    program.is_active = false;
    program.updatedAt = new Date();
    await this.programRepository.save(program);

    return {
      success: true,
      message: `Program "${program.name}" has been deleted successfully`,
    };
  }

  private applySorting(
    query: any,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    switch (sortBy) {
      case 'name':
        query.orderBy('program.name', sortOrder);
        break;
      case 'duration':
        query.orderBy('program.duration', sortOrder);
        break;
      case 'department_name':
        query.orderBy('department.name', sortOrder);
        break;
      case 'created_at':
        query.orderBy('program.createdAt', sortOrder);
        break;
      default:
        query.orderBy('program.name', sortOrder);
        break;
    }
  }

  private async getDataSetup(): Promise<DataSetupDto> {
    const departments = await this.departmentRepository
      .createQueryBuilder('department')
      .select(['department.id', 'department.name'])
      .where('department.is_active = :isActive', { isActive: true })
      .orderBy('department.name', 'ASC')
      .getMany();

    // Define degree levels
    const degreeLevels = [
      { value: DegreeLevel.BACHELOR, label: 'Bachelor' },
      { value: DegreeLevel.HIGH_BACHELOR, label: 'High Bachelor' },
      { value: DegreeLevel.MASTER, label: 'Master' },
      { value: DegreeLevel.PHD, label: 'PHD' },
    ];

    return {
      departments,
      degree_levels: degreeLevels,
    };
  }

  private async validateDepartmentReference(
    departmentId: number,
  ): Promise<void> {
    if (departmentId && departmentId > 0) {
      const department = await this.departmentRepository
        .createQueryBuilder('department')
        .where('department.id = :id', { id: departmentId })
        .andWhere('department.is_active = :isActive', { isActive: true })
        .getOne();

      if (!department) {
        throw new Error(`Department ${departmentId} not found or inactive`);
      }
    }
  }
}
