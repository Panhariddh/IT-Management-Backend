import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { ProfileModule } from './a1-profile/profile.module';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';
import { HodModule } from './a3-HODs/hods.module';
import { adminRoutes } from './admin.routes';

@Module({
  imports: [
    StudentModule,
    TeacherModule,
    HodModule,
    RouterModule.register(adminRoutes),
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
