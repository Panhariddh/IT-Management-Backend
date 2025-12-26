import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
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

  @OneToOne(() => UserModel, { nullable: true })
  @JoinColumn({
    name: 'head_user_id',
    referencedColumnName: 'id', // users.id (UUID)
  })
  head?: UserModel;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}

