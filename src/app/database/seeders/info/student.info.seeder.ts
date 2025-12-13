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

    // Get student users
    const studentUsers = await userRepo.find({ 
      where: { role: Role.STUDENT },
      order: { id: 'ASC' }
    });

    // Get all departments, sections, and programs
    const departments = await deptRepo.find();
    const sections = await sectionRepo.find();
    const programs = await programRepo.find();

    // Create lookup maps
    const deptMap = new Map(departments.map(dept => [dept.name, dept.id]));
    const sectionMap = new Map(sections.map(sec => [sec.name, sec.id]));
    const programMap = new Map(programs.map(prog => [prog.name, prog.id]));

    // Student data with IDs
    const studentsData = [
      { 
        student_id: 'e20250001', 
        departmentName: 'Faculty of Medicine', 
        sectionName: 'General Medicine', 
        programName: 'General Medicine',
        grade: 'A', 
        student_year: 1, 
        academic_year: '2025-2026' 
      },
      { 
        student_id: 'e20250002', 
        departmentName: 'Faculty of Engineering', 
        sectionName: 'Software Engineering', 
        programName: 'Software Engineering',
        grade: 'B', 
        student_year: 1, 
        academic_year: '2025-2026' 
      },
      { 
        student_id: 'e20250003', 
        departmentName: 'Faculty of Business', 
        sectionName: 'Finance and Banking', 
        programName: 'Finance and Banking',
        grade: 'A', 
        student_year: 1, 
        academic_year: '2025-2026' 
      },
      { 
        student_id: 'e20250004', 
        departmentName: 'Faculty of Social Sciences', 
        sectionName: 'International Relations', 
        programName: 'International Relations',
        grade: 'B', 
        student_year: 1, 
        academic_year: '2025-2026' 
      },
      { 
        student_id: 'e20250005', 
        departmentName: 'Faculty of Science', 
        sectionName: 'Computer Science', 
        programName: 'Computer Science',
        grade: 'A', 
        student_year: 1, 
        academic_year: '2025-2026' 
      },
    ];

    // Seed student info
    for (let i = 0; i < Math.min(studentUsers.length, studentsData.length); i++) {
      const user = studentUsers[i];
      const data = studentsData[i];

      // Get IDs from maps
      const departmentId = deptMap.get(data.departmentName);
      const sectionId = sectionMap.get(data.sectionName);
      const programId = programMap.get(data.programName);

      if (!departmentId || !sectionId || !programId) {
        console.log(`Skipping ${user.name_en}: missing department, section or program`);
        continue;
      }

      // Check if student info already exists
      const existingInfo = await repo.findOne({ 
        where: { user_id: user.id } 
      });

      if (!existingInfo) {
        // Create student info with IDs
        const studentInfo = repo.create({
          user_id: user.id,
          student_id: data.student_id,
          grade: data.grade,
          student_year: data.student_year,
          academic_year: data.academic_year,
          department_id: departmentId,  // Save the ID
          section_id: sectionId,        // Save the ID
          program_id: programId,        // Save the ID
          is_active: true,
          createdAt: new Date(),
        });

        await repo.save(studentInfo);
        console.log(`✅ Created student info for ${user.name_en} (${data.student_id})`);
      } else {
        console.log(`⚠️  Student info already exists for ${user.name_en}`);
      }
    }

    console.log('✅ StudentInfoSeeder completed.');
  }
}