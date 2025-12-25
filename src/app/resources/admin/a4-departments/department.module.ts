import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { UserModel } from 'src/app/database/models/user.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';

import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { SectionModel } from 'src/app/database/models/division/section.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DepartmentModel,
      UserModel,
      HodInfoModel,
      SectionModel,
    ]),
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}