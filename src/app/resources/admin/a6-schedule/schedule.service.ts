import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DayOfWeek } from 'src/app/common/enum/dayofweek.enum';
import { Role } from 'src/app/common/enum/role.enum';
import { ClassModel } from 'src/app/database/models/class/class.model';
import { RoomModel } from 'src/app/database/models/class/room.model';
import { ScheduleModel } from 'src/app/database/models/class/schedule.model';
import { Repository } from 'typeorm';
import { CreateScheduleDto, UpdateScheduleDto } from './schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleModel)
    private scheduleRepository: Repository<ScheduleModel>,
    @InjectRepository(ClassModel)
    private classRepository: Repository<ClassModel>,
    @InjectRepository(RoomModel)
    private roomRepository: Repository<RoomModel>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<ScheduleModel> {
    // Validate time format and logic
    this.validateScheduleTimes(
      createScheduleDto.start_time,
      createScheduleDto.end_time,
    );

    // Check if class exists
    const classExists = await this.classRepository.findOne({
      where: { id: createScheduleDto.class_id, is_active: true },
    });
    if (!classExists) {
      throw new NotFoundException('Class not found or inactive');
    }

    // Check if room exists
    const roomExists = await this.roomRepository.findOne({
      where: { id: createScheduleDto.room_id, is_active: true },
    });
    if (!roomExists) {
      throw new NotFoundException('Room not found or inactive');
    }

    // Check for room availability (no overlapping schedules)
    const isRoomAvailable = await this.checkRoomAvailability(
      createScheduleDto.room_id,
      createScheduleDto.day_of_week,
      createScheduleDto.start_time,
      createScheduleDto.end_time,
    );
    if (!isRoomAvailable) {
      throw new ConflictException('Room is already booked at this time');
    }

    // Check if class already has schedule at this time
    const classConflict = await this.checkClassScheduleConflict(
      createScheduleDto.class_id,
      createScheduleDto.day_of_week,
      createScheduleDto.start_time,
      createScheduleDto.end_time,
    );
    if (classConflict) {
      throw new ConflictException('Class already has a schedule at this time');
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      class: classExists,
      room: roomExists,
    });

    return await this.scheduleRepository.save(schedule);
  }

  async findAll(userRole?: Role): Promise<ScheduleModel[]> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.class', 'class')
      .leftJoinAndSelect('schedule.room', 'room')
      .orderBy('schedule.day_of_week', 'ASC')
      .addOrderBy('schedule.start_time', 'ASC');

    // Students can only see active schedules
    if (userRole === Role.STUDENT) {
      query.where('schedule.is_active = :isActive', { isActive: true });
    } else {
      // Admin, HOD, Teacher can see all active schedules by default
      query.where('schedule.is_active = :isActive', { isActive: true });
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<ScheduleModel> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id, is_active: true },
      relations: ['class', 'room'],
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<ScheduleModel> {
    const schedule = await this.findOne(id);

    // If times are being updated, validate them
    if (updateScheduleDto.start_time || updateScheduleDto.end_time) {
      const startTime = updateScheduleDto.start_time || schedule.start_time;
      const endTime = updateScheduleDto.end_time || schedule.end_time;
      this.validateScheduleTimes(startTime, endTime);
    }

    // If room is being changed, check availability
    if (
      updateScheduleDto.room_id &&
      updateScheduleDto.room_id !== schedule.room_id
    ) {
      const roomExists = await this.roomRepository.findOne({
        where: { id: updateScheduleDto.room_id, is_active: true },
      });
      if (!roomExists) {
        throw new NotFoundException('Room not found or inactive');
      }

      const dayOfWeek = updateScheduleDto.day_of_week || schedule.day_of_week;
      const startTime = updateScheduleDto.start_time || schedule.start_time;
      const endTime = updateScheduleDto.end_time || schedule.end_time;

      const isRoomAvailable = await this.checkRoomAvailability(
        updateScheduleDto.room_id,
        dayOfWeek,
        startTime,
        endTime,
        id, // Exclude current schedule from check
      );
      if (!isRoomAvailable) {
        throw new ConflictException('Room is already booked at this time');
      }
      schedule.room = roomExists;
      schedule.room_id = updateScheduleDto.room_id;
    }

    // If class is being changed, check if class exists
    if (
      updateScheduleDto.class_id &&
      updateScheduleDto.class_id !== schedule.class_id
    ) {
      const classExists = await this.classRepository.findOne({
        where: { id: updateScheduleDto.class_id, is_active: true },
      });
      if (!classExists) {
        throw new NotFoundException('Class not found or inactive');
      }

      // Check for class schedule conflict
      const dayOfWeek = updateScheduleDto.day_of_week || schedule.day_of_week;
      const startTime = updateScheduleDto.start_time || schedule.start_time;
      const endTime = updateScheduleDto.end_time || schedule.end_time;

      const classConflict = await this.checkClassScheduleConflict(
        updateScheduleDto.class_id,
        dayOfWeek,
        startTime,
        endTime,
        id, // Exclude current schedule from check
      );
      if (classConflict) {
        throw new ConflictException(
          'Class already has a schedule at this time',
        );
      }
      schedule.class = classExists;
      schedule.class_id = updateScheduleDto.class_id;
    }

    // Update other fields
    Object.assign(schedule, updateScheduleDto);

    return await this.scheduleRepository.save(schedule);
  }

  async remove(id: number): Promise<void> {
    const schedule = await this.findOne(id);
    schedule.is_active = false;
    await this.scheduleRepository.save(schedule);
  }

  async getSchedulesByRoom(roomId: number): Promise<ScheduleModel[]> {
    const roomExists = await this.roomRepository.findOne({
      where: { id: roomId, is_active: true },
    });
    if (!roomExists) {
      throw new NotFoundException('Room not found or inactive');
    }

    return await this.scheduleRepository.find({
      where: { room_id: roomId, is_active: true },
      relations: ['class'],
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async getSchedulesByClass(classId: number): Promise<ScheduleModel[]> {
    const classExists = await this.classRepository.findOne({
      where: { id: classId, is_active: true },
    });
    if (!classExists) {
      throw new NotFoundException('Class not found or inactive');
    }

    return await this.scheduleRepository.find({
      where: { class_id: classId, is_active: true },
      relations: ['room'],
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async getSchedulesByDay(day: DayOfWeek): Promise<ScheduleModel[]> {
    if (!Object.values(DayOfWeek).includes(day)) {
      throw new BadRequestException('Invalid day of week');
    }

    return await this.scheduleRepository.find({
      where: { day_of_week: day, is_active: true },
      relations: ['class', 'room'],
      order: { start_time: 'ASC' },
    });
  }

  private validateScheduleTimes(startTime: string, endTime: string): void {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    const duration = end - start;
    if (duration < 30) {
      // Minimum 30 minutes
      throw new BadRequestException(
        'Schedule duration must be at least 30 minutes',
      );
    }

    if (duration > 240) {
      // Maximum 4 hours
      throw new BadRequestException('Schedule duration cannot exceed 4 hours');
    }
  }

  private async checkRoomAvailability(
    roomId: number,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number,
  ): Promise<boolean> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.room_id = :roomId', { roomId })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('schedule.is_active = :isActive', { isActive: true })
      .andWhere(
        '(schedule.start_time < :endTime AND schedule.end_time > :startTime)',
        { startTime, endTime },
      );

    if (excludeScheduleId) {
      query.andWhere('schedule.id != :excludeId', {
        excludeId: excludeScheduleId,
      });
    }

    const conflictingSchedules = await query.getMany();
    return conflictingSchedules.length === 0;
  }

  private async checkClassScheduleConflict(
    classId: number,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeScheduleId?: number,
  ): Promise<boolean> {
    const query = this.scheduleRepository
      .createQueryBuilder('schedule')
      .where('schedule.class_id = :classId', { classId })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('schedule.is_active = :isActive', { isActive: true })
      .andWhere(
        '(schedule.start_time < :endTime AND schedule.end_time > :startTime)',
        { startTime, endTime },
      );

    if (excludeScheduleId) {
      query.andWhere('schedule.id != :excludeId', {
        excludeId: excludeScheduleId,
      });
    }

    const conflictingSchedules = await query.getMany();
    return conflictingSchedules.length > 0;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async findAllIncludingInactive(): Promise<ScheduleModel[]> {
    return await this.scheduleRepository.find({
      relations: ['class', 'room'],
      order: { day_of_week: 'ASC', start_time: 'ASC' },
    });
  }

  async restore(id: number): Promise<ScheduleModel> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    schedule.is_active = true;
    return await this.scheduleRepository.save(schedule);
  }

  async hardDelete(id: number): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    await this.scheduleRepository.remove(schedule);
  }
}
