import { UserModel } from '../models/user.model';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enum/role.enum';

import { AppDataSource } from '../../config/data-source';


export class UserSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(UserModel);

    // Hash password helper
    const hashPassword = async (plainText: string) => {
      const saltRounds = 10;
      return bcrypt.hash(plainText, saltRounds);
    };

    const users = [
      {
        image: 'https://upload-os-bbs.hoyolab.com/upload/2023/04/12/296858782/0ace090053e6c8c1266fa3cd00364654_7217898425771256910.jpg', 
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
        image: 'https://i.pinimg.com/736x/4c/9e/2e/4c9e2e7524b88a4d27222c245be24820.jpg',
        name_kh: 'ថាយណារី',
        name_en: 'Tighnari',
        email: 'hod@example.com',
        password: await hashPassword('123456'),
        phone: '012345679',
        gender: 'Male',
        address: 'Siem Reap',
        dob: new Date('1985-03-15'),
        role: Role.HEAD_OF_DEPARTMENT,
        is_active: true,
      },
      {
        image: 'https://i.pinimg.com/736x/92/7c/e8/927ce89ed61381dbdf03ae7d84469346.jpg',
        name_kh: 'ហ្លីន',
        name_en: 'Flins',
        email: 'teacher@example.com',
        password: await hashPassword('123456'),
        phone: '012345680',
        gender: 'Male',
        address: 'Battambang',
        dob: new Date('1992-07-22'),
        role: Role.TEACHER,
        is_active: true,
      },
      {
        image: 'https://i.pinimg.com/736x/6e/17/33/6e1733e7547da9618c9c1c07751a99fb.jpg',
        name_kh: 'ក្លរីន',
        name_en: 'Clorinde',
        email: 'student@example.com',
        password: await hashPassword('123456'),
        phone: '012345681',
        gender: 'Female',
        address: 'Phnom Penh',
        dob: new Date('2003-11-10'),
        role: Role.STUDENT,
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

    console.log('✅ UserSeeder completed with 4 roles.');
  }
}