import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Question } from './Question';

@Entity('questionnaires')
export class Questionnaire {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  hospital_id?: number;

  @Column()
  code!: string;

  @Column()
  version!: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Question, (question) => question.questionnaire)
  questions!: Question[];
}
