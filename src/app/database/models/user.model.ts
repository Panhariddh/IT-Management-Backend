import { Role } from 'src/app/common/enum/role.enum';
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { HodInfoModel } from './info/hod-info.model';
import { StudentInfoModel } from './info/student-info.model';
import { TeacherInfoModel } from './info/teacher-info.model';

@Entity('users')
export class UserModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  name_kh: string;

  @Column()
  name_en: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  gender: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'password_changed', type: 'boolean', default: false })
  passwordChanged: boolean;

  @Column({ name: 'password_reset_token', type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expires', type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ name: 'last_password_change', type: 'timestamp', nullable: true })
  lastPasswordChange: Date;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToOne(() => StudentInfoModel, (student) => student.user)
  studentInfo?: StudentInfoModel;

  @OneToOne(() => HodInfoModel, (hod) => hod.user)
  hodInfo?: HodInfoModel;

  @OneToOne(() => TeacherInfoModel, (teacher) => teacher.user)
  teacherInfo?: TeacherInfoModel;
}
