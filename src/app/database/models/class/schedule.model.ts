import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ClassModel } from "./class.model";
import { RoomModel } from "./room.model";
import { DayOfWeek } from "src/app/common/enum/dayofweek.enum";

@Entity('schedule')
export class ScheduleModel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ClassModel, { eager: true })
  @JoinColumn({ name: 'class_id' })
  class: ClassModel;

  @Column()
  class_id: number; 

  @ManyToOne(() => RoomModel, { eager: true })
  @JoinColumn({ name: 'room_id' })
  room: RoomModel;

  @Column()
  room_id: number; 

  @Column({
    type: 'enum',
    enum: DayOfWeek
  })
  day_of_week: DayOfWeek;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ default: true })
  is_recurring: boolean;

  @Column({ default: true })
  is_active: boolean;
}