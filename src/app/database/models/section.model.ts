import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { DepartmentModel } from './department.model';

@Entity('section')
export class SectionModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  department_id: string;

  @ManyToOne(() => DepartmentModel, { onDelete: 'CASCADE' })
  department: DepartmentModel;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}