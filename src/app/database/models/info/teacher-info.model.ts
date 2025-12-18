import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from '../user.model';
import { DepartmentModel } from '../division/department.model';

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