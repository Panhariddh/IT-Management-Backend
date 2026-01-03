import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Role } from 'src/app/common/enum/role.enum';
// import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';
import { UserModel } from 'src/app/database/models/user.model';

import { MinioService } from '../../services/minio/minio.service';
import {
  CreateHodDto,
  DataSetupDto,
  HodDetailDto,
  HodDto,
  MetaDto,
  UpdateHodDto,
} from '../a3-hods/hods.dto';

interface GetAllHodsParams {
  page: number;
  limit: number;
  departmentId?: number;
  gender?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  isActive?: boolean;
}

interface GetAllHodsResult {
  hods: HodDto[];
  dataSetup: DataSetupDto;
  meta: MetaDto;
}

@Injectable()
export class HodService {
  constructor(
    @InjectRepository(HodInfoModel)
    private hodInfoRepository: Repository<HodInfoModel>,
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
    @InjectRepository(DepartmentModel)
    private departmentRepository: Repository<DepartmentModel>,
    private minioService: MinioService,
  ) {}

  async getAllHods(params: GetAllHodsParams): Promise<GetAllHodsResult> {
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
    const query = this.hodInfoRepository
      .createQueryBuilder('hod')
      .innerJoinAndSelect('hod.user', 'user')
      .leftJoinAndSelect('hod.department', 'department')
      .where('user.role = :role', { role: Role.HEAD_OF_DEPARTMENT });

    // Apply active status filter
    if (isActive !== undefined) {
      query.andWhere('hod.is_active = :isActive', { isActive });
      query.andWhere('user.is_active = :isActive', { isActive });
    } else {
      // Default: show active only
      query.andWhere('hod.is_active = :isActive', { isActive: true });
      query.andWhere('user.is_active = :isActive', { isActive: true });
    }

    // Apply gender filter
    if (gender) {
      query.andWhere('user.gender = :gender', { gender });
    }

    // Apply department filter
    if (departmentId) {
      query.andWhere('hod.department_id = :departmentId', { departmentId });
    }

    // Apply search filter
    if (search) {
      const cleanSearch = search.trim();
      query.andWhere(
        '(user.name_kh LIKE :search OR user.name_en LIKE :search OR hod.hod_id LIKE :search)',
        { search: `%${cleanSearch}%` },
      );
    }

    // Apply sorting
    this.applySorting(query, sortBy, sortOrder);

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const hodInfos = await query.skip(skip).take(limit).getMany();

    // Transform to DTO
    const hods: HodDto[] = hodInfos.map((hod) => ({
      id: hod.id,
      hod_id: hod.hod_id,
      name_kh: hod.user.name_kh,
      name_en: hod.user.name_en,
      email: hod.user.email,
      dob: this.formatDate(hod.user.dob),
      phone: hod.user.phone,
      gender: hod.user.gender,
      department: hod.department?.name || '',
    }));

    // Get data setup
    const dataSetup = await this.getDataSetup();

    const meta: MetaDto = {
      page,
      limit,
      total,
    };

    return {
      hods,
      dataSetup,
      meta,
    };
  }

  async getHodById(id: string): Promise<HodDetailDto> {
    let hodInfo = await this.hodInfoRepository.findOne({
      where: [
        { hod_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: {
        user: true,
        department: true,
      },
    });

    // If not found by hod_id or id, try to find by user_id
    if (!hodInfo) {
      hodInfo = await this.hodInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: {
          user: true,
          department: true,
        },
      });
    }

    if (!hodInfo) {
      throw new NotFoundException(`Hod with identifier ${id} not found`);
    }

    // Check if user exists and is active
    if (!hodInfo.user || !hodInfo.user.is_active) {
      throw new NotFoundException('Hod user account not found or inactive');
    }

    return {
      id: hodInfo.id,
      hod_id: hodInfo.hod_id,
      name_kh: hodInfo.user.name_kh,
      name_en: hodInfo.user.name_en,
      email: hodInfo.user.email,
      phone: hodInfo.user.phone,
      dob: this.formatDate(hodInfo.user.dob),
      address: hodInfo.user.address,
      gender: hodInfo.user.gender,
      image: hodInfo.user.image,
      is_active: hodInfo.is_active && hodInfo.user.is_active,
      department_id: hodInfo.department_id || undefined,
      department: hodInfo.department?.name || '',
      created_at: hodInfo.createdAt,
      updated_at: hodInfo.user.updatedAt,
    };
  }

