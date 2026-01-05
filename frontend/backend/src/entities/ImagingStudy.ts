import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './Patient';
import { Encounter } from './Encounter';

@Entity('imaging_studies')
export class ImagingStudy {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patient_id!: number;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column()
  encounter_id!: number;

  @ManyToOne(() => Encounter)
  @JoinColumn({ name: 'encounter_id' })
  encounter!: Encounter;

  @Column()
  modality!: string;

  @Column()
  study_instance_uid!: string;

  @Column()
  series_instance_uid!: string;

  @Column()
  dicom_store_path!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
