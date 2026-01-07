import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SubjectModel } from 'src/app/database/models/class/subject.model';
import { SemesterModel } from 'src/app/database/models/class/semester.model';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';
import { Role } from 'src/app/common/enum/role.enum';
import {
  CreateSubjectDto,
  SubjectDetailDto,
  SubjectDto,
  SubjectMetaDto,
  SubjectSetupDto,
  TeacherDto,
  UpdateSubjectDto,
} from './subject.dto';

interface GetAllSubjectsParams {
  page: number;
  limit: number;
  programId?: number;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isActive?: boolean;
}

interface GetAllSubjectsResult {
  subjects: SubjectDto[];
  dataSetup: SubjectSetupDto;
  meta: SubjectMetaDto;
}

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(SubjectModel)
    private subjectRepository: Repository<SubjectModel>,
    @InjectRepository(ProgramModel)
    private programRepository: Repository<ProgramModel>,
    @InjectRepository(SemesterModel)
    private semesterRepository: Repository<SemesterModel>,
    @InjectRepository(TeacherInfoModel)
    private teacherInfoRepository: Repository<TeacherInfoModel>,
  ) {}

  async getAllSubjects(
    params: GetAllSubjectsParams,
  ): Promise<GetAllSubjectsResult> {
    const {
      page,
      limit,
      programId,
      search,
      sortBy,
      sortOrder,
      isActive,
    } = params;
    const skip = (page - 1) * limit;

    const query = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.program', 'program')
      .leftJoinAndSelect('subject.semesters', 'semesters')
      .leftJoinAndSelect('subject.teacherInfo', 'teacherInfo')
      .leftJoinAndSelect('teacherInfo.user', 'user')
      .leftJoinAndSelect('teacherInfo.department', 'department');

    if (isActive !== undefined) {
      query.andWhere('subject.is_active = :isActive', { isActive });
    } else {
      query.andWhere('subject.is_active = :isActive', { isActive: true });
    }

    if (programId) {
      query.andWhere('subject.program_id = :programId', { programId });
    }

    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      query.andWhere(
        `(
          LOWER(subject.code) LIKE :search
          OR LOWER(subject.name) LIKE :search
          OR LOWER(program.name) LIKE :search
          OR LOWER(subject.description) LIKE :search
          OR LOWER(user.name_en) LIKE :search
        )`,
        { search: `%${cleanSearch}%` },
      );
    }

    this.applySorting(query, sortBy, sortOrder);

    const total = await query.getCount();
    const subjects = await query.skip(skip).take(limit).getMany();

    const subjectDtos: SubjectDto[] = subjects.map((subject) => ({
      id: subject.id.toString(),
      code: subject.code,
      name: subject.name,
      description: subject.description || '',
      total_hours: subject.total_hours,
      credits: subject.credits,
      program_name: subject.program?.name || '',
      program_id: subject.program?.id || 0,
      teacher_name: subject.teacherInfo?.user?.name_en,
      teacher_code: subject.teacherInfo?.teacher_id,
      teacher_info_id: subject.teacherInfo?.id,
      semester_names: subject.semesters?.map((s) => s.name) || [],
    }));

    const dataSetup = await this.getDataSetup();
    const meta: SubjectMetaDto = { page, limit, total };

    return {
      subjects: subjectDtos,
      dataSetup,
      meta,
    };
  }

  async getSubjectById(id: string): Promise<SubjectDetailDto> {
    const subject = await this.subjectRepository.findOne({
      where: { id: parseInt(id), is_active: true },
      relations: [
        'program',
        'semesters',
        'teacherInfo',
        'teacherInfo.user',
        'teacherInfo.department',
      ],
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    const teacher = subject.teacherInfo
      ? {
          id: subject.teacherInfo.id,
          code: subject.teacherInfo.teacher_id,
          name: subject.teacherInfo.user?.name_en || 'Unknown',
          email: subject.teacherInfo.user?.email || '',
          department: subject.teacherInfo.department?.name,
        }
      : undefined;

    // Get all available teachers for dropdown
    const allTeachers = await this.getAllTeachers();

    return {
      id: subject.id.toString(),
      code: subject.code,
      name: subject.name,
      description: subject.description || '',
      total_hours: subject.total_hours,
      credits: subject.credits,
      program_name: subject.program?.name || '',
      program_id: subject.program?.id || 0,
      teacher_name: teacher?.name,
      teacher_code: teacher?.code,
      teacher_info_id: teacher?.id,
      semester_names: subject.semesters?.map((s) => s.name) || [],
      teacher,
      teachers: allTeachers, // Add all teachers array
      semesters:
        subject.semesters?.map((s) => ({
          id: s.id,
          name: s.name,
          semester_number: s.semester_number,
          year_number: s.year_number,
        })) || [],
      created_at: subject.created_at,
      updated_at: subject.updated_at || subject.created_at,
    };
  }

  async createSubject(
    createSubjectDto: CreateSubjectDto,
  ): Promise<SubjectDetailDto> {
    // Validate program
    const program = await this.programRepository.findOne({
      where: { id: createSubjectDto.program_id, is_active: true },
    });

    if (!program) {
      throw new NotFoundException(
        `Program with ID ${createSubjectDto.program_id} not found or inactive`,
      );
    }

    // Validate teacher_info if provided
    let teacherInfo: TeacherInfoModel | undefined = undefined;
    if (createSubjectDto.teacher_info_id) {
      const foundTeacherInfo = await this.teacherInfoRepository.findOne({
        where: { id: createSubjectDto.teacher_info_id, is_active: true },
        relations: ['user', 'department'],
      });

      if (!foundTeacherInfo) {
        throw new NotFoundException(
          `Teacher with ID ${createSubjectDto.teacher_info_id} not found or inactive`,
        );
      }
      teacherInfo = foundTeacherInfo;
    }

    // Create subject
    const subjectData: Partial<SubjectModel> = {
      code: createSubjectDto.code,
      name: createSubjectDto.name,
      description: createSubjectDto.description,
      credits: createSubjectDto.credits,
      program: program,
      teacherInfo: teacherInfo,
      is_active: true,
    };

    const subject = this.subjectRepository.create(subjectData);

    // Add semesters if provided
    if (
      createSubjectDto.semester_ids &&
      createSubjectDto.semester_ids.length > 0
    ) {
      const semesters = await this.semesterRepository.find({
        where: { id: In(createSubjectDto.semester_ids), is_active: true },
      });

      if (semesters.length !== createSubjectDto.semester_ids.length) {
        throw new NotFoundException(
          'One or more semesters not found or inactive',
        );
      }

      subject.semesters = semesters;
    }

    const savedSubject = await this.subjectRepository.save(subject);

    // Return with teachers array
    const result = await this.getSubjectById(savedSubject.id.toString());
    return result;
  }

  async updateSubject(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<SubjectDetailDto> {
    const subject = await this.subjectRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['program', 'semesters', 'teacherInfo'],
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Update basic fields
    if (updateSubjectDto.code !== undefined)
      subject.code = updateSubjectDto.code;
    if (updateSubjectDto.name !== undefined)
      subject.name = updateSubjectDto.name;
    if (updateSubjectDto.description !== undefined)
      subject.description = updateSubjectDto.description;
    if (updateSubjectDto.credits !== undefined)
      subject.credits = updateSubjectDto.credits;
    if (updateSubjectDto.is_active !== undefined)
      subject.is_active = updateSubjectDto.is_active;

    // Update program if provided
    if (updateSubjectDto.program_id !== undefined) {
      const program = await this.programRepository.findOne({
        where: { id: updateSubjectDto.program_id, is_active: true },
      });

      if (!program) {
        throw new NotFoundException(
          `Program with ID ${updateSubjectDto.program_id} not found or inactive`,
        );
      }

      subject.program = program;
    }

    // Update teacherInfo if provided
    if (updateSubjectDto.teacher_info_id !== undefined) {
      if (updateSubjectDto.teacher_info_id) {
        const teacherInfo = await this.teacherInfoRepository.findOne({
          where: { id: updateSubjectDto.teacher_info_id, is_active: true },
        });

        if (!teacherInfo) {
          throw new NotFoundException(
            `Teacher with ID ${updateSubjectDto.teacher_info_id} not found or inactive`,
          );
        }
        subject.teacherInfo = teacherInfo;
      } else {
        subject.teacherInfo = undefined;
      }
    }

    // Update semesters if provided
    if (updateSubjectDto.semester_ids !== undefined) {
      if (
        updateSubjectDto.semester_ids &&
        updateSubjectDto.semester_ids.length > 0
      ) {
        const semesters = await this.semesterRepository.find({
          where: { id: In(updateSubjectDto.semester_ids), is_active: true },
        });

        if (semesters.length !== updateSubjectDto.semester_ids.length) {
          throw new NotFoundException(
            'One or more semesters not found or inactive',
          );
        }

        subject.semesters = semesters;
      } else {
        subject.semesters = [];
      }
    }

    subject.updated_at = new Date();
    await this.subjectRepository.save(subject);

    // Return with teachers array
    return this.getSubjectById(id);
  }

  async deleteSubject(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const subject = await this.subjectRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Soft delete
    subject.is_active = false;
    subject.updated_at = new Date();
    await this.subjectRepository.save(subject);

    return {
      success: true,
      message: `Subject "${subject.name}" has been deleted successfully`,
    };
  }

  private applySorting(
    query: any,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    switch (sortBy) {
      case 'code':
        query.orderBy('subject.code', sortOrder);
        break;
      case 'name':
        query.orderBy('subject.name', sortOrder);
        break;
            case 'total_hours':
        query.orderBy('subject.total_hours', sortOrder);
        break;
      case 'credits':
        query.orderBy('subject.credits', sortOrder);
        break;
      case 'program_name':
        query.orderBy('program.name', sortOrder);
        break;
      case 'teacher_name':
        query.orderBy('user.name_en', sortOrder);
        break;
      case 'created_at':
        query.orderBy('subject.created_at', sortOrder);
        break;
      default:
        query.orderBy('subject.name', sortOrder);
        break;
    }
  }

  private async getDataSetup(): Promise<SubjectSetupDto> {
    const programs = await this.programRepository
      .createQueryBuilder('program')
      .select(['program.id', 'program.name'])
      .where('program.is_active = :isActive', { isActive: true })
      .orderBy('program.name', 'ASC')
      .getMany();

    const semesters = await this.semesterRepository
      .createQueryBuilder('semester')
      .select([
        'semester.id',
        'semester.name',
        'semester.semester_number',
        'semester.year_number',
        'program.id',
      ])
      .leftJoin('semester.program', 'program')
      .where('semester.is_active = :isActive', { isActive: true })
      .orderBy('semester.year_number', 'ASC')
      .addOrderBy('semester.semester_number', 'ASC')
      .getMany();

    const semestersFormatted = semesters.map((semester) => ({
      id: semester.id,
      name: semester.name,
      semester_number: semester.semester_number,
      year_number: semester.year_number,
      program_id: semester.program?.id || 0,
    }));

    const teachers = await this.getAllTeachers();

    return {
      programs,
      semesters: semestersFormatted,
      teachers,
    };
  }

  private async getAllTeachers(): Promise<TeacherDto[]> {
    const teachers = await this.teacherInfoRepository
      .createQueryBuilder('teacherInfo')
      .leftJoinAndSelect('teacherInfo.user', 'user')
      .leftJoinAndSelect('teacherInfo.department', 'department')
      .select([
        'teacherInfo.id',
        'teacherInfo.teacher_id',
        'user.name_en',
        'user.email',
        'department.name as department_name',
      ])
      .where('teacherInfo.is_active = :isActive', { isActive: true })
      .andWhere('user.is_active = :userActive', { userActive: true })
      .andWhere('user.role = :role', { role: Role.TEACHER })
      .orderBy('user.name_en', 'ASC')
      .getMany();

    return teachers.map((teacher) => ({
      id: teacher.id,
      code: teacher.teacher_id,
      name: teacher.user.name_en,
      email: teacher.user.email,
      department: teacher.department?.name,
    }));
  }
}
