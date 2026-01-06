import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateSemesterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(3)
  semester_number: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  year_number: number;

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsNotEmpty()
  @IsNumber()
  academic_year_id: number; // Keep this, as academic_year_id is not in URL

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
  
  // REMOVED: program_id - will come from URL parameter
}

export class UpdateSemesterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  semester_number?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  year_number?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  academic_year_id?: number; // Optional for updates

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
  
  // REMOVED: program_id - cannot change program via this endpoint
}
export class SemesterDto {
  id: string;
  name: string;
  semester_number: number;
  year_number: number;
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  program_id: number;
  program_name: string;
  academic_year_id: number;
  academic_year_name: string;
}

export class SemesterDetailDto extends SemesterDto {
  created_at?: Date;
  updated_at?: Date;
}

export class SemesterMetaDto {
  page: number;
  limit: number;
  total: number;
}

export class SemesterDataSetupDto {
  programs: Array<{
    id: number;
    name: string;
  }>;
  academic_years: Array<{
    id: number;
    name: string;
    start_year?: number; 
    end_year?: number; 
  }>;
}

export class SemestersResponseDto {
  success: boolean;
  message: string;
  data: SemesterDto[];
  data_setup: SemesterDataSetupDto;
  meta: SemesterMetaDto;
}

export class SemesterResponseDto {
  success: boolean;
  message: string;
  data: SemesterDetailDto;
}

export class CreateSemesterResponseDto {
  success: boolean;
  message: string;
  data: SemesterDto;
}

export class UpdateSemesterResponseDto {
  success: boolean;
  message: string;
  data: SemesterDto;
}
