import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { UserModel } from 'src/app/database/models/user.model';
import { HodInfoModel } from 'src/app/database/models/info/hod-info.model';
import { ProgramController } from './program.controller';
import { ProgramService } from './program.service';



@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProgramModel,
      DepartmentModel,
      UserModel,
      HodInfoModel,
    ]),
  ],
  controllers: [ProgramController],
  providers: [ProgramService],
  exports: [ProgramService],
})
export class ProgramModule {}