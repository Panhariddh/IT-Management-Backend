import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('room')
export class RoomModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_code: string;

  @Column()
  building: string;

  @Column('int')
  capacity: number;

  @Column({ nullable: true })
  qr_code_url: string; 

  @Column({ default: true })
  is_active: boolean;
}