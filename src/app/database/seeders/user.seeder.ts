import { UserModel } from '../models/user.model';

import * as bcrypt from 'bcryptjs';
import { Role } from 'src/app/common/enum/role.enum';
import { AppDataSource } from 'src/app/config/data-source';

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
        name: 'Admin User',
        stuId: 'ADMIN000',
        email: 'admin@example.com',
        password: await hashPassword('123456'),
        phone: '012345678',
        gender: 'Male',
        address: 'Phnom Penh',
        dob: new Date('1990-01-01'),
        year: 'N/A',
        emergencyContact: '099888777',
        role: Role.ADMIN,
      },
      {
        name: 'Dr. Sokha Head',
        stuId: 'HOD001',
        email: 'hod@example.com',
        password: await hashPassword('123456'),
        phone: '012345679',
        gender: 'Female',
        address: 'Siem Reap',
        dob: new Date('1985-03-15'),
        year: 'N/A',
        emergencyContact: '098765432',
        role: Role.HEAD_OF_DEPARTMENT,
      },
      {
        name: 'Prof. Ratha',
        stuId: 'TCH001',
        email: 'teacher@example.com',
        password: await hashPassword('123456'),
        phone: '012345680',
        gender: 'Male',
        address: 'Battambang',
        dob: new Date('1992-07-22'),
        year: 'N/A',
        emergencyContact: '011223344',
        role: Role.TEACHER,
      },
      {
        name: 'Student Chantha',
        stuId: 'S2025001',
        email: 'student@example.com',
        password: await hashPassword('123456'),
        phone: '012345681',
        gender: 'Female',
        address: 'Phnom Penh',
        dob: new Date('2003-11-10'),
        year: '3rd Year',
        emergencyContact: '090123456',
        role: Role.STUDENT,
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
