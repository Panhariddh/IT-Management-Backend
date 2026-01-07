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
        {
          code: 'MED101',
          name: 'Human Anatomy',
          total_hours: 36,
          credits: 4,
          year: 1,
        },
        {
          code: 'MED102',
          name: 'Medical Biochemistry',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        // Year 2 subjects
        {
          code: 'MED201',
          name: 'Pathology',
          total_hours: 48,
          credits: 4,
          year: 2,
        },
        {
          code: 'MED202',
          name: 'Pharmacology',
          total_hours: 48,
          credits: 3,
          year: 2,
        },
        // Year 3 subjects
        {
          code: 'MED301',
          name: 'Internal Medicine',
          total_hours: 48,
          credits: 5,
          year: 3,
        },
        {
          code: 'MED302',
          name: 'Surgery',
          total_hours: 48,
          credits: 5,
          year: 3,
        },
      ],
      'Software Engineering': [
        // Year 1
        {
          code: 'SE101',
          name: 'Programming Fundamentals',
          total_hours: 48,
          credits: 3,
          year: 1,
        },
        {
          code: 'SE102',
          name: 'Data Structures',
          total_hours: 48,
          credits: 3,
          year: 1,
        },
        // Year 2
        {
          code: 'SE201',
          name: 'Database Systems',
          total_hours: 16,
          credits: 3,
          year: 2,
        },
        {
          code: 'SE202',
          name: 'Software Engineering',
          total_hours: 16,
          credits: 3,
          year: 2,
        },
        // Year 3
        {
          code: 'SE301',
          name: 'Web Development',
          total_hours: 16,
          credits: 3,
          year: 3,
        },
        {
          code: 'SE302',
          name: 'Mobile App Development',
          total_hours: 16,
          credits: 3,
          year: 3,
        },
      ],
      'Finance and Banking': [
        // Year 1
        {
          code: 'FB101',
          name: 'Principles of Finance',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        {
          code: 'FB102',
          name: 'Accounting Fundamentals',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        // Year 2
        {
          code: 'FB201',
          name: 'Investment Analysis',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
        {
          code: 'FB202',
          name: 'Banking Operations',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
      ],
      'Computer Science': [
        // Year 1
        {
          code: 'CS101',
          name: 'Introduction to Programming',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        {
          code: 'CS102',
          name: 'Discrete Mathematics',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        // Year 2
        {
          code: 'CS201',
          name: 'Algorithms',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
        {
          code: 'CS202',
          name: 'Computer Networks',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
        // Year 3
        {
          code: 'CS301',
          name: 'Artificial Intelligence',
          total_hours: 36,
          credits: 3,
          year: 3,
        },
        {
          code: 'CS302',
          name: 'Machine Learning',
          total_hours: 36,
          credits: 3,
          year: 3,
        },
      ],
      'Advanced Computer Science': [
        // Master's level (Year 1 of master's)
        {
          code: 'ACS501',
          name: 'Advanced Algorithms',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        {
          code: 'ACS502',
          name: 'Data Mining',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        // Year 2 of master's
        {
          code: 'ACS601',
          name: 'Research Methodology',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
      ],
      // Add for other programs
      'International Relations': [
        {
          code: 'IR101',
          name: 'Introduction to IR',
          total_hours: 36,
          credits: 3,
          year: 1,
        },
        {
          code: 'IR201',
          name: 'Diplomacy',
          total_hours: 36,
          credits: 3,
          year: 2,
        },
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
          await repo.save(
            repo.create({
              code: subjectData.code,
              name: subjectData.name,
              total_hours: subjectData.total_hours,
              credits: subjectData.credits,
              program: program,
              is_active: true,
            }),
          );
        }
      }
    }

    console.log('✅ SubjectSeeder completed.');
  }
}
