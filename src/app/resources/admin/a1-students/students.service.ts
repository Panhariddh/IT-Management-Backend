import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { Role } from 'src/app/common/enum/role.enum';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { StudentInfoModel } from 'src/app/database/models/info/student-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { MinioService } from '../../services/minio/minio.service';
import {
  CreateStudentDto,
  DataSetupDto,
  MetaDto,
  StudentDetailDto,
  StudentDto,
  UpdateStudentDto,
} from './students.dto';

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

  async getNextStudentId(): Promise<string> {
    const activeAcademicYear = await this.academicYearRepository.findOne({
      where: { isActive: true },
    });

    if (!activeAcademicYear) {
      throw new NotFoundException('No active academic year found');
    }

    // Extract ENDING year (2025 from "2024-2025")
    const yearMatch = activeAcademicYear.name.match(/(\d{4})-(\d{4})/);
    if (!yearMatch) {
      throw new Error('Invalid academic year format. Expected: YYYY-YYYY');
    }
    const year = yearMatch[2];

    // Find highest student number for this year
    const students = await this.studentInfoRepository
      .createQueryBuilder('student')
      .where('student.academic_year_id = :academicYearId', {
        academicYearId: activeAcademicYear.id,
      })
      .andWhere('student.student_id LIKE :pattern', {
        pattern: `e${year}%`,
      })
      .getMany();

    let maxNumber = 0;

    students.forEach((student) => {
      const id = student.student_id;

      if (id.startsWith(`e${year}`)) {
        // Extract the number part (everything after "e2025")
        const numberPart = id.slice(5); // After "e2025"

        const number = parseInt(numberPart, 10);
        if (!isNaN(number)) {
          if (number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    });
    const nextNumber = maxNumber + 1;

    const digitCount = 4;
    const maxStudents = Math.pow(10, digitCount) - 1;

    if (nextNumber > maxStudents) {
      throw new Error(
        `Maximum student limit (${maxStudents}) reached for this academic year`,
      );
    }

    // Format with proper padding
    const formattedNumber = nextNumber.toString().padStart(digitCount, '0');
    const newStudentId = `e${year}${formattedNumber}`;

    // Final uniqueness check
    const exists = await this.studentInfoRepository.findOne({
      where: { student_id: newStudentId },
    });

    if (exists) {
      throw new Error(`Student ID ${newStudentId} already exists. Try again.`);
    }

    return newStudentId;
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

  async createStudent(
    createStudentDto: CreateStudentDto,
    imageFile?: Express.Multer.File,
  ): Promise<{
    id: string;
    student_id: string;
    name_en: string;
    name_kh: string;
    email: string;
    academic_year: string;
    image?: string;
  }> {
    // Get active academic year
    const activeAcademicYear = await this.getActiveAcademicYear();

    // Auto-generate student ID
    const studentId = await this.getNextStudentId();

    // Auto-generate email
    const email = `${studentId}@rtc.edu.kh`;

    // Validate foreign key references
    await this.validateReferences({
      ...createStudentDto,
      academic_year_id: activeAcademicYear.id,
    });

    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      try {
        const objectName = await this.minioService.uploadImage(
          imageFile,
          'student-images',
        );
        imageUrl = this.minioService.getProxiedUrl(objectName);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    // Auto-generate password (same as student ID)
    const password = studentId;

    // Hash password using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with image
    const user = this.userRepository.create({
      name_kh: createStudentDto.name_kh,
      name_en: createStudentDto.name_en,
      email: email,
      password: hashedPassword,
      phone: createStudentDto.phone,
      gender: createStudentDto.gender,
      dob: new Date(createStudentDto.dob),
      address: createStudentDto.address,
      role: Role.STUDENT,
      is_active: true,
      image: imageUrl,
      passwordChanged: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Create student info
    const studentInfo = this.studentInfoRepository.create({
      user_id: savedUser.id,
      student_id: studentId,
      department_id: createStudentDto.department_id,
      section_id: createStudentDto.section_id,
      program_id: createStudentDto.program_id,
      academic_year_id: activeAcademicYear.id,
      student_year: createStudentDto.student_year,
      is_active: true,
    });

    const savedStudentInfo = await this.studentInfoRepository.save(studentInfo);

    return {
      id: savedStudentInfo.id,
      student_id: savedStudentInfo.student_id,
      name_en: savedUser.name_en,
      name_kh: savedUser.name_en,
      email: savedUser.email,
      academic_year: activeAcademicYear.name,
      image: savedUser.image,
    };
  }

  async updateStudent(
    id: string,
    updateStudentDto: UpdateStudentDto,
    imageFile?: Express.Multer.File,
  ): Promise<{
    id: string;
    student_id: string;
    name_en: string;
    name_kh: string;
    email: string;
    image?: string;
    academic_year: string;
    department: string;
    section: string;
    program: string;
    student_year: number;
    is_active: boolean;
  }> {
    // Find student info with user details
    let studentInfo = await this.studentInfoRepository.findOne({
      where: [
        { student_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user', 'department', 'section', 'program', 'academicYear'],
    });

    // If not found by student_id or id, try to find by user_id
    if (!studentInfo) {
      studentInfo = await this.studentInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user', 'department', 'section', 'program', 'academicYear'],
      });
    }

    if (!studentInfo) {
      throw new NotFoundException(`Student with identifier ${id} not found`);
    }

    if (!studentInfo.user) {
      throw new NotFoundException('Student user account not found');
    }

    const queryRunner =
      this.studentInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate foreign key references if provided
      if (
        updateStudentDto.department_id ||
        updateStudentDto.section_id ||
        updateStudentDto.program_id
      ) {
        const referencesToValidate = {
          department_id:
            updateStudentDto.department_id || studentInfo.department_id,
          section_id: updateStudentDto.section_id || studentInfo.section_id,
          program_id: updateStudentDto.program_id || studentInfo.program_id,
          academic_year_id: studentInfo.academic_year_id,
        };
        await this.validateReferences(referencesToValidate);
      }

      let imageUrl: string | undefined = studentInfo.user.image;

      // Upload new image if provided
      if (imageFile) {
        try {
          const objectName = await this.minioService.uploadImage(
            imageFile,
            'student-images',
          );
          imageUrl = this.minioService.getProxiedUrl(objectName);

          // Delete old image if exists
          if (studentInfo.user.image) {
            const oldImagePath = studentInfo.user.image.split('/').pop();
            if (oldImagePath) {
              await this.minioService.deleteImage(oldImagePath).catch((err) => {
                console.warn('Failed to delete old image:', err.message);
              });
            }
          }
        } catch (error) {
          console.error('Failed to upload image:', error);
          throw new Error(`Failed to upload image: ${error.message}`);
        }
      }

      // Update user
      const userUpdateData: any = {};

      if (updateStudentDto.name_kh !== undefined)
        userUpdateData.name_kh = updateStudentDto.name_kh;
      if (updateStudentDto.name_en !== undefined)
        userUpdateData.name_en = updateStudentDto.name_en;
      if (updateStudentDto.phone !== undefined)
        userUpdateData.phone = updateStudentDto.phone;
      if (updateStudentDto.gender !== undefined)
        userUpdateData.gender = updateStudentDto.gender;
      if (updateStudentDto.dob !== undefined)
        userUpdateData.dob = new Date(updateStudentDto.dob);
      if (updateStudentDto.address !== undefined)
        userUpdateData.address = updateStudentDto.address;
      if (imageUrl !== undefined) userUpdateData.image = imageUrl;
      if (updateStudentDto.is_active !== undefined)
        userUpdateData.is_active = updateStudentDto.is_active;

      await queryRunner.manager.update(
        UserModel,
        studentInfo.user_id,
        userUpdateData,
      );

      // Update student info
      const studentInfoUpdateData: any = {};

      if (updateStudentDto.department_id !== undefined)
        studentInfoUpdateData.department_id = updateStudentDto.department_id;
      if (updateStudentDto.section_id !== undefined)
        studentInfoUpdateData.section_id = updateStudentDto.section_id;
      if (updateStudentDto.program_id !== undefined)
        studentInfoUpdateData.program_id = updateStudentDto.program_id;
      if (updateStudentDto.student_year !== undefined)
        studentInfoUpdateData.student_year = updateStudentDto.student_year;
      if (updateStudentDto.is_active !== undefined)
        studentInfoUpdateData.is_active = updateStudentDto.is_active;

      await queryRunner.manager.update(
        StudentInfoModel,
        studentInfo.id,
        studentInfoUpdateData,
      );

      await queryRunner.commitTransaction();

      // Fetch updated data with relations
      const updatedStudentInfo = await this.studentInfoRepository.findOne({
        where: { id: studentInfo.id },
        relations: ['user', 'department', 'section', 'program', 'academicYear'],
      });

      if (!updatedStudentInfo) {
        throw new Error('Failed to fetch updated student data');
      }

      return {
        id: updatedStudentInfo.id,
        student_id: updatedStudentInfo.student_id,
        name_en: updatedStudentInfo.user.name_en,
        name_kh: updatedStudentInfo.user.name_kh,
        email: updatedStudentInfo.user.email,
        image: updatedStudentInfo.user.image,
        academic_year: updatedStudentInfo.academicYear?.name || '',
        department: updatedStudentInfo.department?.name || '',
        section: updatedStudentInfo.section?.name || '',
        program: updatedStudentInfo.program?.name || '',
        student_year: updatedStudentInfo.student_year,
        is_active:
          updatedStudentInfo.is_active && updatedStudentInfo.user.is_active,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to update student: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteStudent(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Find the student info first with user details
    let studentInfo = await this.studentInfoRepository.findOne({
      where: [
        { student_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user'],
    });

    // If not found by student_id or id, try to find by user_id
    if (!studentInfo) {
      studentInfo = await this.studentInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user'],
      });
    }

    if (!studentInfo) {
      throw new NotFoundException(`Student with identifier ${id} not found`);
    }

    if (!studentInfo.user) {
      throw new NotFoundException('Student user account not found');
    }

    const studentNameKh = studentInfo.user.name_kh || '';
    const studentNameEn = studentInfo.user.name_en || '';

    // Format the name for the message
    let formattedName = studentNameKh;
    if (studentNameKh && studentNameEn) {
      formattedName = `${studentNameKh} (${studentNameEn})`;
    } else if (studentNameEn) {
      formattedName = studentNameEn;
    }

    const queryRunner =
      this.studentInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete the student info
      studentInfo.is_active = false;
      await queryRunner.manager.save(studentInfo);

      // Soft delete the associated user if it exists
      if (studentInfo.user) {
        const user = await queryRunner.manager.findOne(UserModel, {
          where: { id: studentInfo.user_id },
        });

        if (user) {
          user.is_active = false;
          await queryRunner.manager.save(user);
        }
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `Student ${formattedName} has been deleted successfully`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete student: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // Add this helper method to validate references
  private async validateReferences(
    dto: Partial<CreateStudentDto>,
  ): Promise<void> {
    const validations: Promise<any>[] = [];

    if (dto.department_id) {
      validations.push(
        this.departmentRepository.findOne({ where: { id: dto.department_id } }),
      );
    }

    if (dto.section_id) {
      validations.push(
        this.sectionRepository.findOne({ where: { id: dto.section_id } }),
      );
    }

    if (dto.program_id) {
      validations.push(
        this.programRepository.findOne({ where: { id: dto.program_id } }),
      );
    }

    if (dto.academic_year_id) {
      validations.push(
        this.academicYearRepository.findOne({
          where: { id: dto.academic_year_id },
        }),
      );
    }

    if (validations.length === 0) {
      return;
    }

    const results = await Promise.all(validations);

    let index = 0;
    if (dto.department_id && !results[index]) {
      throw new Error(`Department ${dto.department_id} not found`);
    }
    index++;

    if (dto.section_id && !results[index]) {
      throw new Error(`Section ${dto.section_id} not found`);
    }
    index++;

    if (dto.program_id && !results[index]) {
      throw new Error(`Program ${dto.program_id} not found`);
    }
    index++;

    if (dto.academic_year_id && !results[index]) {
      throw new Error(`Academic year ${dto.academic_year_id} not found`);
    }

    return;
  }
}
