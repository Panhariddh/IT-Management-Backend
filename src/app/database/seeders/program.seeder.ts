import { ProgramModel } from '../models/program.model';
import { DepartmentModel } from '../models/department.model';
import { AppDataSource } from '../../config/data-source';

export class ProgramSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(ProgramModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

    const programs = [
      { name: 'Software Engineering', departmentName: 'Computer Science' },
      { name: 'Data Science', departmentName: 'Computer Science' },
      { name: 'Applied Mathematics', departmentName: 'Mathematics' },
      { name: 'Theoretical Physics', departmentName: 'Physics' },
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
