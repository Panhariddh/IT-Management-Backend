import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { HodModule } from '../admin/a3-hods/hods.module';
import { ProfileModule } from './a1-profile/profile.module';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';
import { DepartmentModule } from './a4-departments/department.module';
import { adminRoutes } from './admin.routes';
import { ProgramModule } from './a5-programs/program.module';

@Module({
  imports: [
    StudentModule,
    TeacherModule,
    HodModule,
    DepartmentModule,
    ProgramModule,
    ProgramModule,
    RouterModule.register(adminRoutes),
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
