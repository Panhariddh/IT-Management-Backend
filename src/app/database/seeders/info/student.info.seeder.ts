import { AppDataSource } from "src/app/config/data-source";
import { StudentInfoModel } from "../../models/info/student-info.model";
import { UserModel } from "../../models/user.model";
import { DepartmentModel } from "../../models/division/department.model";
import { SectionModel } from "../../models/division/section.model";
import { ProgramModel } from "../../models/division/program.model";
import { Role } from "src/app/common/enum/role.enum";
import { AcademicYearModel } from "../../models/academic.year.model";

export class StudentInfoSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(StudentInfoModel);
    const userRepo = AppDataSource.getRepository(UserModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);
    const sectionRepo = AppDataSource.getRepository(SectionModel);
    const programRepo = AppDataSource.getRepository(ProgramModel);
    const academicYearRepo = AppDataSource.getRepository(AcademicYearModel);

    // 🔹 Get current academic year
    const currentAcademicYear = await academicYearRepo.findOne({
      where: { isActive: true },
    });

    if (!currentAcademicYear) {
      throw new Error('❌ No active academic year found.');
    }

    // Get student users
    const studentUsers = await userRepo.find({
      where: { role: Role.STUDENT },
      order: { id: 'ASC' },
    });

    const departments = await deptRepo.find();
    const sections = await sectionRepo.find({ relations: ['department'] });
    const programs = await programRepo.find();

    const deptMap = new Map(departments.map(d => [d.name, d.id]));
    
    const sectionMap = new Map(sections.map(s => [
      `${s.name}-${s.department?.name}`, 
      s.id
    ]));
    
    const programMap = new Map(programs.map(p => [p.name, p.id]));

    const studentsData = [
      {
        student_id: 'e20250001',
        departmentName: 'Faculty of Medicine',
        sectionName: 'A', 
        programName: 'General Medicine',
        student_year: 1,
      },
      {
        student_id: 'e20250002',
        departmentName: 'Faculty of Engineering',
        sectionName: 'A', 
        programName: 'Software Engineering',
        student_year: 1,
      },
      {
        student_id: 'e20250003',
        departmentName: 'Faculty of Business',
        sectionName: 'A', 
        programName: 'Finance and Banking',
        student_year: 1,
      },
      {
        student_id: 'e20250004',
        departmentName: 'Faculty of Social Sciences',
        sectionName: 'A', 
        programName: 'International Relations',
        student_year: 1,
      },
      {
        student_id: 'e20250005',
        departmentName: 'Faculty of Science',
        sectionName: 'A', 
        programName: 'Computer Science',
        student_year: 1,
      },
    ];

    for (let i = 0; i < Math.min(studentUsers.length, studentsData.length); i++) {
      const user = studentUsers[i];
      const data = studentsData[i];

      const departmentId = deptMap.get(data.departmentName);
      const sectionKey = `${data.sectionName}-${data.departmentName}`;
      const sectionId = sectionMap.get(sectionKey);
      const programId = programMap.get(data.programName);

      if (!departmentId || !sectionId || !programId) {
        continue;
      }

      const existing = await repo.findOne({
        where: { user_id: user.id }, 
      });

      if (!existing) {
        const studentInfo = repo.create({
          user_id: user.id, 
          student_id: data.student_id,
          student_year: data.student_year,
          academic_year_id: currentAcademicYear.id,
          department_id: departmentId,
          section_id: sectionId,
          program_id: programId,
          is_active: true,
        });

        await repo.save(studentInfo);
      }
    }

    console.log('✅ StudentInfoSeeder completed.');
  }
}