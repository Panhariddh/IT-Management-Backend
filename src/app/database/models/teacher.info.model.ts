import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from './user.model';
import { DepartmentModel } from './department.model';

@Entity('teacher_info')
export class TeacherInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  employee_number: string;

  @Column({ nullable: true })
  department_id: string;

  @ManyToOne(() => DepartmentModel, { onDelete: 'SET NULL' })
  department?: DepartmentModel;

  @Column({ nullable: true })
  position: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}