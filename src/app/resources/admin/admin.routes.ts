import { Routes } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { StudentModule } from './a1-students/students.module';
import { UploadModule } from './a2-test-delete-soon/upload.module';


export const adminRoutes: Routes = [
  {
    path: 'admin',
    module: AdminModule,
    children: [
      {
        path: 'students',
        module: StudentModule,
      },
         {
        path: 'upload',
        module: UploadModule,
      },
    ],
  },
];