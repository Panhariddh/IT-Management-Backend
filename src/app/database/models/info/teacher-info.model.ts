import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DepartmentModel } from '../division/department.model';
import { UserModel } from '../user.model';

@Entity('teacher_info')
export class TeacherInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel, (user) => user.teacherInfo)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  teacher_id: string;

  @Column({ nullable: true })
  department_id?: number | null;

  @ManyToOne(() => DepartmentModel, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: DepartmentModel | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