  async getHodByUserId(userId: string): Promise<HodDetailDto> {
    const hodInfo = await this.hodInfoRepository.findOne({
      where: { user_id: userId, is_active: true },
      relations: {
        user: true,
        department: true,
      },
    });

    if (!hodInfo) {
      throw new NotFoundException(`Hod with user ID ${userId} not found`);
    }

    if (!hodInfo.user || !hodInfo.user.is_active) {
      throw new NotFoundException('Hod user account not found or inactive');
    }

    return {
      id: hodInfo.id,
      hod_id: hodInfo.hod_id,
      name_kh: hodInfo.user.name_kh,
      name_en: hodInfo.user.name_en,
      email: hodInfo.user.email,
      phone: hodInfo.user.phone,
      dob: this.formatDate(hodInfo.user.dob),
      address: hodInfo.user.address,
      gender: hodInfo.user.gender,
      image: hodInfo.user.image,
      is_active: hodInfo.is_active && hodInfo.user.is_active,
      department_id: hodInfo.department_id || undefined,
      department: hodInfo.department?.name || '',
      created_at: hodInfo.createdAt,
      updated_at: hodInfo.user.updatedAt,
    };
  }

  async getNextHodId(): Promise<string> {
    // Find highest hod number
    const hods = await this.hodInfoRepository
      .createQueryBuilder('hod')
      .where('hod.hod_id LIKE :pattern', {
        pattern: 'h%',
      })
      .getMany();

    let maxNumber = 0;

    hods.forEach((hod) => {
      const id = hod.hod_id;

      if (id.startsWith('h') && id.length >= 9) {
        const numberPart = id.slice(1); // After "t"
        const currentYear = new Date().getFullYear();

        // Check if it starts with current year
        if (id.startsWith(`h${currentYear}`)) {
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
    const newHodId = `h${currentYear}${formattedNumber}`;

    // Check uniqueness
    const exists = await this.hodInfoRepository.findOne({
      where: { hod_id: newHodId },
    });

    if (exists) {
      throw new Error(`Hod ID ${newHodId} already exists. Try again.`);
    }

    return newHodId;
  }

  async createHod(
    createHodDto: CreateHodDto,
    imageFile?: Express.Multer.File,
  ): Promise<HodDetailDto> {
    // Auto-generate hod ID
    const hodId = await this.getNextHodId();

    // Auto-generate email
    const email = `${hodId}@rtc.edu.kh`;

    // Validate foreign key references
    if (createHodDto.department_id) {
      await this.validateReferences(createHodDto.department_id);
    }

    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageFile) {
      try {
        const objectName = await this.minioService.uploadImage(
          imageFile,
          'hod-images',
        );
        imageUrl = this.minioService.getProxiedUrl(objectName);
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    // Use provided password or auto-generate (same as hod ID)
    const password = createHodDto.password || hodId;

    // Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with image
    const user = this.userRepository.create({
      name_kh: createHodDto.name_kh,
      name_en: createHodDto.name_en,
      email: email, // Use auto-generated email
      password: hashedPassword,
      phone: createHodDto.phone,
      gender: createHodDto.gender,
      dob: new Date(createHodDto.dob),
      role: Role.HEAD_OF_DEPARTMENT,
      address: createHodDto.address,
      is_active: true,
      image: imageUrl,
    });

    const savedUser = await this.userRepository.save(user);

    // Create hod info
    const hodInfo = this.hodInfoRepository.create({
      user_id: savedUser.id,
      hod_id: hodId,
      department_id: createHodDto.department_id,
      is_active: true,
    });

    const savedHodInfo = await this.hodInfoRepository.save(hodInfo);

    // Fetch the complete hod with relations
    const completeHod = await this.hodInfoRepository.findOne({
      where: { id: savedHodInfo.id },
      relations: ['user', 'department'],
    });

    if (!completeHod) {
      throw new Error('Failed to fetch created hod data');
    }

    return {
      id: completeHod.id,
      hod_id: completeHod.hod_id,
      name_kh: completeHod.user.name_kh,
      name_en: completeHod.user.name_en,
      email: completeHod.user.email,
      phone: completeHod.user.phone,
      dob: this.formatDate(completeHod.user.dob),
      address: completeHod.user.address,
      gender: completeHod.user.gender,
      image: completeHod.user.image,
      is_active: completeHod.is_active && completeHod.user.is_active,
      department_id: completeHod.department_id || undefined,
      department: completeHod.department?.name || '',
      created_at: completeHod.createdAt,
      updated_at: completeHod.user.updatedAt,
    };
  }

  async updateHod(
    id: string,
    updateHodDto: UpdateHodDto,
    imageFile?: Express.Multer.File,
  ): Promise<HodDetailDto> {
    // Find hod info with user details
    let hodInfo = await this.hodInfoRepository.findOne({
      where: [
        { hod_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user', 'department'],
    });

    // If not found by hod_id or id, try to find by user_id
    if (!hodInfo) {
      hodInfo = await this.hodInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user', 'department'],
      });
    }

    if (!hodInfo) {
      throw new NotFoundException(`Hod with identifier ${id} not found`);
    }

    if (!hodInfo.user) {
      throw new NotFoundException('Hod user account not found');
    }

    const queryRunner =
      this.hodInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate foreign key references if provided
      if (updateHodDto.department_id) {
        await this.validateReferences(updateHodDto.department_id);
      }

      let imageUrl: string | undefined = hodInfo.user.image;

      // Upload new image if provided
      if (imageFile) {
        try {
          const objectName = await this.minioService.uploadImage(
            imageFile,
            'hod-images',
          );
          imageUrl = this.minioService.getProxiedUrl(objectName);

          // Delete old image if exists
          if (hodInfo.user.image) {
            const oldImagePath = hodInfo.user.image.split('/').pop();
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

      if (updateHodDto.name_kh !== undefined)
        userUpdateData.name_kh = updateHodDto.name_kh;
      if (updateHodDto.name_en !== undefined)
        userUpdateData.name_en = updateHodDto.name_en;
      if (updateHodDto.phone !== undefined)
        userUpdateData.phone = updateHodDto.phone;
      if (updateHodDto.gender !== undefined)
        userUpdateData.gender = updateHodDto.gender;
      if (updateHodDto.dob !== undefined)
        userUpdateData.dob = new Date(updateHodDto.dob);
      if (imageUrl !== undefined) userUpdateData.image = imageUrl;
      if (updateHodDto.is_active !== undefined)
        userUpdateData.is_active = updateHodDto.is_active;
      if (updateHodDto.address !== undefined)
        userUpdateData.address = updateHodDto.address;
      if (updateHodDto.password !== undefined) {
        const hashedPassword = await bcrypt.hash(updateHodDto.password, 10);
        userUpdateData.password = hashedPassword;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await queryRunner.manager.update(
          UserModel,
          hodInfo.user_id,
          userUpdateData,
        );
      }

      // Update hod info
      const hodInfoUpdateData: any = {};

      if (updateHodDto.department_id !== undefined)
        hodInfoUpdateData.department_id = updateHodDto.department_id;
      if (updateHodDto.is_active !== undefined)
        hodInfoUpdateData.is_active = updateHodDto.is_active;

      if (Object.keys(hodInfoUpdateData).length > 0) {
        await queryRunner.manager.update(
          HodInfoModel,
          hodInfo.id,
          hodInfoUpdateData,
        );
      }

      await queryRunner.commitTransaction();

      // Fetch updated data with relations
      const updatedHodInfo = await this.hodInfoRepository.findOne({
        where: { id: hodInfo.id },
        relations: ['user', 'department'],
      });

      if (!updatedHodInfo) {
        throw new Error('Failed to fetch updated hod data');
      }

      return {
        id: updatedHodInfo.id,
        hod_id: updatedHodInfo.hod_id,
        name_kh: updatedHodInfo.user.name_kh,
        name_en: updatedHodInfo.user.name_en,
        email: updatedHodInfo.user.email,
        phone: updatedHodInfo.user.phone,
        address: updatedHodInfo.user.address,
        gender: updatedHodInfo.user.gender,
        dob: this.formatDate(updatedHodInfo.user.dob),
        image: updatedHodInfo.user.image,
        is_active: updatedHodInfo.is_active && updatedHodInfo.user.is_active,
        department_id: updatedHodInfo.department_id || undefined,
        department: updatedHodInfo.department?.name || '',
        created_at: updatedHodInfo.createdAt,
        updated_at: updatedHodInfo.user.updatedAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to update hod: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteHod(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Find the hod info first with user details
    let hodInfo = await this.hodInfoRepository.findOne({
      where: [
        { hod_id: id, is_active: true },
        { id: id, is_active: true },
      ],
      relations: ['user'],
    });

    // If not found by hod_id or id, try to find by user_id
    if (!hodInfo) {
      hodInfo = await this.hodInfoRepository.findOne({
        where: { user_id: id, is_active: true },
        relations: ['user'],
      });
    }

    if (!hodInfo) {
      throw new NotFoundException(`Hod with identifier ${id} not found`);
    }

    if (!hodInfo.user) {
      throw new NotFoundException('Hod user account not found');
    }

    const hodNameKh = hodInfo.user.name_kh || '';
    const hodNameEn = hodInfo.user.name_en || '';

    // Format the name for the message
    let formattedName = hodNameKh;
    if (hodNameKh && hodNameEn) {
      formattedName = `${hodNameKh} (${hodNameEn})`;
    } else if (hodNameEn) {
      formattedName = hodNameEn;
    }

    const queryRunner =
      this.hodInfoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft delete the hod info
      hodInfo.is_active = false;
      await queryRunner.manager.save(hodInfo);

      // Soft delete the associated user
      if (hodInfo.user) {
        hodInfo.user.is_active = false;
        await queryRunner.manager.save(hodInfo.user);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: `Hod ${formattedName} has been deleted successfully`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Failed to delete hod: ${error.message}`);
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
      case 'hod_id':
        query.orderBy('hod.hod_id', sortOrder);
        break;
      case 'created_at':
        query.orderBy('hod.createdAt', sortOrder);
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
      .where('user.role = :role', { role: Role.HEAD_OF_DEPARTMENT })
      .andWhere('user.is_active = :isActive', { isActive: true })
      .andWhere('user.gender IS NOT NULL')
      .andWhere("user.gender != ''")
      .orderBy('user.gender', 'ASC')
      .getRawMany();

    return genders.map((g) => g.gender).filter((g) => g);
  }
}
