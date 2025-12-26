import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne, 
  JoinColumn,
} from 'typeorm';
import { UserModel } from '../user.model';

@Entity('department')
export class DepartmentModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => UserModel, { nullable: true })
  @JoinColumn({
    name: 'hod_user_id',
    referencedColumnName: 'id',
  })
  head?: UserModel;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}