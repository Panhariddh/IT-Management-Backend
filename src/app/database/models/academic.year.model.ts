import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('academic_year')
@Unique(['name'])
export class AcademicYearModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 9,
    comment: 'Academic year format: YYYY-YYYY (e.g., 2024-2025)'
  })
  name: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Is current academic year'
  })
  isActive: boolean;
}
