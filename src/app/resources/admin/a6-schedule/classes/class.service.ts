import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClassModel } from 'src/app/database/models/class/class.model';
import { SemesterModel } from 'src/app/database/models/class/semester.model';
import { SubjectModel } from 'src/app/database/models/class/subject.model';
import { Repository } from 'typeorm';
import { CreateClassDto, UpdateClassDto } from './class.dto';

@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(ClassModel)
    private classRepository: Repository<ClassModel>,
    @InjectRepository(SubjectModel)
    private subjectRepository: Repository<SubjectModel>,
    @InjectRepository(SemesterModel)
    private semesterRepository: Repository<SemesterModel>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<ClassModel> {
    // Check if subject exists and is active
    const subject = await this.subjectRepository.findOne({
      where: { id: createClassDto.subject_id, is_active: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found or inactive');
    }

    // Check if semester exists and is active
    const semester = await this.semesterRepository.findOne({
      where: { id: createClassDto.semester_id, is_active: true },
    });
    if (!semester) {
      throw new NotFoundException('Semester not found or inactive');
    }

    // Check if subject is available in the semester (through Many-to-Many relationship)
    const subjectInSemester = await this.checkSubjectInSemester(
      createClassDto.subject_id,
      createClassDto.semester_id,
    );
    if (!subjectInSemester) {
      throw new BadRequestException(
        'This subject is not available in the selected semester',
      );
    }

    // Check if class with same section, subject, and semester already exists
    const existingClass = await this.classRepository.findOne({
      where: {
        section_name: createClassDto.section_name,
        subject_id: createClassDto.subject_id,
        semester_id: createClassDto.semester_id,
      },
    });
    if (existingClass) {
      throw new ConflictException(
        'A class with this section name, subject, and semester already exists',
      );
    }

    const classEntity = this.classRepository.create({
      ...createClassDto,
      subject,
      semester,
    });

    return await this.classRepository.save(classEntity);
  }

  async findAll(): Promise<ClassModel[]> {
    return await this.classRepository.find({
      where: { is_active: true },
      relations: ['subject', 'semester'],
      order: { section_name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ClassModel> {
    const classEntity = await this.classRepository.findOne({
      where: { id, is_active: true },
      relations: ['subject', 'semester'],
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    return classEntity;
  }

  async update(
    id: number,
    updateClassDto: UpdateClassDto,
  ): Promise<ClassModel> {
    const classEntity = await this.findOne(id);

    // If subject is being changed
    if (
      updateClassDto.subject_id &&
      updateClassDto.subject_id !== classEntity.subject_id
    ) {
      const subject = await this.subjectRepository.findOne({
        where: { id: updateClassDto.subject_id, is_active: true },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found or inactive');
      }

      // If semester is also being changed, check subject in new semester
      if (updateClassDto.semester_id) {
        const subjectInSemester = await this.checkSubjectInSemester(
          updateClassDto.subject_id,
          updateClassDto.semester_id,
        );
        if (!subjectInSemester) {
          throw new BadRequestException(
            'This subject is not available in the selected semester',
          );
        }
      } else {
        // Check subject in current semester
        const subjectInSemester = await this.checkSubjectInSemester(
          updateClassDto.subject_id,
          classEntity.semester_id,
        );
        if (!subjectInSemester) {
          throw new BadRequestException(
            'This subject is not available in the current semester',
          );
        }
      }

      classEntity.subject = subject;
      classEntity.subject_id = updateClassDto.subject_id;
    }

    // If semester is being changed
    if (
      updateClassDto.semester_id &&
      updateClassDto.semester_id !== classEntity.semester_id
    ) {
      const semester = await this.semesterRepository.findOne({
        where: { id: updateClassDto.semester_id, is_active: true },
      });
      if (!semester) {
        throw new NotFoundException('Semester not found or inactive');
      }

      // Check if current subject is available in new semester
      const subjectId = updateClassDto.subject_id || classEntity.subject_id;
      const subjectInSemester = await this.checkSubjectInSemester(
        subjectId,
        updateClassDto.semester_id,
      );
      if (!subjectInSemester) {
        throw new BadRequestException(
          'The subject is not available in the selected semester',
        );
      }

      classEntity.semester = semester;
      classEntity.semester_id = updateClassDto.semester_id;
    }

    // Update other fields
    if (updateClassDto.section_name !== undefined) {
      // Check for duplicate section name with same subject and semester
      if (updateClassDto.section_name !== classEntity.section_name) {
        const subjectId = updateClassDto.subject_id || classEntity.subject_id;
        const semesterId =
          updateClassDto.semester_id || classEntity.semester_id;

        const existingClass = await this.classRepository.findOne({
          where: {
            section_name: updateClassDto.section_name,
            subject_id: subjectId,
            semester_id: semesterId,
            id: id, // Exclude current class
          },
        });
        if (existingClass) {
          throw new ConflictException(
            'A class with this section name, subject, and semester already exists',
          );
        }
      }
      classEntity.section_name = updateClassDto.section_name;
    }

    if (updateClassDto.is_active !== undefined) {
      classEntity.is_active = updateClassDto.is_active;
    }

    return await this.classRepository.save(classEntity);
  }

  async remove(id: number): Promise<void> {
    const classEntity = await this.findOne(id);
    classEntity.is_active = false;
    await this.classRepository.save(classEntity);
  }

  async getClassesBySubject(subjectId: number): Promise<ClassModel[]> {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, is_active: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found or inactive');
    }

    return await this.classRepository.find({
      where: { subject_id: subjectId, is_active: true },
      relations: ['semester'],
      order: { section_name: 'ASC' },
    });
  }

  async getClassesBySemester(semesterId: number): Promise<ClassModel[]> {
    const semester = await this.semesterRepository.findOne({
      where: { id: semesterId, is_active: true },
    });
    if (!semester) {
      throw new NotFoundException('Semester not found or inactive');
    }

    return await this.classRepository.find({
      where: { semester_id: semesterId, is_active: true },
      relations: ['subject'],
      order: { section_name: 'ASC' },
    });
  }

  async getClassesBySubjectAndSemester(
    subjectId: number,
    semesterId: number,
  ): Promise<ClassModel[]> {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, is_active: true },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found or inactive');
    }

    const semester = await this.semesterRepository.findOne({
      where: { id: semesterId, is_active: true },
    });
    if (!semester) {
      throw new NotFoundException('Semester not found or inactive');
    }

    return await this.classRepository.find({
      where: {
        subject_id: subjectId,
        semester_id: semesterId,
        is_active: true,
      },
      order: { section_name: 'ASC' },
    });
  }

  private async checkSubjectInSemester(
    subjectId: number,
    semesterId: number,
  ): Promise<boolean> {
    // Since it's a Many-to-Many relationship, we need to check the join table
    const subjectWithSemesters = await this.subjectRepository.findOne({
      where: { id: subjectId, is_active: true },
      relations: ['semesters'],
    });

    if (!subjectWithSemesters || !subjectWithSemesters.semesters) {
      return false;
    }

    return subjectWithSemesters.semesters.some(
      (semester) => semester.id === semesterId && semester.is_active,
    );
  }

  // Admin-only methods
  async findAllIncludingInactive(): Promise<ClassModel[]> {
    return await this.classRepository.find({
      relations: ['subject', 'semester'],
      order: { section_name: 'ASC' },
    });
  }

  async restore(id: number): Promise<ClassModel> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    classEntity.is_active = true;
    return await this.classRepository.save(classEntity);
  }

  async hardDelete(id: number): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
    });

    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    await this.classRepository.remove(classEntity);
  }
}
