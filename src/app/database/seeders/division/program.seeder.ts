import { ProgramModel } from '../../models/division/program.model';
import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class ProgramSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(ProgramModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

  const programs = [
  { name: 'General Medicine', departmentName: 'Faculty of Medicine' },
  { name: 'Software Engineering', departmentName: 'Faculty of Engineering' },
  { name: 'Finance and Banking', departmentName: 'Faculty of Business' },
  { name: 'International Relations', departmentName: 'Faculty of Social Sciences' },
  { name: 'Computer Science', departmentName: 'Faculty of Science' },
];
    for (const prog of programs) {
      const dept = departments.find(d => d.name === prog.departmentName);
      if (!dept) continue;

      const existing = await repo.findOne({ where: { name: prog.name } });
      if (!existing) {
        await repo.save({
          name: prog.name,
          department_id: dept.id,
          department: dept,
        });
      }
    }

    console.log('✅ ProgramSeeder completed.');
  }
}
