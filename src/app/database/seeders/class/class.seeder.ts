import { AppDataSource } from '../../../config/data-source';
import { ClassModel } from '../../models/class/class.model';
import { SubjectModel } from '../../models/class/subject.model';
import { SemesterModel } from '../../models/class/semester.model';

export class ClassSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(ClassModel);
    const subjectRepo = AppDataSource.getRepository(SubjectModel);
    const semesterRepo = AppDataSource.getRepository(SemesterModel);

    // Load with proper relations
    const subjects = await subjectRepo.find({ 
      relations: ['program'],
      where: { is_active: true }
    });
    
    const semesters = await semesterRepo.find({ 
      relations: ['program'],
      where: { is_active: true }
    });

    const classes: Array<Partial<ClassModel>> = [];

    for (const subject of subjects) {
      // Extract year from subject code (e.g., "MED101" -> 1, "CS201" -> 2)
      // Look for pattern: letters followed by 3 digits, first digit is year
      const yearMatch = subject.code.match(/[A-Z]+(\d)(\d{2})/);
      let yearNum = 1; // Default to year 1
      
      if (yearMatch) {
        yearNum = parseInt(yearMatch[1]);
      } else {
        // Fallback: check if it contains 1xx, 2xx, 3xx
        const fallbackMatch = subject.code.match(/(1\d{2}|2\d{2}|3\d{2})/);
        if (fallbackMatch) {
          yearNum = parseInt(fallbackMatch[1][0]);
        }
      }
      
      if (!subject.program) {
        continue;
      }

      // Find semesters for this subject's program and year
      const relevantSemesters = semesters.filter(s => {
        if (!s.program) return false;
        const hasSameProgram = s.program.id === subject.program.id;
        const hasSameYear = s.year_number === yearNum;
        return hasSameProgram && hasSameYear;
      });

      for (const semester of relevantSemesters) {
        // Create sections A and B for each semester
        classes.push({
          section_name: `${subject.code}-A-${semester.semester_number}`,
          subject_id: subject.id,
          semester_id: semester.id,
          is_active: true,
        });

        classes.push({
          section_name: `${subject.code}-B-${semester.semester_number}`,
          subject_id: subject.id,
          semester_id: semester.id,
          is_active: true,
        });
      }
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const classData of classes) {
      const existing = await repo.findOne({
        where: {
          section_name: classData.section_name,
          subject_id: classData.subject_id,
          semester_id: classData.semester_id,
        },
      });

      if (!existing) {
        await repo.save(repo.create(classData as ClassModel));
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ ClassSeeder completed. Created`);
  }
}