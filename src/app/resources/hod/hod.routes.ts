import { Routes } from '@nestjs/core';
import { HodModule } from './hod.module';
import { HodDashboardModule } from './h1-dashboard/dashboard.module';
import { HodStudentsModule } from './h2-students/students.module';
import { HodTeachersModule } from './h3-teacher/teachers.module';

export const adminRoutes: Routes = [
  {
    path: 'hod',
    module: HodModule,
    children: [
      {
        path: 'dashboard',
        module: HodDashboardModule,
      },

      {
        path: 'students',
        module: HodStudentsModule,
      },

      {
        path: 'teachers',
        module: HodTeachersModule,
      },
    ],
  },
];
