import { Routes } from '@nestjs/core';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';


import { DepartmentModule } from './a4-departments/department.module';
import { AdminModule } from './admin.module';
import { HodModule } from './a3-hods/hods.module';

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
        path: 'departments',
        module: DepartmentModule,
      },
      {
        path: 'profile',
        module: AdminModule,
      },
    ],
  },
];
