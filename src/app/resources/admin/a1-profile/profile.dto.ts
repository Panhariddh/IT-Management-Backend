import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from 'src/app/common/enum/role.enum';

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  name_kh?: string;

  @IsOptional()
  @IsString()
  name_en?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+]{9,15}$/, {
    message: 'Phone number must be between 9-15 digits and can include +',
  })
  phone?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female'])
  gender?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword?: string;
}

export class AdminProfileDto {
  id: string;
  name_kh: string;
  name_en: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  role: Role;
  image?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AdminProfileResponseDto {
  success: boolean;
  message: string;
  data: AdminProfileDto;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}

export class ChangePasswordResponseDto {
  success: boolean;
  message: string;
}

export class GetAdminProfileByIdDto {
  id: string;
}

export class UpdateAdminProfileByIdDto extends UpdateAdminProfileDto {
  id: string;
}

export class ChangePasswordByIdDto extends ChangePasswordDto {
  id: string;
}
