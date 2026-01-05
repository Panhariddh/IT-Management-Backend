import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { DegreeLevel } from 'src/app/common/enum/degree.enum';


// DTO for creating a program
export class CreateProgramDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(DegreeLevel)
  degree_lvl: DegreeLevel; 

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(10)
  duration: number;

  @IsOptional()
  @IsNumber()
  department_id?: number;
}


// DTO for updating a program
export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(DegreeLevel)
  degree_lvl?: DegreeLevel; 

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  duration?: number;

  @IsOptional()
  @IsNumber()
  department_id?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// DTO for program listing
export class ProgramDto {
  id: string;
  name: string;
  degree_lvl: DegreeLevel;
  duration: number;
  department_name: string;
  department_id?: number;
}

// DTO for program details
export class ProgramDetailDto extends ProgramDto {
  created_at: Date;
  updated_at: Date;
}

// DTO for pagination response
export class MetaDto {
  page: number;
  limit: number;
  total: number;
}

// DTO for setup data (departments, degree levels)
export class DataSetupDto {
  departments: Array<{
    id: number;
    name: string;
  }>;
  degree_levels: Array<{
    value: number;  
    label: string;
  }>;
}

// DTO for programs response
export class ProgramsResponseDto {
  success: boolean;
  message: string;
  data: ProgramDto[];
  data_setup: DataSetupDto;
  meta: MetaDto;
}

// DTO for create program response
export class CreateProgramResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    degree_lvl: DegreeLevel;
    duration: number;
    department_name: string;
  };
}

// DTO for update program response
export class UpdateProgramResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    degree_lvl: DegreeLevel;
    duration: number;
    department_name: string;
  };
}