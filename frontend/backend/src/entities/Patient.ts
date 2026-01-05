import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Hospital } from './Hospital';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  hospital_id!: number;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital!: Hospital;

  @Column()
  external_id!: string; // MRN or hospital ID

  @Column()
  name!: string;

  @Column({ type: 'date' })
  dob!: Date;

  @Column()
  sex!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
