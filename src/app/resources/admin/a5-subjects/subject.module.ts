import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramModel } from 'src/app/database/models/division/program.model';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { SubjectModel } from 'src/app/database/models/class/subject.model';
import { SemesterModel } from 'src/app/database/models/class/semester.model';
import { TeacherInfoModel } from 'src/app/database/models/info/teacher-info.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubjectModel,
      ProgramModel,
      SemesterModel,
      TeacherInfoModel,
    ]),
  ],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
