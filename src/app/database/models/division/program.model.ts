import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DepartmentModel } from './department.model';
import { DegreeLevel } from 'src/app/common/enum/degree.enum';

@Entity('program')
export class ProgramModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DegreeLevel,
    default: DegreeLevel.BACHELOR,
  })
  degree_lvl: DegreeLevel;

  @Column('int')
  duration: number;

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
