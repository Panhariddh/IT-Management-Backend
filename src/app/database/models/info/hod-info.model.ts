import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from '../user.model';
import { DepartmentModel } from '../division/department.model';

@Entity('hod_info')
export class HodInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  hod_id: string; 

  @Column()
  department_id: number;

  @ManyToOne(() => DepartmentModel, { onDelete: 'RESTRICT' }) 
  @JoinColumn({ name: 'department_id' }) 
  department: DepartmentModel;

  @Column({ default: true })
  is_active: boolean;

  @Column({ 
    name: 'created_at', 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  createdAt: Date;
}