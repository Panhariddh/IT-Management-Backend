
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserModel } from './user.model';


@Entity('department')
export class DepartmentModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  head_user_id: string | null;

  @OneToOne(() => UserModel)
  @JoinColumn({ name: 'head_user_id' })
  head?: UserModel;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}