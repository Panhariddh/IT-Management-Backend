import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
} from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(20)
  credits: number;

  @IsNotEmpty()
  @IsNumber()
  program_id: number;

  @IsOptional()
  @IsString()
  teacher_info_id?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  semester_ids?: number[];
}

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  credits?: number;

  @IsOptional()
  @IsNumber()
  program_id?: number;

  @IsOptional()
  @IsString()
  teacher_info_id?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  semester_ids?: number[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export interface TeacherDto {
  id: string;    
  code: string;   
  name: string;   
  email?: string; 
  department?: string;
}

export class SubjectDto {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  program_name: string;
  program_id: number;
  teacher_name?: string;
  teacher_code?: string;  
  teacher_info_id?: string;
  semester_names: string[];
}

export class SubjectDetailDto extends SubjectDto {
  teacher?: TeacherDto; 
  teachers: TeacherDto[];  
  semesters: Array<{
    id: number;
    name: string;
    semester_number: number;
    year_number: number;
  }>;
  created_at: Date;
  updated_at: Date;
}

export class SubjectSetupDto {
  programs: Array<{
    id: number;
    name: string;
  }>;
  semesters: Array<{
    id: number;
    name: string;
    semester_number: number;
    year_number: number;
    program_id: number;
  }>;
  teachers: TeacherDto[];
}

export class SubjectMetaDto {
  page: number;
  limit: number;
  total: number;
}

export class SubjectsResponseDto {
  success: boolean;
  message: string;
  data: SubjectDto[];
  data_setup: SubjectSetupDto;
  meta: SubjectMetaDto;
}

// DTO for create subject response
export class CreateSubjectResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    code: string;
    name: string;
    description: string;
    credits: number;
    program_name: string;
    program_id: number;
    teacher_name?: string;
    teacher_code?: string;
    teacher_info_id?: string; 
    semester_names: string[];
  };
}

export class UpdateSubjectResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    code: string;
    name: string;
    description: string;
    credits: number;
    program_name: string;
    program_id: number;
    teacher_name?: string;
    teacher_code?: string;
    teacher_info_id?: string; 
    semester_names: string[];
  };
}