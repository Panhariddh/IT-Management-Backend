import { IsNotEmpty, IsOptional, IsString, IsEmail, IsNumber, IsEnum, IsDateString } from 'class-validator';
export class CreateStudentDto {
  @IsNotEmpty()
  @IsString()
  student_id: string;

  @IsNotEmpty()
  @IsString()
  name_kh: string;

  @IsNotEmpty()
  @IsString()
  name_en: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsEnum(['Male', 'Female'])
  gender: string;

  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsNumber()
  department_id: number;

  @IsNotEmpty()
  @IsNumber()
  section_id: number;

  @IsNotEmpty()
  @IsNumber()
  program_id: number;

  @IsNotEmpty()
  @IsNumber()
  academic_year_id: number;

  @IsNotEmpty()
  @IsString()
  grade: string;

  @IsNotEmpty()
  @IsNumber()
  student_year: number;

  @IsOptional()
  image?: any;
}

// Add this response DTO
export class CreateStudentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    student_id: string;
    name_en: string;
    name_kh: string;
    email: string;
  };
}
export class StudentDto {
id: string;
  student_id: string;
  name_kh: string;
  name_en: string;
  dob: string;
  gender: string;
  department: string;
  section: string;
  program?: string;
  grade?: string;
  student_year?: number;
  academic_year?: string; 
}
export class StudentDetailDto extends StudentDto {
  email: string;
  phone: string;
  address: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  department_id: number;
  section_id: number;
  program_id: number;
}

export class DataSetupDto {
  departments: Array<{ id: number; name: string }>;
  sections: Array<{ id: number; name: string; department_id: number }>;
  programs: Array<{ id: number; name: string; department_id: number }>;
  academic_years: Array<{ id: number; name: string; isActive: boolean }>;
}

export class MetaDto {
  page: number;
  limit: number;
  total: number;
}

export class StudentsResponseDto {
  success: boolean;
  message: string;
  data: StudentDto[];
  data_setup: DataSetupDto;
  meta: MetaDto;
}



