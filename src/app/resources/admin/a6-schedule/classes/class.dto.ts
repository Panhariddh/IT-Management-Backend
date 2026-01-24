import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  section_name: string;

  @IsInt()
  subject_id: number;

  @IsInt()
  semester_id: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  section_name?: string;

  @IsOptional()
  @IsInt()
  subject_id?: number;

  @IsOptional()
  @IsInt()
  semester_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ClassResponseDto {
  id: number;
  section_name: string;
  subject_id: number;
  semester_id: number;
  is_active: boolean;
  subject?: any;
  semester?: any;

  constructor(classEntity: any) {
    this.id = classEntity.id;
    this.section_name = classEntity.section_name;
    this.subject_id = classEntity.subject_id;
    this.semester_id = classEntity.semester_id;
    this.is_active = classEntity.is_active;

    if (classEntity.subject) {
      this.subject = {
        id: classEntity.subject.id,
        code: classEntity.subject.code,
        name: classEntity.subject.name,
      };
    }

    if (classEntity.semester) {
      this.semester = {
        id: classEntity.semester.id,
        name: classEntity.semester.name,
        semester_number: classEntity.semester.semester_number,
      };
    }
  }
}
