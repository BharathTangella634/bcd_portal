import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Question } from './Question';
import { QuestionOptionTranslation } from './QuestionOptionTranslation';

@Entity('question_options')
export class QuestionOption {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question_id!: number;

  @ManyToOne(() => Question, (q) => q.options)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column()
  code!: string;

  @Column()
  order!: number;

  @Column()
  value!: string;

  @OneToMany(() => QuestionOptionTranslation, (t) => t.option)
  translations!: QuestionOptionTranslation[];
}
