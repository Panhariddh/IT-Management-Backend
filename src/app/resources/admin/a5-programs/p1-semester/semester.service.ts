import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm'; 

import { ProgramModel } from 'src/app/database/models/division/program.model';
import { AcademicYearModel } from 'src/app/database/models/academic.year.model';
import {
  CreateSemesterDto,
  UpdateSemesterDto,
  SemesterDto,
  SemesterDetailDto,
  SemesterMetaDto,
  SemesterDataSetupDto,
} from './semester.dto';
import { SemesterModel } from 'src/app/database/models/class/semester.model';
import { SubjectModel } from 'src/app/database/models/class/subject.model';


interface GetAllSemestersResult {
  semesters: SemesterDto[];
  dataSetup: SemesterDataSetupDto;
  meta: SemesterMetaDto;
}

interface CreateSemesterData extends CreateSemesterDto {
  program_id: number;
}

interface UpdateSemesterData extends UpdateSemesterDto {
  program_id?: number;
}

@Injectable()
export class SemesterService {
  constructor(
    @InjectRepository(SemesterModel)
    private semesterRepository: Repository<SemesterModel>,
    @InjectRepository(ProgramModel)
    private programRepository: Repository<ProgramModel>,
    @InjectRepository(AcademicYearModel)
    private academicYearRepository: Repository<AcademicYearModel>,
    @InjectRepository(SubjectModel)
    private subjectRepository: Repository<SubjectModel>,
  ) {}

async getAllSemestersByProgram(programId: number): Promise<GetAllSemestersResult> {
  const query = this.semesterRepository
    .createQueryBuilder('semester')
    .leftJoinAndSelect('semester.program', 'program')
    .leftJoinAndSelect('semester.academic_year', 'academic_year')
    .leftJoinAndSelect('semester.subjects', 'subjects') // Join subjects
    .where('semester.program_id = :programId', { programId }) 
    .andWhere('semester.is_active = :isActive', { isActive: true })
    .orderBy('semester.year_number', 'ASC')
    .addOrderBy('semester.semester_number', 'ASC');

  const semesters = await query.getMany();

  const semesterDtos: SemesterDto[] = semesters.map((semester) => ({
    id: semester.id.toString(),
    name: semester.name,
    semester_number: semester.semester_number,
    year_number: semester.year_number,
    start_date: semester.start_date,
    end_date: semester.end_date,
    is_active: semester.is_active,
    program_id: semester.program.id,
    program_name: semester.program.name,
    academic_year_id: semester.academic_year.id,
    academic_year_name: semester.academic_year.name,
    subjects_count: semester.subjects?.length || 0, // Add subject count
  }));

  const dataSetup = await this.getDataSetup(programId);

  const meta: SemesterMetaDto = {
    page: 1,
    limit: semesters.length,
    total: semesters.length,
  };

  return {
    semesters: semesterDtos,
    dataSetup,
    meta,
  };
}

