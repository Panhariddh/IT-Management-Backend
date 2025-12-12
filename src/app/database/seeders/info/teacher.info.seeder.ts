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

    const teacherUser = await userRepo.findOne({
      where: { role: Role.TEACHER },
    });

    const department = await deptRepo.findOne({
      where: { name: "Computer Science" },
    });

    if (teacherUser) {
      const existing = await repo.findOne({
        where: { user_id: teacherUser.id },
      });

      if (!existing) {
        await repo.save({
          user_id: teacherUser.id,
          employee_number: "EMP-001",
          department_id: department ? department.id : null,
          department: department ?? undefined,

          position: "Lecturer",
          user: teacherUser,
        });
      }
    }

    console.log("✅ TeacherInfoSeeder completed.");
  }
}
