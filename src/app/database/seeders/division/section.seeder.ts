import { SectionModel } from '../../models/division/section.model';
import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class SectionSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(SectionModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

    const sections = [
      { name: 'CS-A', departmentName: 'Computer Science' },
      { name: 'CS-B', departmentName: 'Computer Science' },
      { name: 'Math-A', departmentName: 'Mathematics' },
      { name: 'Physics-A', departmentName: 'Physics' },
    ];

    for (const sec of sections) {
      const dept = departments.find(d => d.name === sec.departmentName);
      if (!dept) continue;

      const existing = await repo.findOne({ where: { name: sec.name } });
      if (!existing) {
        await repo.save({
          name: sec.name,
          department_id: dept.id,
          department: dept,
        });
      }
    }

    console.log('✅ SectionSeeder completed.');
  }
}
