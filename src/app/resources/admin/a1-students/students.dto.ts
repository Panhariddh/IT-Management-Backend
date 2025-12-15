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