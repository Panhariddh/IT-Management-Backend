// src/app/resources/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminController } from './admin.controller';

import { adminRoutes } from './admin.routes';
import { StudentModule } from './a1-students/students.module';

@Module({
  imports: [
    StudentModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [AdminController],
  providers: [],
})
export class AdminModule {}