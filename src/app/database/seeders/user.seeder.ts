import { UserModel } from '../models/user.model';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enum/role.enum';
import { AppDataSource } from '../../config/data-source';
import * as path from 'path';

export class UserSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(UserModel);

    // Hash password helper
    const hashPassword = async (plainText: string) => {
      const saltRounds = 10;
      return bcrypt.hash(plainText, saltRounds);
    };

    // Default avatar path
    const defaultAvatar = path.join('src', 'public', 'images', 'avatar.jpg');

    const users = [
      {
        image: defaultAvatar,
        name_kh: 'អភិបាលប្រព័ន្ធ',
        name_en: 'Admin',
        email: 'admin@example.com',
        password: await hashPassword('123456'),
        phone: '012345678',
        gender: 'Male',
        address: 'Phnom Penh',
        dob: new Date('1990-01-01'),
        role: Role.ADMIN,
        is_active: true,
      },
      {
        image: defaultAvatar,
        name_kh: 'ថាយណារី',
        name_en: 'Tighnari',
        email: 'h1@example.com',
        password: await hashPassword('123456'),
        phone: '012345679',
        gender: 'Male',
        address: 'Siem Reap',
        dob: new Date('1985-03-15'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      // HOD 2
      {
        image: defaultAvatar,
        name_kh: 'វិចិត្រ',
        name_en: 'Vichet',
        email: 'h2@example.com',
        password: await hashPassword('123456'),
        phone: '012345680',
        gender: 'Male',
        address: 'Phnom Penh',
        dob: new Date('1978-06-20'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      // HOD 3
      {
        image: defaultAvatar,
        name_kh: 'សុខនី',
        name_en: 'Sokny',
        email: 'h3@example.com',
        password: await hashPassword('123456'),
        phone: '012345681',
        gender: 'Female',
        address: 'Battambang',
        dob: new Date('1980-09-12'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      // HOD 4
      {
        image: defaultAvatar,
        name_kh: 'រិទ្ធិ',
        name_en: 'Rithy',
        email: 'h4@example.com',
        password: await hashPassword('123456'),
        phone: '012345682',
        gender: 'Male',
        address: 'Kampong Cham',
        dob: new Date('1975-11-30'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      // HOD 5
      {
        image: defaultAvatar,
        name_kh: 'ម៉ាលីន',
        name_en: 'Malin',
        email: 'h5@example.com',
        password: await hashPassword('123456'),
        phone: '012345683',
        gender: 'Female',
        address: 'Preah Sihanouk',
        dob: new Date('1982-04-25'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      // Teacher 1
      {
        image: defaultAvatar,
        name_kh: 'ហ្លីន',
        name_en: 'Flins',
        email: 'teacher1@example.com',
        password: await hashPassword('123456'),
        phone: '012345680',
        gender: 'Male',
        address: 'Battambang',
        dob: new Date('1992-07-22'),
        role: Role.TEACHER,
        is_active: true,
      },
      // Teacher 2
      {
        image: defaultAvatar,
        name_kh: 'សម្តេច',
        name_en: 'Sam Tech',
        email: 'teacher2@example.com',
        password: await hashPassword('123456'),
        phone: '012345681',
        gender: 'Male',
        address: 'Phnom Penh',
        dob: new Date('1988-05-10'),
        role: Role.TEACHER,
        is_active: true,
      },
      // Teacher 3
      {
        image: defaultAvatar,
        name_kh: 'សុខា',
        name_en: 'Sokha',
        email: 'teacher3@example.com',
        password: await hashPassword('123456'),
        phone: '012345682',
        gender: 'Female',
        address: 'Kampong Cham',
        dob: new Date('1990-11-25'),
        role: Role.TEACHER,
        is_active: true,
      },
      // Teacher 4
      {
        image: defaultAvatar,
        name_kh: 'រិទ្ធិចន្ទ',
        name_en: 'RithyChan',
        email: 'teacher4@example.com',
        password: await hashPassword('123456'),
        phone: '012345683',
        gender: 'Male',
        address: 'Sihanoukville',
        dob: new Date('1985-08-15'),
        role: Role.TEACHER,
        is_active: true,
      },
      // Teacher 5
      {
        image: defaultAvatar,
        name_kh: 'វណ្ណា',
        name_en: 'Vanna',
        email: 'teacher5@example.com',
        password: await hashPassword('123456'),
        phone: '012345684',
        gender: 'Female',
        address: 'Takeo',
        dob: new Date('1993-03-30'),
        role: Role.TEACHER,
        is_active: true,
      },
      // Student users (use default avatar if none provided)
      {
        image: defaultAvatar,
        name_kh: 'លុង សុធានី',
        name_en: 'Long Sothany',
        email: 'student1@example.com',
        password: await hashPassword('123456'),
        role: Role.STUDENT,
        gender: 'Male',
        dob: new Date('2004-02-20'),
        phone: '012345682',
        address: 'Phnom Penh',
        is_active: true,
      },
      {
        image: defaultAvatar,
        name_kh: 'ហួ ម៉េងលី',
        name_en: 'Hou Mengly',
        email: 'student2@example.com',
        password: await hashPassword('123456'),
        role: Role.STUDENT,
        gender: 'Female',
        dob: new Date('2003-10-16'),
        phone: '095266386',
        address: 'Phnom Penh',
        is_active: true,
      },
      {
        image: defaultAvatar,
        name_kh: 'មាស សុផល',
        name_en: 'Meas Sophal',
        email: 'student3@example.com',
        password: await hashPassword('123456'),
        role: Role.STUDENT,
        gender: 'Male',
        dob: new Date('2005-11-03'),
        phone: '012345684',
        address: 'Phnom Penh',
        is_active: true,
      },
      {
        image: defaultAvatar,
        name_kh: 'ឃួន ចាន់ណារី',
        name_en: 'Khun Channary',
        email: 'student4@example.com',
        password: await hashPassword('123456'),
        role: Role.STUDENT,
        gender: 'Female',
        dob: new Date('2004-05-30'),
        phone: '012345685',
        address: 'Phnom Penh',
        is_active: true,
      },
      {
        image: defaultAvatar,
        name_kh: 'ហេង វីរៈ',
        name_en: 'Heng Virak',
        email: 'student5@example.com',
        password: await hashPassword('123456'),
        role: Role.STUDENT,
        gender: 'Male',
        dob: new Date('2003-12-12'),
        phone: '012345686',
        address: 'Phnom Penh',
        is_active: true,
      },
    ];

    // Save all users
    for (const userData of users) {
      const existing = await repo.findOne({ where: { email: userData.email } });
      if (!existing) {
        await repo.save(userData);
      }
    }
  }
}
