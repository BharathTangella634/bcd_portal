import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Encounter } from './Encounter';
import { User } from './User';

@Entity('clinical_notes')
export class ClinicalNote {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  encounter_id!: number;

  @ManyToOne(() => Encounter)
  @JoinColumn({ name: 'encounter_id' })
  encounter!: Encounter;

  @Column()
  doctor_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ type: 'text' })
  note_text!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
