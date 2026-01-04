// hods.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

// DTO for creating a hod
export class CreateHodDto {
  @IsNotEmpty()
  @IsString()
  name_en: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name_kh?: string;

  @IsNotEmpty()
  @IsString()
  hod_id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(['Male', 'Female'])
  gender?: string;

  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsOptional()
  image?: any;
}

// DTO for updating a hod
export class UpdateHodDto {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name_en?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name_kh?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  hod_id?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsEnum(['Male', 'Female'])
  gender?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  phone?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsNotEmpty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  image?: any;
}

// DTO for hod details
export class HodDto {
  id: string;
  hod_id: string;
  name_kh: string;
  name_en: string;
  email: string;
  dob: string;
  phone: string;
  gender: string;
  department: string;
}
export class HodDetailDto extends HodDto {
  address: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  department_id?: number;
  is_active: boolean;
}

// DTO for pagination response
export class MetaDto {
  page: number;
  limit: number;
  total: number;
}

// DTO for setup data (departments, etc.)
export class DataSetupDto {
  departments: Array<{
    id: number;
    name: string;
  }>;
}

// DTO for hods response
export class HodsResponseDto {
  success: boolean;
  message: string;
  data: HodDto[];
  data_setup: DataSetupDto;
  meta: MetaDto;
}

// DTO for create hod response
export class CreateHodResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    hod_id: string;
    name_en: string;
    name_kh: string;
    email: string;
    image?: string;
  };
}

// DTO for update hod response
export class UpdateHodResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    hod_id: string;
    name_en: string;
    name_kh: string;
    image?: string;
    department: string;
    is_active: boolean;
  };
}