  async getSemesterById(id: string): Promise<SemesterDetailDto> {
    const semester = await this.semesterRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['program', 'academic_year', 'subjects'],
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    return {
      id: semester.id.toString(),
      name: semester.name,
      semester_number: semester.semester_number,
      year_number: semester.year_number,
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active,
      program_id: semester.program.id,
      program_name: semester.program.name,
      academic_year_id: semester.academic_year.id,
      academic_year_name: semester.academic_year.name,
      subjects: semester.subjects?.map((subject) => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
      })) || [],
    };
  }

  async getSemestersByProgramId(programId: number): Promise<SemesterDto[]> {
    const semesters = await this.semesterRepository.find({
      where: {
        program: { id: programId },
        is_active: true,
      },
      relations: ['program', 'academic_year'],
      order: { year_number: 'ASC', semester_number: 'ASC' },
    });

    return semesters.map((semester) => ({
      id: semester.id.toString(),
      name: semester.name,
      semester_number: semester.semester_number,
      year_number: semester.year_number,
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active,
      program_id: semester.program.id,
      program_name: semester.program.name,
      academic_year_id: semester.academic_year.id,
      academic_year_name: semester.academic_year.name,
    }));
  }

  async createSemester(
    createSemesterData: CreateSemesterData,
  ): Promise<SemesterDetailDto> {
    // Validate program exists
    const program = await this.programRepository.findOne({
      where: { id: createSemesterData.program_id, is_active: true },
    });

    if (!program) {
      throw new BadRequestException(
        `Program with ID ${createSemesterData.program_id} not found or inactive`,
      );
    }

    // Validate academic year exists
    const academicYear = await this.academicYearRepository.findOne({
      where: { id: createSemesterData.academic_year_id },
    });

    if (!academicYear) {
      throw new BadRequestException(
        `Academic year with ID ${createSemesterData.academic_year_id} not found`,
      );
    }

    // Validate and fetch subjects if provided
    let subjects: SubjectModel[] = [];
    if (createSemesterData.subject_ids && createSemesterData.subject_ids.length > 0) {
      // Fetch subjects and validate they belong to the same program
      subjects = await this.subjectRepository.find({
        where: { 
          id: In(createSemesterData.subject_ids),
          program: { id: createSemesterData.program_id }, // Ensure subjects belong to same program
          is_active: true,
        },
      });

      if (subjects.length !== createSemesterData.subject_ids.length) {
        const foundIds = subjects.map(s => s.id);
        const missingIds = createSemesterData.subject_ids.filter(id => !foundIds.includes(id));
        throw new BadRequestException(
          `Some subjects not found, don't belong to this program, or are inactive. Missing IDs: ${missingIds.join(', ')}`,
        );
      }
    }

    await this.checkForDateOverlaps(createSemesterData);

    // Create semester
    const semesterData: Partial<SemesterModel> = {
      name: createSemesterData.name,
      semester_number: createSemesterData.semester_number,
      year_number: createSemesterData.year_number,
      start_date: new Date(createSemesterData.start_date),
      end_date: new Date(createSemesterData.end_date),
      is_active:
        createSemesterData.is_active !== undefined
          ? createSemesterData.is_active
          : true,
      program: program,
      academic_year: academicYear,
      subjects: subjects, // Assign subjects
    };

    const semester = this.semesterRepository.create(semesterData);
    const savedSemester = await this.semesterRepository.save(semester);

    return this.getSemesterById(savedSemester.id.toString());
  }


  async updateSemester(
    id: string,
    updateSemesterData: UpdateSemesterData,
  ): Promise<SemesterDetailDto> {
    const semester = await this.semesterRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['program', 'academic_year', 'subjects'], // Add 'subjects' to relations
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    // Get the program ID - either from update data or existing semester
    const programId = updateSemesterData.program_id || semester.program.id;

    // Validate program if changing
    if (
      updateSemesterData.program_id &&
      updateSemesterData.program_id !== semester.program.id
    ) {
      const program = await this.programRepository.findOne({
        where: { id: updateSemesterData.program_id, is_active: true },
      });

      if (!program) {
        throw new BadRequestException(
          `Program with ID ${updateSemesterData.program_id} not found or inactive`,
        );
      }
      semester.program = program;
    }

    // Validate academic year if changing
    if (updateSemesterData.academic_year_id) {
      const academicYear = await this.academicYearRepository.findOne({
        where: { id: updateSemesterData.academic_year_id },
      });

      if (!academicYear) {
        throw new BadRequestException(
          `Academic year with ID ${updateSemesterData.academic_year_id} not found`,
        );
      }
      semester.academic_year = academicYear;
    }

    // Validate and update subjects if provided
    if (updateSemesterData.subject_ids !== undefined) {
      if (updateSemesterData.subject_ids.length === 0) {
        // Clear subjects if empty array is provided
        semester.subjects = [];
      } else {
        // Fetch and validate subjects
        const subjects = await this.subjectRepository.find({
          where: { 
            id: In(updateSemesterData.subject_ids),
            program: { id: programId }, // Ensure subjects belong to same program
            is_active: true,
          },
        });

        if (subjects.length !== updateSemesterData.subject_ids.length) {
          const foundIds = subjects.map(s => s.id);
          const missingIds = updateSemesterData.subject_ids.filter(id => !foundIds.includes(id));
          throw new BadRequestException(
            `Some subjects not found, don't belong to this program, or are inactive. Missing IDs: ${missingIds.join(', ')}`,
          );
        }

        semester.subjects = subjects;
      }
    }

    // Check for date overlaps (pass programId if available)
    const checkData: UpdateSemesterData & { program_id?: number } = {
      ...updateSemesterData,
      program_id: programId,
    };
    
    if (updateSemesterData.start_date || updateSemesterData.end_date) {
      await this.checkForDateOverlaps(checkData, id);
    }

    // Update other fields
    if (updateSemesterData.name !== undefined) {
      semester.name = updateSemesterData.name;
    }
    if (updateSemesterData.semester_number !== undefined) {
      semester.semester_number = updateSemesterData.semester_number;
    }
    if (updateSemesterData.year_number !== undefined) {
      semester.year_number = updateSemesterData.year_number;
    }
    if (updateSemesterData.start_date !== undefined) {
      semester.start_date = new Date(updateSemesterData.start_date);
    }
    if (updateSemesterData.end_date !== undefined) {
      semester.end_date = new Date(updateSemesterData.end_date);
    }
    if (updateSemesterData.is_active !== undefined) {
      semester.is_active = updateSemesterData.is_active;
    }

    semester.updated_at = new Date();
    await this.semesterRepository.save(semester);

    // Fetch complete updated semester with subjects
    const completeSemester = await this.semesterRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['program', 'academic_year', 'subjects'],
    });

    if (!completeSemester) {
      throw new Error('Failed to fetch updated semester data');
    }

    return {
      id: completeSemester.id.toString(),
      name: completeSemester.name,
      semester_number: completeSemester.semester_number,
      year_number: completeSemester.year_number,
      start_date: completeSemester.start_date,
      end_date: completeSemester.end_date,
      is_active: completeSemester.is_active,
      program_id: completeSemester.program.id,
      program_name: completeSemester.program.name,
      academic_year_id: completeSemester.academic_year.id,
      academic_year_name: completeSemester.academic_year.name,
      subjects: completeSemester.subjects?.map((subject) => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
      })) || [],
    };
  }

  async deleteSemester(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const semester = await this.semesterRepository.findOne({
      where: { id: parseInt(id) },
      relations: ['program', 'subjects'], // Add subjects
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    // Clear subjects before soft delete to avoid foreign key constraints
    // This is important for ManyToMany relationships
    semester.subjects = [];
    await this.semesterRepository.save(semester);

    // Soft delete the semester
    semester.is_active = false;
    await this.semesterRepository.save(semester);

    return {
      success: true,
      message: `Semester "${semester.name}" has been deleted successfully`,
    };
  }

  private async checkForDateOverlaps(
    semesterData: CreateSemesterData | UpdateSemesterData,
    excludeId?: string,
  ): Promise<void> {
    const startDate = semesterData.start_date
      ? new Date(semesterData.start_date)
      : undefined;
    const endDate = semesterData.end_date
      ? new Date(semesterData.end_date)
      : undefined;

    if (!startDate || !endDate) return;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const query = this.semesterRepository
      .createQueryBuilder('semester')
      .leftJoinAndSelect('semester.program', 'program')
      .where('semester.is_active = :isActive', { isActive: true });

    if (excludeId) {
      query.andWhere('semester.id != :excludeId', {
        excludeId: parseInt(excludeId),
      });
    }

    query.andWhere(
      `(
        (semester.start_date <= :startDate AND semester.end_date >= :startDate) OR
        (semester.start_date <= :endDate AND semester.end_date >= :endDate) OR
        (semester.start_date >= :startDate AND semester.end_date <= :endDate)
      )`,
      { startDate, endDate },
    );

    const programId = semesterData.program_id;
    if (programId) {
      query.andWhere('semester.program_id = :programId', {
        programId: programId,
      });
    }

    const overlappingSemesters = await query.getMany();

    if (overlappingSemesters.length > 0) {
      const programName =
        overlappingSemesters[0].program?.name || 'the program';
      throw new BadRequestException(
        `Date range overlaps with existing semester(s) in ${programName}`,
      );
    }
  }

  private applySorting(
    query: any,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
  ): void {
    switch (sortBy) {
      case 'name':
        query.orderBy('semester.name', sortOrder);
        break;
      case 'semester_number':
        query.orderBy('semester.semester_number', sortOrder);
        break;
      case 'year_number':
        query.orderBy('semester.year_number', sortOrder);
        break;
      case 'start_date':
        query.orderBy('semester.start_date', sortOrder);
        break;
      case 'end_date':
        query.orderBy('semester.end_date', sortOrder);
        break;
      case 'program_name':
        query.orderBy('program.name', sortOrder);
        break;
      case 'academic_year_name':
        query.orderBy('academic_year.name', sortOrder);
        break;
      default:
        query
          .orderBy('semester.year_number', sortOrder)
          .addOrderBy('semester.semester_number', sortOrder);
        break;
    }
  }

  private async getDataSetup(programId?: number): Promise<SemesterDataSetupDto> {
    const programs = await this.programRepository
      .createQueryBuilder('program')
      .select(['program.id', 'program.name'])
      .where('program.is_active = :isActive', { isActive: true })
      .orderBy('program.name', 'ASC')
      .getMany();

    // Get academic years
    const academicYears = await this.academicYearRepository
      .createQueryBuilder('academic_year')
      .select([
        'academic_year.id',
        'academic_year.name',
        'academic_year.isActive',
      ])
      .orderBy('academic_year.name', 'DESC')
      .getMany();

    // Get subjects for the program if programId is provided
    let subjects: Array<{ id: number; code: string; name: string; credits: number }> = [];
    if (programId) {
      subjects = await this.subjectRepository
        .createQueryBuilder('subject')
        .select(['subject.id', 'subject.code', 'subject.name', 'subject.credits'])
        .where('subject.program_id = :programId', { programId })
        .andWhere('subject.is_active = :isActive', { isActive: true })
        .orderBy('subject.name', 'ASC')
        .getMany();
    }

    return {
      programs,
      academic_years: academicYears.map((year) => {
        const years = year.name.split('-');
        return {
          id: year.id,
          name: year.name,
          start_year: years.length >= 1 ? parseInt(years[0]) : undefined,
          end_year: years.length >= 2 ? parseInt(years[1]) : undefined,
        };
      }),
      subjects: subjects.map(subject => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.credits,
      })),
    };
  }

  // Helper method to get subjects for a program
  async getSubjectsByProgram(programId: number) {
    return await this.subjectRepository.find({
      where: {
        program: { id: programId },
        is_active: true,
      },
      select: ['id', 'code', 'name', 'credits'],
      order: { name: 'ASC' },
    });
  }

}