import { AppDataSource } from "src/app/config/data-source";
import { UserModel } from "../../models/user.model";
import { DepartmentModel } from "../../models/division/department.model";
import { Role } from "src/app/common/enum/role.enum";
import { HodInfoModel } from "../../models/info/hod-info.model";

export class HodInfoSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(HodInfoModel);
    const userRepo = AppDataSource.getRepository(UserModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    // Get all HOD users
    const hodUsers = await userRepo.find({
      where: { role: Role.HEAD_OF_DEPARTMENT },
      order: { id: 'ASC' },
    });

    // Get all departments
    const departments = await deptRepo.find();
    const deptMap = new Map(departments.map(d => [d.name, d.id]));

    const hodsData = [
      {
        hod_id: 'h20250001',
        departmentName: 'Faculty of Science',
      },
      {
        hod_id: 'h20250002',
        departmentName: 'Faculty of Medicine',
      },
      {
        hod_id: 'h20250003',
        departmentName: 'Faculty of Engineering',
      },
      {
        hod_id: 'h20250004',
        departmentName: 'Faculty of Business',
      },
      {
        hod_id: 'h20250005',
        departmentName: 'Faculty of Social Sciences',
      },
    ];

    // Loop through HOD users and assign data
    for (let i = 0; i < Math.min(hodUsers.length, hodsData.length); i++) {
      const user = hodUsers[i];
      const data = hodsData[i];

      // Get department ID from the map
      const departmentId = deptMap.get(data.departmentName);

      if (!departmentId) {
        console.log(`⚠️ Skipping ${user.name_en}: Department '${data.departmentName}' not found`);
        continue;
      }

      // Check if HOD info already exists
      const existing = await repo.findOne({
        where: { user_id: user.id },
      });

      if (!existing) {
        const hodInfo = repo.create({
          user_id: user.id,
          hod_id: data.hod_id,
          department_id: departmentId,
          is_active: true,
        });

        await repo.save(hodInfo);
      } else {
        console.log(`ℹ️ HOD info already exists for ${user.name_en}`);
      }
    }

    console.log("✅ HodInfoSeeder completed.");
  }
}