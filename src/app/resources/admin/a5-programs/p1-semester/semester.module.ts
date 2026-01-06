import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramModel } from 'src/app/database/models/division/program.model';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import { SemesterController } from './semester.controller';
import { SemesterService } from './semester.service';
import { SemesterModel } from 'src/app/database/models/class/semester.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SemesterModel,
      ProgramModel,
      AcademicYearModel,
    ]),
  ],
  controllers: [SemesterController],
  providers: [SemesterService],
  exports: [SemesterService],
})
export class SemesterModule {}