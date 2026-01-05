import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Encounter } from './Encounter';
import { Question } from './Question';

@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  encounter_id!: number;

  @ManyToOne(() => Encounter, (e) => e.responses)
  @JoinColumn({ name: 'encounter_id' })
  encounter!: Encounter;

  @Column()
  question_id!: number;

  @ManyToOne(() => Question)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ type: 'jsonb' })
  value_json!: any;

  @Column()
  created_by_user_id!: number;

  @Column({ nullable: true })
  updated_by_user_id?: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
