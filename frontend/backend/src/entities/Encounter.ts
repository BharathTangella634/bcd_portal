import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Patient } from './Patient';
import { Hospital } from './Hospital';
import { User } from './User';
import { Response } from './Response';

export enum EncounterStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VALIDATED = 'validated',
}

@Entity('encounters')
export class Encounter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patient_id!: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column()
  hospital_id!: number;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital!: Hospital;

  @Column({ nullable: true })
  doctor_id?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor?: User;

  @Column({
    type: 'enum',
    enum: EncounterStatus,
    default: EncounterStatus.DRAFT,
  })
  status!: EncounterStatus;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Response, (response) => response.encounter)
  responses!: Response[];
}
