import { SectionModel } from '../../models/division/section.model';
import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class SectionSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(SectionModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

    const sections = [
  { name: 'General Medicine', departmentName: 'Faculty of Medicine' },
  { name: 'Software Engineering', departmentName: 'Faculty of Engineering' },
  { name: 'Finance and Banking', departmentName: 'Faculty of Business' },
  { name: 'International Relations', departmentName: 'Faculty of Social Sciences' },
  { name: 'Computer Science', departmentName: 'Faculty of Science' },
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
