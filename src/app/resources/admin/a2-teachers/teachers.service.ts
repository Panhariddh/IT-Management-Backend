import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from 'src/app/common/enum/role.enum';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import {
  CreateTeacherDto,
  TeacherDetailDto,
  UpdateTeacherDto,
  DataSetupDto,
  MetaDto,
  TeacherDto,
} from './teachers.dto';
import { MinioService } from '../../services/minio/minio.service';

interface GetAllTeachersParams {
  page: number;
  limit: number;
  departmentId?: number;
  gender?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isActive?: boolean;
}

interface GetAllTeachersResult {
  teachers: TeacherDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(TeacherInfoModel)
    private teacherInfoRepository: Repository<TeacherInfoModel>,
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
    @InjectRepository(DepartmentModel)
    private departmentRepository: Repository<DepartmentModel>,
    private minioService: MinioService,
  ) {}

  async getAllTeachers(
    params: GetAllTeachersParams,
  ): Promise<GetAllTeachersResult> {
    const {
      page,
      limit,
      departmentId,
      gender,
      search,
      sortBy,
      sortOrder,
      isActive,
    } = params;
    const skip = (page - 1) * limit;

    // Build query
    const query = this.teacherInfoRepository
      .createQueryBuilder('teacher')
      .innerJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.department', 'department')
      .where('user.role = :role', { role: Role.TEACHER });

    // Apply active status filter
    if (isActive !== undefined) {
      query.andWhere('teacher.is_active = :isActive', { isActive });
      query.andWhere('user.is_active = :isActive', { isActive });
    } else {
      // Default: show active only
      query.andWhere('teacher.is_active = :isActive', { isActive: true });
      query.andWhere('user.is_active = :isActive', { isActive: true });
    }

    // Apply gender filter
    if (gender) {
      query.andWhere('user.gender = :gender', { gender });
    }

    // Apply department filter
    if (departmentId) {
      query.andWhere('teacher.department_id = :departmentId', { departmentId });
    }

    // Apply search filter
    if (search) {
      const cleanSearch = search.trim();
      query.andWhere(
        '(user.name_kh LIKE :search OR user.name_en LIKE :search OR teacher.teacher_id LIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }

    // Apply sorting
    this.applySorting(query, sortBy, sortOrder);

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const teacherInfos = await query.skip(skip).take(limit).getMany();

    // Transform to DTO
    const teachers: TeacherDto[] = teacherInfos.map((teacher) => ({
      id: teacher.id,
      teacher_id: teacher.teacher_id,
      name_kh: teacher.user.name_kh,
      name_en: teacher.user.name_en,
      email: teacher.user.email,
      dob: this.formatDate(teacher.user.dob),
      phone: teacher.user.phone,
      gender: teacher.user.gender,
      department: teacher.department?.name || '',
    }));

    // Get data setup
    const dataSetup = await this.getDataSetup();

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    return {
      teachers,
      dataSetup,
      meta,
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
      },
    });

    // If not found by teacher_id or id, try to find by user_id
    if (!teacherInfo) {
      teacherInfo = await this.teacherInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: {
          user: true,
          department: true,
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
      email: teacherInfo.user.email,
      phone: teacherInfo.user.phone,
      dob: this.formatDate(teacherInfo.user.dob),
      address: teacherInfo.user.address,
      gender: teacherInfo.user.gender,
      image: teacherInfo.user.image,
      is_active: teacherInfo.is_active && teacherInfo.user.is_active,
      department_id: teacherInfo.department_id || undefined,
      department: teacherInfo.department?.name || '',
      created_at: teacherInfo.createdAt,
      updated_at: teacherInfo.user.updatedAt,
    };
  }

  async getTeacherByUserId(userId: string): Promise<TeacherDetailDto> {
    const teacherInfo = await this.teacherInfoRepository.findOne({
      where: { user_id: userId, is_active: true },
      relations: {
        user: true,
        department: true,
      },
    });

    if (!teacherInfo) {
      throw new NotFoundException(`Teacher with user ID ${userId} not found`);
    }

    if (!teacherInfo.user || !teacherInfo.user.is_active) {
      throw new NotFoundException('Teacher user account not found or inactive');
    }

    return {
      id: teacherInfo.id,
      teacher_id: teacherInfo.teacher_id,
      name_kh: teacherInfo.user.name_kh,
      name_en: teacherInfo.user.name_en,
      email: teacherInfo.user.email,
      phone: teacherInfo.user.phone,
      dob: this.formatDate(teacherInfo.user.dob),
      address: teacherInfo.user.address,
      gender: teacherInfo.user.gender,
      image: teacherInfo.user.image,
      is_active: teacherInfo.is_active && teacherInfo.user.is_active,
      department_id: teacherInfo.department_id || undefined,
      department: teacherInfo.department?.name || '',
      created_at: teacherInfo.createdAt,
      updated_at: teacherInfo.user.updatedAt,
    };
  }

  async getNextTeacherId(): Promise<string> {
    // Find highest teacher number
    const teachers = await this.teacherInfoRepository
      .createQueryBuilder('teacher')
      .where('teacher.teacher_id LIKE :pattern', {
        pattern: 't%',
      })
      .getMany();

    let maxNumber = 0;

    teachers.forEach((teacher) => {
      const id = teacher.teacher_id;

      if (id.startsWith('t') && id.length >= 9) {
        const numberPart = id.slice(1); // After "t"
        const currentYear = new Date().getFullYear();
        
        // Check if it starts with current year
        if (id.startsWith(`t${currentYear}`)) {
          const number = parseInt(numberPart.slice(4), 10); // After "t2025"
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    });

    const currentYear = new Date().getFullYear();
    const nextNumber = maxNumber + 1;
    const digitCount = 4;
    const formattedNumber = nextNumber.toString().padStart(digitCount, '0');
    const newTeacherId = `t${currentYear}${formattedNumber}`;

    // Check uniqueness
    const exists = await this.teacherInfoRepository.findOne({
      where: { teacher_id: newTeacherId },
    });

    if (exists) {
      throw new Error(`Teacher ID ${newTeacherId} already exists. Try again.`);
    }

    return newTeacherId;
  }

  async createTeacher(
    createTeacherDto: CreateTeacherDto,
    imageFile?: Express.Multer.File,
  ): Promise<TeacherDetailDto> {
    // Auto-generate teacher ID
    const teacherId = await this.getNextTeacherId();

    // Auto-generate email
    const email = `${teacherId}@rtc.edu.kh`;

    // Validate foreign key references
    if (createTeacherDto.department_id) {
      await this.validateReferences(createTeacherDto.department_id);
    }

    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      try {
        const objectName = await this.minioService.uploadImage(
          imageFile,
          'teacher-images',
        );
        imageUrl = this.minioService.getProxiedUrl(objectName);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    // Use provided password or auto-generate (same as teacher ID)
    const password = createTeacherDto.password || teacherId;

    // Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with image
    const user = this.userRepository.create({
      name_kh: createTeacherDto.name_kh,
      name_en: createTeacherDto.name_en,
      email: email, // Use auto-generated email
      password: hashedPassword,
      phone: createTeacherDto.phone,
      gender: createTeacherDto.gender,
      dob: new Date(createTeacherDto.dob),
      role: Role.TEACHER,
      address: createTeacherDto.address,
      is_active: true,
      image: imageUrl,
    });

    const savedUser = await this.userRepository.save(user);

    // Create teacher info
    const teacherInfo = this.teacherInfoRepository.create({
      user_id: savedUser.id,
      teacher_id: teacherId,
      department_id: createTeacherDto.department_id,
      is_active: true,
    });

    const savedTeacherInfo = await this.teacherInfoRepository.save(teacherInfo);

    // Fetch the complete teacher with relations
    const completeTeacher = await this.teacherInfoRepository.findOne({
      where: { id: savedTeacherInfo.id },
      relations: ['user', 'department'],
    });

    if (!completeTeacher) {
      throw new Error('Failed to fetch created teacher data');
    }

    return {
      id: completeTeacher.id,
      teacher_id: completeTeacher.teacher_id,
      name_kh: completeTeacher.user.name_kh,
      name_en: completeTeacher.user.name_en,
      email: completeTeacher.user.email,
      phone: completeTeacher.user.phone,
      dob: this.formatDate(completeTeacher.user.dob),
      address: completeTeacher.user.address,
      gender: completeTeacher.user.gender,
      image: completeTeacher.user.image,
      is_active: completeTeacher.is_active && completeTeacher.user.is_active,
      department_id: completeTeacher.department_id || undefined,
      department: completeTeacher.department?.name || '',
      created_at: completeTeacher.createdAt,
      updated_at: completeTeacher.user.updatedAt,
    };
  }

  async updateTeacher(
    id: string,
    updateTeacherDto: UpdateTeacherDto,
    imageFile?: Express.Multer.File,
  ): Promise<TeacherDetailDto> {
    // Find teacher info with user details
    let teacherInfo = await this.teacherInfoRepository.findOne({
      where: [
        { teacher_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user', 'department'],
    });

    // If not found by teacher_id or id, try to find by user_id
    if (!teacherInfo) {
      teacherInfo = await this.teacherInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user', 'department'],
      });
    }

    if (!teacherInfo) {
      throw new NotFoundException(`Teacher with identifier ${id} not found`);
    }

    if (!teacherInfo.user) {
      throw new NotFoundException('Teacher user account not found');
    }

    const queryRunner =
      this.teacherInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate foreign key references if provided
      if (updateTeacherDto.department_id) {
        await this.validateReferences(updateTeacherDto.department_id);
      }

      let imageUrl: string | undefined = teacherInfo.user.image;

      // Upload new image if provided
      if (imageFile) {
        try {
          const objectName = await this.minioService.uploadImage(
            imageFile,
            'teacher-images',
          );
          imageUrl = this.minioService.getProxiedUrl(objectName);

          // Delete old image if exists
          if (teacherInfo.user.image) {
            const oldImagePath = teacherInfo.user.image.split('/').pop();
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

      if (updateTeacherDto.name_kh !== undefined)
        userUpdateData.name_kh = updateTeacherDto.name_kh;
      if (updateTeacherDto.name_en !== undefined)
        userUpdateData.name_en = updateTeacherDto.name_en;
      if (updateTeacherDto.phone !== undefined)
        userUpdateData.phone = updateTeacherDto.phone;
      if (updateTeacherDto.gender !== undefined)
        userUpdateData.gender = updateTeacherDto.gender;
      if (updateTeacherDto.dob !== undefined)
        userUpdateData.dob = new Date(updateTeacherDto.dob);
      if (imageUrl !== undefined) userUpdateData.image = imageUrl;
      if (updateTeacherDto.is_active !== undefined)
        userUpdateData.is_active = updateTeacherDto.is_active;
      if (updateTeacherDto.address !== undefined)
        userUpdateData.address = updateTeacherDto.address;
      if (updateTeacherDto.password !== undefined) {
        const hashedPassword = await bcrypt.hash(updateTeacherDto.password, 10);
        userUpdateData.password = hashedPassword;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await queryRunner.manager.update(
          UserModel,
          teacherInfo.user_id,
          userUpdateData,
        );
      }

      // Update teacher info
      const teacherInfoUpdateData: any = {};

      if (updateTeacherDto.department_id !== undefined)
        teacherInfoUpdateData.department_id = updateTeacherDto.department_id;
      if (updateTeacherDto.is_active !== undefined)
        teacherInfoUpdateData.is_active = updateTeacherDto.is_active;

      if (Object.keys(teacherInfoUpdateData).length > 0) {
        await queryRunner.manager.update(
          TeacherInfoModel,
          teacherInfo.id,
          teacherInfoUpdateData,
        );
      }

      await queryRunner.commitTransaction();

      // Fetch updated data with relations
      const updatedTeacherInfo = await this.teacherInfoRepository.findOne({
        where: { id: teacherInfo.id },
        relations: ['user', 'department'],
      });

      if (!updatedTeacherInfo) {
        throw new Error('Failed to fetch updated teacher data');
      }

      return {
        id: updatedTeacherInfo.id,
        teacher_id: updatedTeacherInfo.teacher_id,
        name_kh: updatedTeacherInfo.user.name_kh,
        name_en: updatedTeacherInfo.user.name_en,
        email: updatedTeacherInfo.user.email,
        phone: updatedTeacherInfo.user.phone,
        address: updatedTeacherInfo.user.address,
        gender: updatedTeacherInfo.user.gender,
        dob: this.formatDate(updatedTeacherInfo.user.dob),
        image: updatedTeacherInfo.user.image,
        is_active: updatedTeacherInfo.is_active && updatedTeacherInfo.user.is_active,
        department_id: updatedTeacherInfo.department_id || undefined,
        department: updatedTeacherInfo.department?.name || '',
        created_at: updatedTeacherInfo.createdAt,
        updated_at: updatedTeacherInfo.user.updatedAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to update teacher: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTeacher(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Find the teacher info first with user details
    let teacherInfo = await this.teacherInfoRepository.findOne({
      where: [
        { teacher_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user'],
    });

    // If not found by teacher_id or id, try to find by user_id
    if (!teacherInfo) {
      teacherInfo = await this.teacherInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user'],
      });
    }

    if (!teacherInfo) {
      throw new NotFoundException(`Teacher with identifier ${id} not found`);
    }

    if (!teacherInfo.user) {
      throw new NotFoundException('Teacher user account not found');
    }

    const teacherNameKh = teacherInfo.user.name_kh || '';
    const teacherNameEn = teacherInfo.user.name_en || '';

    // Format the name for the message
    let formattedName = teacherNameKh;
    if (teacherNameKh && teacherNameEn) {
      formattedName = `${teacherNameKh} (${teacherNameEn})`;
    } else if (teacherNameEn) {
      formattedName = teacherNameEn;
    }

    const queryRunner =
      this.teacherInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete the teacher info
      teacherInfo.is_active = false;
      await queryRunner.manager.save(teacherInfo);

      // Soft delete the associated user
      if (teacherInfo.user) {
        teacherInfo.user.is_active = false;
        await queryRunner.manager.save(teacherInfo.user);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `Teacher ${formattedName} has been deleted successfully`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete teacher: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
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
        query.orderBy('teacher.teacher_id', sortOrder);
        break;
      case 'created_at':
        query.orderBy('teacher.createdAt', sortOrder);
        break;
      default:
        query.orderBy('user.name_en', sortOrder);
        break;
    }
  }

  private formatDate(date: any): string {
    if (!date) return '';

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }

      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return date;
    }

    return String(date);
  }

  private async getDataSetup(): Promise<DataSetupDto> {
    const departments = await this.departmentRepository.find({
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    return {
      departments,
    };
  }

  private async validateReferences(departmentId: number): Promise<void> {
    if (departmentId) {
      const department = await this.departmentRepository.findOne({
        where: { id: departmentId },
      });

      if (!department) {
        throw new Error(`Department ${departmentId} not found`);
      }
    }
  }

  async getGenderOptions(): Promise<string[]> {
    const genders = await this.userRepository
      .createQueryBuilder('user')
      .select('DISTINCT user.gender', 'gender')
      .where('user.role = :role', { role: Role.TEACHER })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('user.gender IS NOT NULL')
      .andWhere("user.gender != ''")
      .orderBy('user.gender', 'ASC')
      .getRawMany();

    return genders.map((g) => g.gender).filter((g) => g);
  }
}