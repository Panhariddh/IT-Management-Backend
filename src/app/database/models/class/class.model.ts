import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { SubjectModel } from "./subject.model";
import { SemesterModel } from "./semester.model";

@Entity('class')
export class ClassModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  section_name: string;

  @ManyToOne(() => SubjectModel, { eager: true }) 
  @JoinColumn({ name: 'subject_id' })
  subject: SubjectModel;

  @Column()
  subject_id: number; 

  @ManyToOne(() => SemesterModel, { eager: true })
  @JoinColumn({ name: 'semester_id' })
  semester: SemesterModel;

  @Column()
  semester_id: number; 

  @Column({ default: true })
  is_active: boolean;
}