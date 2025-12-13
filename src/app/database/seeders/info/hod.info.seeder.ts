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

    const hodData = [
      { 
        email: 'hod@example.com', 
        department: 'Faculty of Science',  
        appointed_date: new Date('2023-01-01') 
      },
    ];

    for (const data of hodData) {
      const user = await userRepo.findOne({ 
        where: { email: data.email, role: Role.HEAD_OF_DEPARTMENT } 
      });

      const department = await deptRepo.findOne({ where: { name: data.department } });

      if (!user || !department) {
        console.log(`Skipping HOD for ${data.email}: missing user or department`);
        continue;
      }

      const existing = await repo.findOne({ where: { user_id: user.id } });
      if (!existing) {
        await repo.save({
          user_id: user.id,
          user,
          department_id: department.id,
          department,
          appointed_date: data.appointed_date,
        });
      } else {
        console.log(`⚠️  HOD info already exists for ${user.name_en}`);
      }
    }

    console.log('✅ HodInfoSeeder completed.');
  }
}