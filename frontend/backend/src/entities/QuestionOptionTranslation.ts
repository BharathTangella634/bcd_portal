import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionOption } from './QuestionOption';

@Entity('question_option_translations')
export class QuestionOptionTranslation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  option_id!: number;

  @ManyToOne(() => QuestionOption, (o) => o.translations)
  @JoinColumn({ name: 'option_id' })
  option!: QuestionOption;

  @Column()
  language_code!: string;

  @Column()
  label!: string;
}
