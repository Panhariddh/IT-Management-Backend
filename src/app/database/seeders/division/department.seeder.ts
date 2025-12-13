import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class DepartmentSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(DepartmentModel);

    const departments = [
  { name: 'Faculty of Medicine' },
  { name: 'Faculty of Engineering' },
  { name: 'Faculty of Business' },
  { name: 'Faculty of Social Sciences' },
  { name: 'Faculty of Science' },
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
