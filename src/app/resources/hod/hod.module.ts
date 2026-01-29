import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { adminRoutes } from './hod.routes';
import { HodDashboardModule } from './h1-dashboard/dashboard.module';
import { HodStudentsModule } from './h2-students/students.module';
import { HodTeachersModule } from './h3-teacher/teachers.module';

@Module({
  imports: [
    HodDashboardModule,
    HodStudentsModule,
    HodTeachersModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [],
  providers: [],
})
export class HodModule {}
