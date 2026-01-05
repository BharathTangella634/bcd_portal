import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Questionnaire } from './Questionnaire';
import { QuestionTranslation } from './QuestionTranslation';
import { QuestionOption } from './QuestionOption';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  questionnaire_id!: number;

  @ManyToOne(() => Questionnaire, (q) => q.questions)
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire!: Questionnaire;

  @Column()
  order!: number;

  @Column()
  type!: string; // text, single-choice, multi-choice, numeric

  @Column()
  code!: string;

  @OneToMany(() => QuestionTranslation, (t) => t.question)
  translations!: QuestionTranslation[];

  @OneToMany(() => QuestionOption, (o) => o.question)
  options!: QuestionOption[];
}
