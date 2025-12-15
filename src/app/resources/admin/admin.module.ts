// src/app/resources/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { adminRoutes } from './admin.routes';
import { StudentModule } from './a1-students/students.module';
import { UploadModule } from './a2-test-delete-soon/upload.module';

@Module({
  imports: [
    StudentModule,
    UploadModule,
    RouterModule.register(adminRoutes),
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}