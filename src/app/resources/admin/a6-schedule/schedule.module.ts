import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassModel } from 'src/app/database/models/class/class.model';
import { RoomModel } from 'src/app/database/models/class/room.model';
import { ScheduleModel } from 'src/app/database/models/class/schedule.model';
import { StudentInfoModel } from 'src/app/database/models/info/student-info.model';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScheduleModel,
      ClassModel,
      RoomModel,
      StudentInfoModel,
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
