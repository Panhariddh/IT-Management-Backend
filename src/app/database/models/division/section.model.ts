import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DepartmentModel } from './department.model';

@Entity('section')
export class SectionModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  department_id: number;

  @ManyToOne(() => DepartmentModel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: DepartmentModel;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
