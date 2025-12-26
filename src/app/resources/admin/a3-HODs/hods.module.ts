import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { MinioService } from '../../services/minio/minio.service';
import { HodController } from '../a3-HODs/hods.controller';
import { HodService } from '../a3-HODs/hods.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HodInfoModel, UserModel, DepartmentModel]),
  ],
  controllers: [HodController],
  providers: [HodService, MinioService],
  exports: [HodService],
})
export class HodModule {}
