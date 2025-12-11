import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from './user.model';
import { DepartmentModel } from './department.model';

@Entity('hod_info')
export class HodInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column()
  department_id: string;

  @ManyToOne(() => DepartmentModel, { onDelete: 'CASCADE' })
  department: DepartmentModel;

  @Column({ type: 'date', nullable: true })
  appointed_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}