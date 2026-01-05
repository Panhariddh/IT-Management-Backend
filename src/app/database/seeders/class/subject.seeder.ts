import { AppDataSource } from '../../../config/data-source';
import { SubjectModel } from '../../models/class/subject.model';
import { ProgramModel } from '../../models/division/program.model';

export class SubjectSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(SubjectModel);
    const programRepo = AppDataSource.getRepository(ProgramModel);

    const programs = await programRepo.find();

    const programSubjects = {
      'General Medicine': [
        // Year 1 subjects
        { code: 'MED101', name: 'Human Anatomy', credits: 4, year: 1 },
        { code: 'MED102', name: 'Medical Biochemistry', credits: 3, year: 1 },
        // Year 2 subjects  
        { code: 'MED201', name: 'Pathology', credits: 4, year: 2 },
        { code: 'MED202', name: 'Pharmacology', credits: 3, year: 2 },
        // Year 3 subjects
        { code: 'MED301', name: 'Internal Medicine', credits: 5, year: 3 },
        { code: 'MED302', name: 'Surgery', credits: 5, year: 3 },
      ],
      'Software Engineering': [
        // Year 1
        { code: 'SE101', name: 'Programming Fundamentals', credits: 3, year: 1 },
        { code: 'SE102', name: 'Data Structures', credits: 3, year: 1 },
        // Year 2
        { code: 'SE201', name: 'Database Systems', credits: 3, year: 2 },
        { code: 'SE202', name: 'Software Engineering', credits: 3, year: 2 },
        // Year 3
        { code: 'SE301', name: 'Web Development', credits: 3, year: 3 },
        { code: 'SE302', name: 'Mobile App Development', credits: 3, year: 3 },
      ],
      'Finance and Banking': [
        // Year 1
        { code: 'FB101', name: 'Principles of Finance', credits: 3, year: 1 },
        { code: 'FB102', name: 'Accounting Fundamentals', credits: 3, year: 1 },
        // Year 2
        { code: 'FB201', name: 'Investment Analysis', credits: 3, year: 2 },
        { code: 'FB202', name: 'Banking Operations', credits: 3, year: 2 },
      ],
      'Computer Science': [
        // Year 1
        { code: 'CS101', name: 'Introduction to Programming', credits: 3, year: 1 },
        { code: 'CS102', name: 'Discrete Mathematics', credits: 3, year: 1 },
        // Year 2
        { code: 'CS201', name: 'Algorithms', credits: 3, year: 2 },
        { code: 'CS202', name: 'Computer Networks', credits: 3, year: 2 },
        // Year 3
        { code: 'CS301', name: 'Artificial Intelligence', credits: 3, year: 3 },
        { code: 'CS302', name: 'Machine Learning', credits: 3, year: 3 },
      ],
      'Advanced Computer Science': [
        // Master's level (Year 1 of master's)
        { code: 'ACS501', name: 'Advanced Algorithms', credits: 3, year: 1 },
        { code: 'ACS502', name: 'Data Mining', credits: 3, year: 1 },
        // Year 2 of master's
        { code: 'ACS601', name: 'Research Methodology', credits: 3, year: 2 },
      ],
      // Add for other programs
      'International Relations': [
        { code: 'IR101', name: 'Introduction to IR', credits: 3, year: 1 },
        { code: 'IR201', name: 'Diplomacy', credits: 3, year: 2 },
      ],
    };

    for (const program of programs) {
      const subjects = programSubjects[program.name] || [];
      
      for (const subjectData of subjects) {
        const existing = await repo.findOne({
          where: {
            code: subjectData.code,
            program: { id: program.id },
          },
        });

        if (!existing) {
          await repo.save(repo.create({
            code: subjectData.code,
            name: subjectData.name,
            credits: subjectData.credits,
            program: program,
            is_active: true,
          }));
        }
      }
    }

    console.log('✅ SubjectSeeder completed.');
  }
}