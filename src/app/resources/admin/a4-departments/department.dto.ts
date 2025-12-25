import {
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

// DTO for creating a department (for future use)
export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  head_user_id?: string;
}

// DTO for updating a department (for future use)
export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  head_user_id?: string;
}

// DTO for department listing
export class DepartmentDto {
  id: number;
  name: string;
  description?: string;
  head_user_id?: string;
  head_name?: string;
  created_at: Date;
}

// DTO for department details
export class DepartmentDetailDto extends DepartmentDto {
  head_details?: {
    id: string;
    name_en: string;
    name_kh: string;
    email: string;
  };
  total_hods?: number;
  total_sections?: number;
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
}

// DTO for create department response (for future use)
export class CreateDepartmentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    head_user_id?: string;
  };
}

// DTO for update department response (for future use)
export class UpdateDepartmentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    head_user_id?: string;
    head_name?: string;
  };
}