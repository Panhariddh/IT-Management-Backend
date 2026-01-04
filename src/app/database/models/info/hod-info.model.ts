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

@Entity('hod_info')
export class HodInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel, (user) => user.hodInfo)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  hod_id: string;

  @Column({ nullable: true }) 
  department_id: number | null; 

  @ManyToOne(() => DepartmentModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: DepartmentModel;

  @Column({ default: true })
  is_active: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
