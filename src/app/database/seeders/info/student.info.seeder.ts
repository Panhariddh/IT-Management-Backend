import { AppDataSource } from "src/app/config/data-source";
import { StudentInfoModel } from "../../models/info/student-info.model";
import { UserModel } from "../../models/user.model";
import { DepartmentModel } from "../../models/division/department.model";
import { SectionModel } from "../../models/division/section.model";
import { ProgramModel } from "../../models/division/program.model";
import { Role } from "src/app/common/enum/role.enum";


export class StudentInfoSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(StudentInfoModel);
    const userRepo = AppDataSource.getRepository(UserModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);
    const sectionRepo = AppDataSource.getRepository(SectionModel);
    const programRepo = AppDataSource.getRepository(ProgramModel);

    const studentUser = await userRepo.findOne({ where: { role: Role.STUDENT }
 });
    const department = await deptRepo.findOne({ where: { name: 'Computer Science' } });
    const section = await sectionRepo.findOne({ where: { name: 'CS-A' } });
    const program = await programRepo.findOne({ where: { name: 'Software Engineering' } });

    if (studentUser && department && section && program) {
      const existing = await repo.findOne({ where: { user_id: studentUser.id } });
      if (!existing) {
        await repo.save({
          user_id: studentUser.id,
          user: studentUser,
          student_id: 'S-001',
          grade: 'A',
          student_year: 1,
          academic_year: '2025-2026',
          department_id: department.id,
          department: department,
          section_id: section.id,
          section: section,
          program_id: program.id,
          program: program,
        });
      }
    }

    console.log('✅ StudentInfoSeeder completed.');
  }
}
