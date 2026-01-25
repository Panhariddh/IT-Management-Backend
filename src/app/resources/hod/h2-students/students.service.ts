import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/app/common/enum/role.enum';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { StudentInfoModel } from 'src/app/database/models/info/student-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { MinioService } from '../../services/minio/minio.service';
import {
  DataSetupDto,
  MetaDto,
  StudentDetailDto,
  StudentDto,
} from './students.dto';

interface GetAllStudentsParams {
  userId: string;
  page: number;
  limit: number;
  departmentId?: number;
  sectionId?: number;
  programId?: number;
  academicYearId?: number;
  gender?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  userDepartmentId?: number;
}

interface GetAllStudentsResult {
  students: StudentDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class HodStudentService {
  constructor(
    @InjectRepository(StudentInfoModel)
    private studentInfoRepository: Repository<StudentInfoModel>,
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

  async getAllStudents(
    params: GetAllStudentsParams,
  ): Promise<GetAllStudentsResult> {
    const {
      userId,
      page,
      limit,
      sectionId,
      programId,
      academicYearId,
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

    const query = this.studentInfoRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.department', 'department')
      .leftJoinAndSelect('student.academicYear', 'academicYear')
      .leftJoinAndSelect('student.section', 'section')
      .leftJoinAndSelect('student.program', 'program')
      .where('user.role = :role', { role: Role.STUDENT })
      .andWhere('student.is_active = :isActive', { isActive: true })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('student.department_id = :departmentId', {
        departmentId: hodDepartmentId,
      });

    if (gender) query.andWhere('user.gender = :gender', { gender });
    if (sectionId)
      query.andWhere('student.section_id = :sectionId', { sectionId });
    if (programId)
      query.andWhere('student.program_id = :programId', { programId });
    if (academicYearId) {
      query.andWhere('student.academic_year_id = :academicYearId', {
        academicYearId,
      });
    }

    if (search) {
      const cleanSearch = search.trim();
      query.andWhere(
        '(user.name_kh LIKE :search OR user.name_en LIKE :search OR student.student_id LIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }

    this.applySorting(query, sortBy, sortOrder);

    const total = await query.getCount();
    const studentInfos = await query.skip(skip).take(limit).getMany();

    const students: StudentDto[] = studentInfos.map((student) => ({
      id: student.id,
      student_id: student.student_id,
      name_kh: student.user.name_kh,
      name_en: student.user.name_en,
      dob: this.formatDate(student.user.dob),
      gender: student.user.gender,
      department: student.department?.name || '',
      departmentId: student.department?.id || '',
      section: student.section?.name || '',
      program: student.program?.name || '',
      student_year: student.student_year,
      academic_year: student.academicYear?.name || '',
    }));

    const dataSetup = await this.getDataSetup(hodDepartmentId);

    return {
      students,
      dataSetup,
      meta: { page, limit, total },
    };
  }

  async getStudentById(id: string): Promise<StudentDetailDto> {
    let studentInfo = await this.studentInfoRepository.findOne({
      where: [
        { student_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: {
        user: true,
        department: true,
        section: true,
        program: true,
        academicYear: true,
      },
    });

    // If not found by student_id or id, try to find by user_id
    if (!studentInfo) {
      studentInfo = await this.studentInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: {
          user: true,
          department: true,
          section: true,
          program: true,
          academicYear: true,
        },
      });
    }

    if (!studentInfo) {
      throw new NotFoundException(`Student with identifier ${id} not found`);
    }

    // Check if user exists and is active
    if (!studentInfo.user || !studentInfo.user.is_active) {
      throw new NotFoundException('Student user account not found or inactive');
    }

    return {
      id: studentInfo.id,
      student_id: studentInfo.student_id,
      name_kh: studentInfo.user.name_kh,
      name_en: studentInfo.user.name_en,
      dob: this.formatDate(studentInfo.user.dob),
      gender: studentInfo.user.gender,
      email: studentInfo.user.email,
      phone: studentInfo.user.phone,
      address: studentInfo.user.address,
      image: studentInfo.user.image,
      department: studentInfo.department?.name || '',
      section: studentInfo.section?.name || '',
      program: studentInfo.program?.name || '',
      student_year: studentInfo.student_year,
      academic_year: studentInfo.academicYear?.name || '',
      department_id: studentInfo.department_id,
      section_id: studentInfo.section_id,
      program_id: studentInfo.program_id,
      created_at: studentInfo.createdAt,
      updated_at: studentInfo.user.updatedAt,
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
      case 'student_id':
      default:
        query.orderBy('student.student_id', sortOrder);
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

  async getActiveAcademicYear(): Promise<AcademicYearModel> {
    // Get active academic year from database
    const activeAcademicYear = await this.academicYearRepository.findOne({
      where: { isActive: true },
    });

    if (!activeAcademicYear) {
      throw new NotFoundException('No active academic year found');
    }

    return activeAcademicYear;
  }
}
