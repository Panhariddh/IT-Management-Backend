
import { AppDataSource } from '../../config/data-source';
import { AcademicYearModel } from '../models/academic.year.model';

export class AcademicYearSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(AcademicYearModel);

    const academicYears = [
      { name: '2021-2022', isActive: false },
      { name: '2022-2023', isActive: false },
      { name: '2023-2024', isActive: false },
      { name: '2024-2025', isActive: true }, 
    ];

    // Ensure only one active academic year
    await repo.update({ isActive: true }, { isActive: false });

    for (const year of academicYears) {
      const existing = await repo.findOne({
        where: { name: year.name },
      });

      if (!existing) {
        await repo.save(year);
      } else if (year.isActive && !existing.isActive) {
        // If it exists but should be active, update it
        await repo.update(existing.id, { isActive: true });
      }
    }

    console.log('✅ AcademicYearSeeder completed.');
  }
}
