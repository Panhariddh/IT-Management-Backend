import { AppDataSource } from "src/app/config/data-source";
import { TeacherInfoModel } from "../../models/info/teacher-info.model";
import { UserModel } from "../../models/user.model";
import { DepartmentModel } from "../../models/division/department.model";
import { Role } from "src/app/common/enum/role.enum";

export class TeacherInfoSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(TeacherInfoModel);
    const userRepo = AppDataSource.getRepository(UserModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    // Get all teacher users
    const teacherUsers = await userRepo.find({
      where: { role: Role.TEACHER },
      order: { id: 'ASC' },
    });

    // Get all departments
    const departments = await deptRepo.find();
    const deptMap = new Map(departments.map(d => [d.name, d.id]));

    // Teacher data with specific departments
    const teachersData = [
      {
        teacher_id: 't20250001',
        departmentName: 'Faculty of Medicine',
      },
      {
        teacher_id: 't20250002',
        departmentName: 'Faculty of Engineering',
      },
      {
        teacher_id: 't20250003',
        departmentName: 'Faculty of Business',
      },
      {
        teacher_id: 't20250004',
        departmentName: 'Faculty of Social Sciences',
      },
      {
        teacher_id: 't20250005',
        departmentName: 'Faculty of Science',
      },
    ];

    // Loop through teacher users and assign data
    for (let i = 0; i < Math.min(teacherUsers.length, teachersData.length); i++) {
      const user = teacherUsers[i];
      const data = teachersData[i];

      // Get department ID from the map
      const departmentId = deptMap.get(data.departmentName);

      if (!departmentId) {
        console.log(`⚠️ Skipping ${user.name_en}: Department '${data.departmentName}' not found`);
        continue;
      }

      // Check if teacher info already exists
      const existing = await repo.findOne({
        where: { user_id: user.id },
      });

      if (!existing) {
        const teacherInfo = repo.create({
          user_id: user.id,
          teacher_id: data.teacher_id,
          department_id: departmentId,
          is_active: true,
        });

        await repo.save(teacherInfo);
      }
    }

    console.log("✅ TeacherInfoSeeder completed.");
  }
}