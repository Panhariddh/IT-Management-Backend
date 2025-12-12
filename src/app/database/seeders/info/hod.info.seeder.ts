import { AppDataSource } from "src/app/config/data-source";
import { HodInfoModel } from "../../models/info/hod.info.model";
import { UserModel } from "../../models/user.model";
import { DepartmentModel } from "../../models/division/department.model";
import { Role } from "src/app/common/enum/role.enum";


export class HodInfoSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(HodInfoModel);
    const userRepo = AppDataSource.getRepository(UserModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const hodUser = await userRepo.findOne({ where: { role: Role.HEAD_OF_DEPARTMENT }
 });
    const department = await deptRepo.findOne({ where: { name: 'Computer Science' } });

    if (hodUser && department) {
      const existing = await repo.findOne({ where: { user_id: hodUser.id } });
      if (!existing) {
        await repo.save({
          user_id: hodUser.id,
          user: hodUser,
          department_id: department.id,
          department: department,
          appointed_date: new Date('2023-01-01'),
        });
      }
    }

    console.log('✅ HodInfoSeeder completed.');
  }
}
