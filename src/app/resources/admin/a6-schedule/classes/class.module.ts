import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassModel } from 'src/app/database/models/class/class.model';
import { SemesterModel } from 'src/app/database/models/class/semester.model';
import { SubjectModel } from 'src/app/database/models/class/subject.model';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassModel, SubjectModel, SemesterModel]),
  ],
  controllers: [ClassController],
  providers: [ClassService],
  exports: [ClassService],
})
export class ClassModule {}
