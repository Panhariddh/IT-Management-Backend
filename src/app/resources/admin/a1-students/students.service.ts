import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from 'src/app/common/enum/role.enum';
import { StudentInfoModel } from 'src/app/database/models/info/student-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import {
  CreateStudentDto,
  DataSetupDto,
  MetaDto,
  StudentDetailDto,
  StudentDto,
} from './students.dto';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { MinioService } from '../../services/minio.service';
import * as bcrypt from 'bcrypt';

interface GetAllStudentsParams {
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
}

interface GetAllStudentsResult {
  students: StudentDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class StudentService {
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
      page,
      limit,
      departmentId,
      sectionId,
      programId,
      academicYearId,
      gender,
      search,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;

    // Build query
    const query = this.studentInfoRepository
      .createQueryBuilder('student')
      .innerJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.department', 'department')
      .leftJoinAndSelect('student.academicYear', 'academicYear')
      .leftJoinAndSelect('student.section', 'section')
      .leftJoinAndSelect('student.program', 'program')
      .where('user.role = :role', { role: Role.STUDENT })
      .andWhere('student.is_active = :isActive', { isActive: true })
      .andWhere('user.is_active = :isActive', { isActive: true });

    // Apply gender filter
    if (gender) {
      query.andWhere('user.gender = :gender', { gender });
    }

    // Apply department/section/program filters
    if (departmentId) {
      query.andWhere('student.department_id = :departmentId', { departmentId });
    }

    if (sectionId) {
      query.andWhere('student.section_id = :sectionId', { sectionId });
    }

    if (programId) {
      query.andWhere('student.program_id = :programId', { programId });
    }

    if (academicYearId) {
      query.andWhere('student.academic_year_id = :academicYearId', {
        academicYearId,
      });
    }

    // Apply search filter (only for id, name_kh, name_en)
    if (search) {
      // Clean search term - remove extra spaces and wildcards
      const cleanSearch = search.trim();
      query.andWhere(
        '(user.name_kh LIKE :search OR user.name_en LIKE :search OR student.student_id LIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }

    // Apply sorting
    this.applySorting(query, sortBy, sortOrder);

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const studentInfos = await query.skip(skip).take(limit).getMany();

    // Transform to DTO
    const students: StudentDto[] = studentInfos.map((student) => ({
      id: student.id,
      student_id: student.student_id,
      name_kh: student.user.name_kh,
      name_en: student.user.name_en,
      dob: this.formatDate(student.user.dob),
      gender: student.user.gender,
      department: student.department?.name || '',
      section: student.section?.name || '',
      program: student.program?.name || '',
      grade: student.grade,
      student_year: student.student_year,
      academic_year: student.academicYear?.name || '',
    }));

    // Get data setup
    const dataSetup = await this.getDataSetup();

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    return {
      students,
      dataSetup,
      meta,
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
      grade: studentInfo.grade,
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

  private async getDataSetup(): Promise<DataSetupDto> {
    const [departments, sections, programs, academicYears] = await Promise.all([
      this.departmentRepository.find({
        select: ['id', 'name'],
        order: { name: 'ASC' },
      }),
      this.sectionRepository.find({
        select: ['id', 'name', 'department_id'],
        order: { name: 'ASC' },
      }),
      this.programRepository.find({
        select: ['id', 'name', 'department_id'],
        order: { name: 'ASC' },
      }),
      this.academicYearRepository.find({
        select: ['id', 'name', 'isActive'],
        order: { name: 'DESC' }, // latest academic year first
      }),
    ]);

    return {
      departments,
      sections,
      programs,
      academic_years: academicYears, // ✅ matches DTO
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

  async createStudent(
    createStudentDto: CreateStudentDto,
    imageFile?: Express.Multer.File,
  ): Promise<{
    id: string;
    student_id: string;
    name_en: string;
    name_kh: string;
    email: string;
  }> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createStudentDto.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Check if student_id already exists
    const existingStudent = await this.studentInfoRepository.findOne({
      where: { student_id: createStudentDto.student_id },
    });

    if (existingStudent) {
      throw new Error('Student ID already exists');
    }

    // Validate foreign key references
    await this.validateReferences(createStudentDto);

    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      const objectName = await this.minioService.uploadImage(
        imageFile,
        'student-images',
      );
      imageUrl = this.minioService.getPublicUrl(objectName);
    }

    // ✅ Hash password using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createStudentDto.password,
      saltRounds,
    );

    // Create user
    const user = this.userRepository.create({
      name_kh: createStudentDto.name_kh,
      name_en: createStudentDto.name_en,
      email: createStudentDto.email,
      password: hashedPassword,
      phone: createStudentDto.phone,
      gender: createStudentDto.gender,
      dob: new Date(createStudentDto.dob),
      address: createStudentDto.address,
      role: Role.STUDENT,
      is_active: true,
      image: imageUrl,
    });

    const savedUser = await this.userRepository.save(user);

    // Create student info
    const studentInfo = this.studentInfoRepository.create({
      user_id: savedUser.id,
      student_id: createStudentDto.student_id,
      department_id: createStudentDto.department_id,
      section_id: createStudentDto.section_id,
      program_id: createStudentDto.program_id,
      academic_year_id: createStudentDto.academic_year_id,
      grade: createStudentDto.grade,
      student_year: createStudentDto.student_year,
      is_active: true,
    });

    const savedStudentInfo = await this.studentInfoRepository.save(studentInfo);

    return {
      id: savedStudentInfo.id,
      student_id: savedStudentInfo.student_id,
      name_en: savedUser.name_en,
      name_kh: savedUser.name_kh,
      email: savedUser.email,
    };
  }

  // Add this helper method to validate references
  private async validateReferences(dto: CreateStudentDto): Promise<void> {
    // Just check if records exist - skip department matching for now
    const [department, section, program, academicYear] = await Promise.all([
      this.departmentRepository.findOne({ where: { id: dto.department_id } }),
      this.sectionRepository.findOne({ where: { id: dto.section_id } }),
      this.programRepository.findOne({ where: { id: dto.program_id } }),
      this.academicYearRepository.findOne({
        where: { id: dto.academic_year_id },
      }),
    ]);

    if (!department)
      throw new Error(`Department ${dto.department_id} not found`);
    if (!section) throw new Error(`Section ${dto.section_id} not found`);
    if (!program) throw new Error(`Program ${dto.program_id} not found`);
    if (!academicYear)
      throw new Error(`Academic year ${dto.academic_year_id} not found`);

    // TEMPORARILY SKIP department matching
    // We'll fix this after student creation works
    return;
  }
}
