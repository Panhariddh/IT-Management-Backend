import { Routes } from '@nestjs/core';
import { StudentModule } from './a1-students/students.module';
import { TeacherModule } from './a2-teachers/teachers.module';

import { HodModule } from './a3-HODs/hods.module';
import { DepartmentModule } from './a4-departments/department.module';
import { SemesterModule } from './a5-programs/p1-semester/semester.module';
import { ProgramModule } from './a5-programs/program.module';
import { SubjectModule } from './a5-subjects/subject.module';
import { AdminModule } from './admin.module';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    module: AdminModule,
    children: [
      {
        path: 'students',
        module: StudentModule,
      },
      {
        path: 'teachers',
        module: TeacherModule,
      },
      {
        path: 'hods',
        module: HodModule,
      },
      {
        path: 'departments',
        module: DepartmentModule,
      },
      {
        path: 'programs',
        module: ProgramModule,
        children: [
          {
            path: ':programId/semesters',
            module: SemesterModule,
          },
        ],
      },
      {
        path: 'subjects',
        module: SubjectModule,
      },
      {
        path: 'profile',
        module: AdminModule,
      },
    ],
  },
];
