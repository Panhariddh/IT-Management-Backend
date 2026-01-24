import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/app/common/enum/role.enum';
import { RoomModel } from 'src/app/database/models/class/room.model';
import { Repository } from 'typeorm';
import { CreateRoomDto, UpdateRoomDto } from './room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(RoomModel)
    private roomRepository: Repository<RoomModel>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomModel> {
    // Check if room code already exists
    const existingRoom = await this.roomRepository.findOne({
      where: { room_code: createRoomDto.room_code },
    });

    if (existingRoom) {
      throw new ConflictException('Room code already exists');
    }

    const room = this.roomRepository.create(createRoomDto);
    return await this.roomRepository.save(room);
  }

  async findAll(userRole?: Role): Promise<RoomModel[]> {
    const query = this.roomRepository
      .createQueryBuilder('room')
      .orderBy('room.building', 'ASC')
      .addOrderBy('room.room_code', 'ASC');

    // Students can only see active rooms
    if (userRole === Role.STUDENT) {
      query.where('room.is_active = :isActive', { isActive: true });
    } else {
      // Admin, HOD, Teacher can see all active rooms by default
      query.where('room.is_active = :isActive', { isActive: true });
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<RoomModel> {
    const room = await this.roomRepository.findOne({
      where: { id, is_active: true },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<RoomModel> {
    const room = await this.findOne(id);

    // If room code is being changed, check for duplicates
    if (updateRoomDto.room_code && updateRoomDto.room_code !== room.room_code) {
      const existingRoom = await this.roomRepository.findOne({
        where: { room_code: updateRoomDto.room_code },
      });

      if (existingRoom && existingRoom.id !== id) {
        throw new ConflictException('Room code already exists');
      }
    }

    // Validate capacity if being updated
    if (updateRoomDto.capacity !== undefined) {
      if (updateRoomDto.capacity < 1) {
        throw new BadRequestException('Capacity must be at least 1');
      }
      if (updateRoomDto.capacity > 500) {
        throw new BadRequestException('Capacity cannot exceed 500');
      }
    }

    Object.assign(room, updateRoomDto);
    return await this.roomRepository.save(room);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);

    // Check if room has active schedules
    const hasActiveSchedules = await this.hasActiveSchedules(id);
    if (hasActiveSchedules) {
      throw new ConflictException('Cannot delete room with active schedules');
    }

    room.is_active = false;
    await this.roomRepository.save(room);
  }

  async searchRooms(query: string): Promise<RoomModel[]> {
    return await this.roomRepository
      .createQueryBuilder('room')
      .where('room.is_active = :isActive', { isActive: true })
      .andWhere('(room.room_code ILIKE :query OR room.building ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('room.building', 'ASC')
      .addOrderBy('room.room_code', 'ASC')
      .getMany();
  }

  async getRoomsByBuilding(building: string): Promise<RoomModel[]> {
    return await this.roomRepository.find({
      where: { building, is_active: true },
      order: { room_code: 'ASC' },
    });
  }

  async getAvailableRooms(
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    capacity?: number,
  ): Promise<RoomModel[]> {
    // First validate the times
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    const query = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect(
        'schedule',
        'schedule',
        'schedule.room_id = room.id AND schedule.day_of_week = :dayOfWeek AND schedule.is_active = true',
        { dayOfWeek },
      )
      .where('room.is_active = :isActive', { isActive: true })
      .andWhere(
        '(schedule.id IS NULL OR NOT (schedule.start_time < :endTime AND schedule.end_time > :startTime))',
        { startTime, endTime },
      );

    if (capacity) {
      query.andWhere('room.capacity >= :capacity', { capacity });
    }

    return await query
      .orderBy('room.building', 'ASC')
      .addOrderBy('room.room_code', 'ASC')
      .getMany();
  }

  private async hasActiveSchedules(roomId: number): Promise<boolean> {
    const { ScheduleModel } =
      await import('../../../database/models/class/schedule.model');

    const scheduleRepo =
      this.roomRepository.manager.getRepository(ScheduleModel);

    const activeSchedule = await scheduleRepo.findOne({
      where: { room_id: roomId, is_active: true },
    });

    return !!activeSchedule;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async findAllIncludingInactive(): Promise<RoomModel[]> {
    return await this.roomRepository.find({
      order: { building: 'ASC', room_code: 'ASC' },
    });
  }

  async restore(id: number): Promise<RoomModel> {
    const room = await this.roomRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    room.is_active = true;
    return await this.roomRepository.save(room);
  }

  async hardDelete(id: number): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Check if room has any schedules (even inactive ones)
    const hasSchedules = await this.hasAnySchedules(id);
    if (hasSchedules) {
      throw new ConflictException(
        'Cannot permanently delete room with schedule history',
      );
    }

    await this.roomRepository.remove(room);
  }

  async getRoomStatistics(): Promise<any> {
    const totalRooms = await this.roomRepository.count();
    const activeRooms = await this.roomRepository.count({
      where: { is_active: true },
    });
    const inactiveRooms = totalRooms - activeRooms;

    // Get rooms by building
    const roomsByBuilding = await this.roomRepository
      .createQueryBuilder('room')
      .select('room.building, COUNT(*) as count')
      .groupBy('room.building')
      .getRawMany();

    // Get capacity statistics
    const capacityStats = await this.roomRepository
      .createQueryBuilder('room')
      .select(
        'AVG(room.capacity) as avg_capacity, MIN(room.capacity) as min_capacity, MAX(room.capacity) as max_capacity',
      )
      .where('room.is_active = true')
      .getRawOne();

    return {
      total_rooms: totalRooms,
      active_rooms: activeRooms,
      inactive_rooms: inactiveRooms,
      rooms_by_building: roomsByBuilding,
      capacity_statistics: capacityStats,
    };
  }

  private async hasAnySchedules(roomId: number): Promise<boolean> {
    const { ScheduleModel } =
      await import('../../../database/models/class/schedule.model');
    const scheduleRepo =
      this.roomRepository.manager.getRepository(ScheduleModel);

    const schedule = await scheduleRepo.findOne({
      where: { room_id: roomId },
    });

    return !!schedule;
  }
}
