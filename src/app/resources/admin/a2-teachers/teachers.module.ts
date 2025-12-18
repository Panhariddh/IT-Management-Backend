import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { TeacherController } from './teachers.controller';
import { TeacherService } from './teachers.service';
import { MinioService } from '../../services/minio/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherInfoModel,
      UserModel,
      DepartmentModel,
    ]),
  ],
  controllers: [TeacherController],
  providers: [TeacherService, MinioService],
  exports: [TeacherService],
})
export class TeacherModule {}