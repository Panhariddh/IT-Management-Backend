import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';
import { UserModel } from 'src/app/database/models/user.model';

import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { MinioService } from '../../services/minio/minio.service';
import { HodTeacherController } from './teachers.controller';
import { HodTeacherService } from './teachers.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherInfoModel,
      UserModel,
      DepartmentModel,
      SectionModel,
      ProgramModel,
      AcademicYearModel,
    ]),
  ],
  controllers: [HodTeacherController],
  providers: [HodTeacherService, MinioService],
})
export class HodTeachersModule {}