import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class DepartmentSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(DepartmentModel);

    const departments = [
      { name: 'Computer Science', head_user_id: null },
      { name: 'Mathematics', head_user_id: null },
      { name: 'Physics', head_user_id: null },
    ];

    for (const dept of departments) {
      const existing = await repo.findOne({ where: { name: dept.name } });
      if (!existing) {
        await repo.save(dept);
      }
    }

    console.log('✅ DepartmentSeeder completed.');
  }
}
