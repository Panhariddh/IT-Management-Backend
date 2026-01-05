import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProgramModel } from '../division/program.model';


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
  credits: number;

  @ManyToOne(() => ProgramModel)
  @JoinColumn({ name: 'program_id' })
  program: ProgramModel;

  @Column({ nullable: true })
  teacher_id?: number; 

  @Column({ default: true })
  is_active: boolean;
}