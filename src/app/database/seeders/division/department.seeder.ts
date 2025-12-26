import { DepartmentModel } from '../../models/division/department.model';

import { AppDataSource } from '../../../config/data-source';
import { UserModel } from '../../models/user.model';
import { Role } from 'src/app/common/enum/role.enum';


export class DepartmentSeeder {
  static async seed() {
    const deptRepo = AppDataSource.getRepository(DepartmentModel);
    const userRepo = AppDataSource.getRepository(UserModel);

    // First, fetch all HOD users (HEAD_OF_DEPARTMENT)
    const hodUsers = await userRepo.find({
      where: { role: Role.HEAD_OF_DEPARTMENT },
      order: { id: 'ASC' },
    });

    // Define departments along with a HOD index
    const departments = [
      {
        name: 'Faculty of Medicine',
        description: 'Responsible for medical education, clinical training, and healthcare research.',
        hodIndex: 0, // Index in hodUsers array
      },
      {
        name: 'Faculty of Engineering',
        description: 'Focuses on engineering education, technology development, and applied research.',
        hodIndex: 1,
      },
      {
        name: 'Faculty of Business',
        description: 'Provides education in management, finance, marketing, and entrepreneurship.',
        hodIndex: 2,
      },
      {
        name: 'Faculty of Social Sciences',
        description: 'Covers studies related to society, culture, human behavior, and public policy.',
        hodIndex: 3,
      },
      {
        name: 'Faculty of Science',
        description: 'Dedicated to scientific research and education in natural and applied sciences.',
        hodIndex: 4,
      },
    ];

    for (const dept of departments) {
      const existing = await deptRepo.findOne({ where: { name: dept.name } });
      if (!existing) {
        // Get the HOD user for this department
        const headUser = hodUsers[dept.hodIndex];

        const department = deptRepo.create({
          name: dept.name,
          description: dept.description,
          head: headUser, 
        });

        await deptRepo.save(department);
      }
    }

    console.log('✅ DepartmentSeeder completed.');
  }
}
