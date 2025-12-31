import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AcademicYearModel } from '../academic.year.model';
import { DepartmentModel } from '../division/department.model';
import { ProgramModel } from '../division/program.model';
import { SectionModel } from '../division/section.model';
import { UserModel } from '../user.model';

@Entity('student_info')
export class StudentInfoModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => UserModel, (user) => user.studentInfo)
  @JoinColumn({ name: 'user_id' })
  user: UserModel;

  @Column({ unique: true })
  student_id: string;

  @Column()
  student_year: number;

  @Column()
  academic_year_id: number;

  @ManyToOne(() => AcademicYearModel, { nullable: true })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear?: AcademicYearModel;

  @Column()
  department_id: number;

  @ManyToOne(() => DepartmentModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department: DepartmentModel;

  @Column()
  section_id: number;

  @ManyToOne(() => SectionModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'section_id' })
  section: SectionModel;

  @Column()
  program_id: number;

  @ManyToOne(() => ProgramModel, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'program_id' })
  program: ProgramModel;

  @Column({ default: true })
  is_active: boolean;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
