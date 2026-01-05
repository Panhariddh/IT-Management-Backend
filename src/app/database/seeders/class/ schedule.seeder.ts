import { AppDataSource } from '../../../config/data-source';
import { ScheduleModel } from '../../models/class/schedule.model';
import { ClassModel } from '../../models/class/class.model';
import { RoomModel } from '../../models/class/room.model';
import { DayOfWeek } from 'src/app/common/enum/dayofweek.enum';


export class ScheduleSeeder {
  static async seed() {
    const repo = AppDataSource.getRepository(ScheduleModel);
    const classRepo = AppDataSource.getRepository(ClassModel);
    const roomRepo = AppDataSource.getRepository(RoomModel);

    // Load classes and rooms with proper relations
    const classes = await classRepo.find({ 
      relations: ['subject', 'semester'],
      where: { is_active: true }
    });
    
    const rooms = await roomRepo.find({ 
      where: { is_active: true }
    });

    const timeSlots = [
      { start: '08:00:00', end: '09:30:00' },
      { start: '09:45:00', end: '11:15:00' },
      { start: '11:30:00', end: '13:00:00' },
      { start: '14:00:00', end: '15:30:00' },
      { start: '15:45:00', end: '17:15:00' },
    ];

    const daysOfWeek = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
    ];

    const schedules: Array<Partial<ScheduleModel>> = [];

    // Distribute schedules evenly
    for (let i = 0; i < classes.length; i++) {
      const classItem = classes[i];
      const room = rooms[i % rooms.length];
      const day = daysOfWeek[i % daysOfWeek.length];
      const timeSlot = timeSlots[i % timeSlots.length];

      schedules.push({
        class_id: classItem.id,
        room_id: room.id,
        day_of_week: day,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        is_recurring: true,
        is_active: true,
      });
    }

    for (const scheduleData of schedules) {
      const existing = await repo.findOne({
        where: {
          class_id: scheduleData.class_id,
          day_of_week: scheduleData.day_of_week,
          start_time: scheduleData.start_time,
        },
      });

      if (!existing) {
        await repo.save(repo.create(scheduleData as ScheduleModel));
      }
    }

    console.log('✅ ScheduleSeeder completed.');
  }
}