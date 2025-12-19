import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { ConfigModule } from 'src/app/config/config.module';
import { AuthModule } from 'src/app/resources/auth/auth.module';
import { AppRoutingModule } from './app.route';
import { AdminModule } from './resources/admin/admin.module';
import { MinioModule } from './resources/services/minio/minio.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule,
    AuthModule,
    AdminModule,
    MinioModule,
    AppRoutingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
