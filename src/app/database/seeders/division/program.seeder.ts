import { ProgramModel } from '../../models/division/program.model';
import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';
import { DegreeLevel } from 'src/app/common/enum/degree.enum';

export class ProgramSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(ProgramModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

    const programs = [
      {
        name: 'General Medicine',
        departmentName: 'Faculty of Medicine',
        degree_lvl: DegreeLevel.BACHELOR,
        duration: 6, // years
      },
      {
        name: 'Software Engineering',
        departmentName: 'Faculty of Engineering',
        degree_lvl: DegreeLevel.BACHELOR,
        duration: 4,
      },
      {
        name: 'Finance and Banking',
        departmentName: 'Faculty of Business',
        degree_lvl: DegreeLevel.BACHELOR,
        duration: 4,
      },
      {
        name: 'International Relations',
        departmentName: 'Faculty of Social Sciences',
        degree_lvl: DegreeLevel.BACHELOR,
        duration: 4,
      },
      {
        name: 'Computer Science',
        departmentName: 'Faculty of Science',
        degree_lvl: DegreeLevel.BACHELOR,
        duration: 4,
      },
      {
        name: 'Advanced Computer Science',
        departmentName: 'Faculty of Science',
        degree_lvl: DegreeLevel.MASTER,
        duration: 2,
      },
      {
        name: 'Research in Medicine',
        departmentName: 'Faculty of Medicine',
        degree_lvl: DegreeLevel.PHD,
        duration: 4,
      },
    ];

    for (const prog of programs) {
      const dept = departments.find((d) => d.name === prog.departmentName);
      if (!dept) continue;

      const existing = await repo.findOne({ where: { name: prog.name } });
      if (!existing) {
        await repo.save({
          name: prog.name,
          degree_lvl: prog.degree_lvl,
          duration: prog.duration,
          department_id: dept.id,
          department: dept,
        });
      }
    }

    console.log('✅ ProgramSeeder completed.');
  }
}
