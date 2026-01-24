import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { DayOfWeek } from 'src/app/common/enum/dayofweek.enum';

export class CreateScheduleDto {
  @IsNotEmpty({ message: 'Class ID is required' })
  @IsNumber({}, { message: 'Class ID must be a number' })
  class_id: number;

  @IsNotEmpty({ message: 'Room ID is required' })
  @IsNumber({}, { message: 'Room ID must be a number' })
  room_id: number;

  @IsNotEmpty({ message: 'Day of week is required' })
  @IsEnum(DayOfWeek, { message: 'Invalid day of week' })
  day_of_week: DayOfWeek;

  @IsNotEmpty({ message: 'Start time is required' })
  @IsString({ message: 'Start time must be a string' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format (24-hour)',
  })
  start_time: string;

  @IsNotEmpty({ message: 'End time is required' })
  @IsString({ message: 'End time must be a string' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format (24-hour)',
  })
  end_time: string;

  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  @Type(() => Boolean)
  is_recurring?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Is active must be a boolean' })
  @Type(() => Boolean)
  is_active?: boolean;
}

export class UpdateScheduleDto {
  @IsOptional()
  @IsNumber({}, { message: 'Class ID must be a number' })
  class_id?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Room ID must be a number' })
  room_id?: number;

  @IsOptional()
  @IsEnum(DayOfWeek, { message: 'Invalid day of week' })
  day_of_week?: DayOfWeek;

  @IsOptional()
  @IsString({ message: 'Start time must be a string' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format (24-hour)',
  })
  start_time?: string;

  @IsOptional()
  @IsString({ message: 'End time must be a string' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format (24-hour)',
  })
  end_time?: string;

  @IsOptional()
  @IsBoolean({ message: 'Is recurring must be a boolean' })
  @Type(() => Boolean)
  is_recurring?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Is active must be a boolean' })
  @Type(() => Boolean)
  is_active?: boolean;
}

export class ScheduleResponseDto {
  id: number;
  class_id: number;
  room_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
