import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './Question';

@Entity('question_translations')
export class QuestionTranslation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  question_id!: number;

  @ManyToOne(() => Question, (q) => q.translations)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column()
  language_code!: string;

  @Column()
  text!: string;

  @Column({ nullable: true })
  help_text?: string;
}
