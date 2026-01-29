import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { adminRoutes } from './teacher.routes';
import { TeacherDashboardModule } from './h1-dashboard/dashboard.module';
import { TeacherStudentsModule } from './h2-students/students.module';

@Module({
  imports: [
    TeacherDashboardModule,
    TeacherStudentsModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [],
  providers: [],
})
export class TeacherModule {}
