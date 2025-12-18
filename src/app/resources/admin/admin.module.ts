import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { adminRoutes } from './admin.routes';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';

@Module({
  imports: [
    StudentModule,
    TeacherModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}