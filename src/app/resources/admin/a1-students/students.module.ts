import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentModel } from 'src/app/database/models/division/department.model';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SectionModel } from 'src/app/database/models/division/section.model';
import { StudentInfoModel } from 'src/app/database/models/info/student-info.model';
import { UserModel } from 'src/app/database/models/user.model';
import { StudentController } from './students.controller';
import { StudentService } from './students.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentInfoModel,
      UserModel,
      DepartmentModel,
      SectionModel,
      ProgramModel,
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}