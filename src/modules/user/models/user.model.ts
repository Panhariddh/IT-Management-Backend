import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'stu_id' })
  stuId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  gender: string;

  @Column()
  address: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column()
  year: string;

  @Column({ name: 'emergency_contact' })
  emergencyContact: string;
}
