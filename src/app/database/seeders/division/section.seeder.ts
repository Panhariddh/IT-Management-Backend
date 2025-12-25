import { SectionModel } from '../../models/division/section.model';
import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class SectionSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(SectionModel);
    const deptRepo = AppDataSource.getRepository(DepartmentModel);

    const departments = await deptRepo.find();

    const sections = [
      {
        name: 'General Medicine',
        description: 'Provides education and training in general medical practice and patient care.',
        departmentName: 'Faculty of Medicine',
      },
      {
        name: 'Software Engineering',
        description: 'Focuses on software design, development, testing, and maintenance.',
        departmentName: 'Faculty of Engineering',
      },
      {
        name: 'Finance and Banking',
        description: 'Covers financial management, banking systems, and investment practices.',
        departmentName: 'Faculty of Business',
      },
      {
        name: 'International Relations',
        description: 'Studies global politics, diplomacy, and international cooperation.',
        departmentName: 'Faculty of Social Sciences',
      },
      {
        name: 'Computer Science',
        description: 'Concentrates on computing theory, programming, and system development.',
        departmentName: 'Faculty of Science',
      },
    ];

    for (const sec of sections) {
      const dept = departments.find(d => d.name === sec.departmentName);
      if (!dept) continue;

      const existing = await repo.findOne({
        where: {
          name: sec.name,
          department_id: dept.id,
        },
      });

      if (!existing) {
        await repo.save(
          repo.create({
            name: sec.name,
            description: sec.description,
            department_id: dept.id,
            department: dept,
          })
        );
      }
    }

    console.log('✅ SectionSeeder completed.');
  }
}
