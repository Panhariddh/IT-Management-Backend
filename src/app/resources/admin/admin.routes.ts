import { Routes } from '@nestjs/core';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';
import { HodModule } from './a3-HODs/hods.module';
import { AdminModule } from './admin.module';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    module: AdminModule,
    children: [
      {
        path: 'students',
        module: StudentModule,
      },
      {
        path: 'teachers',
        module: TeacherModule,
      },
      {
        path: 'hods',
        module: HodModule,
      },
      {
        path: 'profile',
        module: AdminModule,
      },
    ],
  },
];
