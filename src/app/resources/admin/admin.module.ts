// src/app/resources/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { adminRoutes } from './admin.routes';
import { StudentModule } from './a1-students/students.module';

@Module({
  imports: [
    StudentModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}