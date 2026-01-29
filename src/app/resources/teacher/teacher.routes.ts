import { Routes } from '@nestjs/core';
import { TeacherModule } from './teacher.module';
import { TeacherDashboardModule } from './h1-dashboard/dashboard.module';
import { TeacherStudentsModule } from './h2-students/students.module';

export const adminRoutes: Routes = [
  {
    path: 'hod',
    module: TeacherModule,
    children: [
      {
        path: 'dashboard',
        module: TeacherDashboardModule,
      },

      {
        path: 'students',
        module: TeacherStudentsModule,
      },

    ],
  },
];
