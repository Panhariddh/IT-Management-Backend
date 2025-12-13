import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { UserModel } from '../user.model';
import { DepartmentModel } from '../division/department.model';
import { SectionModel } from '../division/section.model';
import { ProgramModel } from '../division/program.model';

@Entity('student_info')
export class StudentInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  student_id: string;

  @Column()
  grade: string;

  @Column()
  student_year: number;

  @Column()
  academic_year: string;

  @Column()
  department_id: number;

  @ManyToOne(() => DepartmentModel, { onDelete: 'RESTRICT' })
  department: DepartmentModel;

  @Column()
  section_id: number;

  @ManyToOne(() => SectionModel, { onDelete: 'RESTRICT' })
  section: SectionModel;

  @Column()
  program_id: number;

  @ManyToOne(() => ProgramModel, { onDelete: 'RESTRICT' })
  program: ProgramModel;

  @Column({ default: true })
  is_active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}