import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Hospital } from './Hospital';

export enum UserRole {
  CLINIC = 'clinic',
  DOCTOR = 'doctor',
  TECHNOLOGIST = 'technologist',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  hospital_id!: number;

  @ManyToOne(() => Hospital, (hospital) => hospital.users)
  @JoinColumn({ name: 'hospital_id' })
  hospital!: Hospital;

  @Column()
  username!: string;

  @Column({ select: false })
  password_hash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
