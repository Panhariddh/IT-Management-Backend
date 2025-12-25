import { DepartmentModel } from '../../models/division/department.model';
import { AppDataSource } from '../../../config/data-source';

export class DepartmentSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(DepartmentModel);

    const departments = [
      {
        name: 'Faculty of Medicine',
        description: 'Responsible for medical education, clinical training, and healthcare research.'
      },
      {
        name: 'Faculty of Engineering',
        description: 'Focuses on engineering education, technology development, and applied research.'
      },
      {
        name: 'Faculty of Business',
        description: 'Provides education in management, finance, marketing, and entrepreneurship.'
      },
      {
        name: 'Faculty of Social Sciences',
        description: 'Covers studies related to society, culture, human behavior, and public policy.'
      },
      {
        name: 'Faculty of Science',
        description: 'Dedicated to scientific research and education in natural and applied sciences.'
      },
    ];

    for (const dept of departments) {
      const existing = await repo.findOne({ where: { name: dept.name } });

      if (!existing) {
        await repo.save(repo.create(dept));
      }
    }

    console.log('✅ DepartmentSeeder completed.');
  }
}
