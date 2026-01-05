import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProgramModel } from '../division/program.model';
import { AcademicYearModel } from '../academic.year.model';


@Entity('semester')
export class SemesterModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; 

  @Column()
  semester_number: number; 

  @Column('int')
  year_number: number; // Year 1, Year 2, etc.

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => ProgramModel)
  @JoinColumn({ name: 'program_id' })
  program: ProgramModel;

  @ManyToOne(() => AcademicYearModel)
  @JoinColumn({ name: 'academic_year_id' })
  academic_year: AcademicYearModel;
}