import { AppDataSource } from '../../../config/data-source';
import { AcademicYearModel } from '../../models/academic.year.model';
import { SemesterModel } from '../../models/class/semester.model';
import { ProgramModel } from '../../models/division/program.model';


export class SemesterSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(SemesterModel);
    const programRepo = AppDataSource.getRepository(ProgramModel);
    const yearRepo = AppDataSource.getRepository(AcademicYearModel);

    const activeYear = await yearRepo.findOne({ where: { isActive: true } });
    const programs = await programRepo.find();

    if (!activeYear) {
      console.log('❌ No active academic year found. Run AcademicYearSeeder first.');
      return;
    }

    const semesters: Array<Partial<SemesterModel>> = [];
    const baseYear = 2024; 

    for (const program of programs) {
      for (let yearNum = 1; yearNum <= program.duration; yearNum++) {
        const yearOffset = yearNum - 1; 
        
        // Semester 1: August - December
        semesters.push({
          name: `Year ${yearNum} - Semester 1`,
          semester_number: 1,
          year_number: yearNum,
          start_date: new Date(baseYear + yearOffset, 7, 26), // August 26
          end_date: new Date(baseYear + yearOffset, 11, 15), // December 15
          program: program,
          academic_year: activeYear,
          is_active: true,
        });

        // Semester 2: January - May
        semesters.push({
          name: `Year ${yearNum} - Semester 2`,
          semester_number: 2,
          year_number: yearNum,
          start_date: new Date(baseYear + yearOffset + 1, 0, 10), // January 10
          end_date: new Date(baseYear + yearOffset + 1, 4, 20), // May 20
          program: program,
          academic_year: activeYear,
          is_active: true,
        });

        // Summer semester (optional)
        if (program.name.includes('Engineering') || program.name.includes('Science')) {
          semesters.push({
            name: `Year ${yearNum} - Summer Semester`,
            semester_number: 3,
            year_number: yearNum,
            start_date: new Date(baseYear + yearOffset + 1, 5, 1), // June 1
            end_date: new Date(baseYear + yearOffset + 1, 6, 30), // July 30
            program: program,
            academic_year: activeYear,
            is_active: false,
          });
        }
      }
    }

    for (const semesterData of semesters) {
      const existing = await repo.findOne({
        where: {
          name: semesterData.name,
          program: { id: semesterData.program?.id },
        },
      });
      
      if (!existing && semesterData.program) {
        await repo.save(repo.create(semesterData as SemesterModel));
      }
    }

    console.log('✅ SemesterSeeder completed.');
  }
}