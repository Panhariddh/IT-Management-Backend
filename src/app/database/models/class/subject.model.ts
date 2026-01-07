import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ProgramModel } from '../division/program.model';
import { SemesterModel } from './semester.model';
import { TeacherInfoModel } from '../info/teacher-info.model';

@Entity('subject')
export class SubjectModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('int')
  total_hours: number;

  @Column('int')
  credits: number;

  @ManyToOne(() => ProgramModel)
  @JoinColumn({ name: 'program_id' })
  program: ProgramModel;

  @ManyToOne(() => TeacherInfoModel, { nullable: true })
  @JoinColumn({ name: 'teacher_info_id' })
  teacherInfo?: TeacherInfoModel;

  @Column({ default: true })
  is_active: boolean;

  @ManyToMany(() => SemesterModel, (semester) => semester.subjects)
  @JoinTable({
    name: 'subject_semesters',
    joinColumn: {
      name: 'subject_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'semester_id',
      referencedColumnName: 'id',
    },
  })
  semesters: SemesterModel[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
