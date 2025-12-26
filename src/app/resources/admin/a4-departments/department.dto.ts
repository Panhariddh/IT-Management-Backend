import { IsString, IsOptional, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';


// DTO for user options in data setup
export class UserOptionDto {
  id: string;
  name: string;
  name_kh?: string;
  name_en: string;
}

// DTO for setup data (users for head selection, etc.)
export class DataSetupDto {
  head_user_options: UserOptionDto[];
}


// DTO for creating a department
export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  head_user_id?: string;
}

// DTO for updating a department
export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID() 
  head_user_id?: string;
}

// DTO for create department response
export class CreateDepartmentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    description?: string;
    head_user_id?: string;
    head_name?: string;
  };
}

// DTO for update department response
export class UpdateDepartmentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    description?: string;
    head_user_id?: string;
    head_name?: string;
  };
}

// DTO for department listing
export class DepartmentDto {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}
// DTO for section listing
export class SectionDto {
  id: number;
  name: string;
  created_at: Date;
}

// DTO for department details
export class DepartmentDetailDto {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  sections: SectionDto[];
}

// DTO for pagination response
export class MetaDto {
  page: number;
  limit: number;
  total: number;
}

// DTO for departments response
export class DepartmentResponseDto {
  success: boolean;
  message: string;
  data: DepartmentDto[];
  meta: MetaDto;
  data_setup: DataSetupDto;
}

// DTO for creating a section
export class CreateSectionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  department_id: number;
}

// DTO for updating a section
export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;
}

// DTO for section details
export class SectionDetailDto {
  id: number;
  name: string;
  description?: string;
  department_name?: string;
  created_at: Date;
}

// DTO for sections response
export class SectionsResponseDto {
  success: boolean;
  message: string;
  data: SectionDto[];
  meta: MetaDto;
}

// DTO for section response
export class SectionResponseDto {
  success: boolean;
  message: string;
  data: SectionDetailDto;
}

// DTO for create/update section response
export class CreateUpdateSectionResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    description?: string;
    department_id: number;
    department_name?: string;
  };
}
