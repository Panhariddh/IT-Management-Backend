import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty({ message: 'Room code is required' })
  @IsString({ message: 'Room code must be a string' })
  @Length(1, 20, { message: 'Room code must be between 1 and 20 characters' })
  room_code: string;

  @IsNotEmpty({ message: 'Building is required' })
  @IsString({ message: 'Building must be a string' })
  @Length(1, 50, { message: 'Building must be between 1 and 50 characters' })
  building: string;

  @IsNotEmpty({ message: 'Capacity is required' })
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  @Max(500, { message: 'Capacity cannot exceed 500' })
  @Type(() => Number)
  capacity: number;

  @IsOptional()
  @IsString({ message: 'QR code URL must be a string' })
  @Matches(/^https?:\/\/.+\..+$/, {
    message: 'QR code URL must be a valid URL',
  })
  qr_code_url?: string;

  @IsOptional()
  @IsBoolean({ message: 'Is active must be a boolean' })
  @Type(() => Boolean)
  is_active?: boolean;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString({ message: 'Room code must be a string' })
  @Length(1, 20, { message: 'Room code must be between 1 and 20 characters' })
  room_code?: string;

  @IsOptional()
  @IsString({ message: 'Building must be a string' })
  @Length(1, 50, { message: 'Building must be between 1 and 50 characters' })
  building?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Capacity must be a number' })
  @Min(1, { message: 'Capacity must be at least 1' })
  @Max(500, { message: 'Capacity cannot exceed 500' })
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsString({ message: 'QR code URL must be a string' })
  @Matches(/^https?:\/\/.+\..+$/, {
    message: 'QR code URL must be a valid URL',
  })
  qr_code_url?: string;

  @IsOptional()
  @IsBoolean({ message: 'Is active must be a boolean' })
  @Type(() => Boolean)
  is_active?: boolean;
}

export class RoomResponseDto {
  id: number;
  room_code: string;
  building: string;
  capacity: number;
  qr_code_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
