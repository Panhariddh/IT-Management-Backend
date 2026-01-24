import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { HodModule } from '../admin/a3-HODs/hods.module';
import { ProfileModule } from './a1-profile/profile.module';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';
import { DepartmentModule } from './a4-departments/department.module';
import { SemesterModule } from './a5-programs/p1-semester/semester.module';
import { ProgramModule } from './a5-programs/program.module';
import { SubjectModule } from './a5-subjects/subject.module';
import { ClassModule } from './a6-schedule/classes/class.module';
import { ScheduleModule } from './a6-schedule/schedule.module';
import { RoomModule } from './a7-rooms/room.module';
import { adminRoutes } from './admin.routes';

@Module({
  imports: [
    StudentModule,
    TeacherModule,
    HodModule,
    DepartmentModule,
    ProgramModule,
    ProgramModule,
    SemesterModule,
    SubjectModule,
    RouterModule.register(adminRoutes),
    ProfileModule,
    ScheduleModule,
    RoomModule,
    ClassModule,
  ],
  controllers: [],
  providers: [],
})
export class AdminModule {}
