import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/app/common/enum/role.enum';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { MinioService } from '../../services/minio/minio.service';
import {
  DataSetupDto,
  MetaDto,
  TeacherDetailDto,
  TeacherDto,
} from './teachers.dto';

interface GetAllTeachersParams {
  userId: string;
  page: number;
  limit: number;
  departmentId?: number;
  // sectionId?: number;
  // programId?: number;
  // academicYearId?: number;
  gender?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  userDepartmentId?: number;
}

interface GetAllTeachersResult {
  teachers: TeacherDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class HodTeacherService {
  constructor(
    @InjectRepository(TeacherInfoModel)
    private teacherInfoRepository: Repository<TeacherInfoModel>,
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
    @InjectRepository(DepartmentModel)
    private departmentRepository: Repository<DepartmentModel>,
    @InjectRepository(SectionModel)
    private sectionRepository: Repository<SectionModel>,
    @InjectRepository(ProgramModel)
    private programRepository: Repository<ProgramModel>,
    @InjectRepository(AcademicYearModel)
    private academicYearRepository: Repository<AcademicYearModel>,
    private minioService: MinioService,
  ) {}

  async getAllTeachers(
    params: GetAllTeachersParams,
  ): Promise<GetAllTeachersResult> {
    const {
      userId,
      page,
      limit,
      // sectionId,
      // programId,
      // academicYearId,
      gender,
      search,
      sortBy,
      sortOrder,
    } = params;

    const hod = await this.userRepository.findOne({
      where: { id: userId },
      relations: { hodInfo: { department: true } },
    });

    if (!hod || hod.role !== Role.HEAD_OF_DEPARTMENT) {
      throw new NotFoundException('HOD not found');
    }

    const hodDepartmentId = hod.hodInfo?.department?.id;
    if (!hodDepartmentId) {
      throw new NotFoundException('HOD department not found');
    }

    const skip = (page - 1) * limit;

    const query = this.teacherInfoRepository
      .createQueryBuilder('teacher')
      .innerJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.department', 'department')
      // .leftJoinAndSelect('teacher.academicYear', 'academicYear')
      // .leftJoinAndSelect('teacher.section', 'section')
      // .leftJoinAndSelect('teacher.program', 'program')
      .where('user.role = :role', { role: Role.TEACHER })
      .andWhere('teacher.is_active = :isActive', { isActive: true })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('teacher.department_id = :departmentId', {
        departmentId: hodDepartmentId,
      });

    if (gender) query.andWhere('user.gender = :gender', { gender });
    // if (sectionId)
    //   query.andWhere('teacher.section_id = :sectionId', { sectionId });
    // if (programId)
    //   query.andWhere('teacher.program_id = :programId', { programId });
    // if (academicYearId) {
    //   query.andWhere('teacher.academic_year_id = :academicYearId', {
    //     academicYearId,
    //   });
    // }

    if (search) {
      const cleanSearch = search.trim();
      query.andWhere(
        '(user.name_kh LIKE :search OR user.name_en LIKE :search OR teacher.teacher_id LIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }

    this.applySorting(query, sortBy, sortOrder);

    const total = await query.getCount();
    const teacherInfos = await query.skip(skip).take(limit).getMany();

    const teachers: TeacherDto[] = teacherInfos.map((teacher) => ({
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      name_kh: teacher.user.name_kh,
      name_en: teacher.user.name_en,
      email: teacher.user.email,
      phone: teacher.user.phone,
      dob: this.formatDate(teacher.user.dob),
      gender: teacher.user.gender,
      department: teacher.department?.name || '',
      departmentId: teacher.department?.id,
      // section: teacher.section?.name || '',
      // program: teacher.program?.name || '',
      // teacher_year: teacher.teacher_year,
      // academic_year: teacher.academicYear?.name || '',
    }));

    const dataSetup = await this.getDataSetup(hodDepartmentId);

    return {
      teachers,
      dataSetup,
      meta: { page, limit, total },
    };
  }

  async getTeacherById(id: string): Promise<TeacherDetailDto> {
    let teacherInfo = await this.teacherInfoRepository.findOne({
      where: [
        { teacher_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: {
        user: true,
        department: true,
        // section: true,
        // program: true,
        // academicYear: true,
      },
    });

    // If not found by teacher_id or id, try to find by user_id
    if (!teacherInfo) {
      teacherInfo = await this.teacherInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: {
          user: true,
          department: true,
          // section: true,
          // program: true,
          // academicYear: true,
        },
      });
    }

    if (!teacherInfo) {
      throw new NotFoundException(`Teacher with identifier ${id} not found`);
    }

    // Check if user exists and is active
    if (!teacherInfo.user || !teacherInfo.user.is_active) {
      throw new NotFoundException('Teacher user account not found or inactive');
    }

    return {
      id: teacherInfo.id,
      teacher_id: teacherInfo.teacher_id,
      name_kh: teacherInfo.user.name_kh,
      name_en: teacherInfo.user.name_en,
      dob: this.formatDate(teacherInfo.user.dob),
      gender: teacherInfo.user.gender,
      email: teacherInfo.user.email,
      phone: teacherInfo.user.phone,
      address: teacherInfo.user.address,
      image: teacherInfo.user.image,
      department: teacherInfo.department?.name || '',
      // section: teacherInfo.section?.name || '',
      // program: teacherInfo.program?.name || '',
      // teacher_year: teacherInfo.teacher_year,
      // academic_year: teacherInfo.academicYear?.name || '',
      // department_id: teacherInfo.department_id,
      // section_id: teacherInfo.section_id,
      // program_id: teacherInfo.program_id,
      created_at: teacherInfo.createdAt,
      updated_at: teacherInfo.user.updatedAt,
    };
  }

  private applySorting(
    query: any,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    switch (sortBy) {
      case 'name_en':
        query.orderBy('user.name_en', sortOrder);
        break;
      case 'name_kh':
        query.orderBy('user.name_kh', sortOrder);
        break;
      case 'dob':
        query.orderBy('user.dob', sortOrder);
        break;
      case 'teacher_id':
      default:
        query.orderBy('teacher.teacher_id', sortOrder);
        break;
    }
  }

  private formatDate(date: any): string {
    if (!date) return '';

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    if (typeof date === 'string') {
      // If it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      // Try to parse it
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return date;
    }

    return String(date);
  }

private async getDataSetup(departmentId: number): Promise<DataSetupDto> {
  const [sections, programs, academicYears] = await Promise.all([
    this.sectionRepository.find({
      select: ['id', 'name', 'department_id'],
      where: { department_id: departmentId },      
      order: { name: 'ASC' },
    }),

    this.programRepository.find({
      select: ['id', 'name', 'department_id'],
      where: { department_id: departmentId },    
      order: { name: 'ASC' },
    }),

    this.academicYearRepository.find({
      select: ['id', 'name', 'isActive'],
      order: { name: 'DESC' },
    }),
  ]);


  return {
    sections,
    programs,
    academic_years: academicYears,
  };
}


  async getGenderOptions(): Promise<string[]> {
    const genders = await this.userRepository
      .createQueryBuilder('user')
      .select('DISTINCT user.gender', 'gender')
      .where('user.role = :role', { role: Role.STUDENT })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('user.gender IS NOT NULL')
      .andWhere("user.gender != ''")
      .orderBy('user.gender', 'ASC')
      .getRawMany();

    return genders.map((g) => g.gender).filter((g) => g);
  }

  // async getActiveAcademicYear(): Promise<AcademicYearModel> {
  //   // Get active academic year from database
  //   const activeAcademicYear = await this.academicYearRepository.findOne({
  //     where: { isActive: true },
  //   });

  //   if (!activeAcademicYear) {
  //     throw new NotFoundException('No active academic year found');
  //   }

  //   return activeAcademicYear;
  // }
}
