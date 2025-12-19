import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from 'src/app/resources/auth/auth.module';
import { AdminModule } from './resources/admin/admin.module';
import { MinioModule } from './resources/services/minio/minio.module';

@Module({
  imports: [
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
      },
      {
        path: 'auth',
        module: AuthModule,
      },
      {
        path: 'images',
        module: MinioModule,
      },
    ]),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
