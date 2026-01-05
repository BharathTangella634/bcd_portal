import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Encounter } from './Encounter';
import { User } from './User';

@Entity('file_metadata')
export class FileMetadata {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  encounter_id!: number;

  @ManyToOne(() => Encounter)
  @JoinColumn({ name: 'encounter_id' })
  encounter!: Encounter;

  @Column()
  uploaded_by_user_id!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by_user_id' })
  uploaded_by!: User;

  @Column()
  type!: string; // report, image, video, other

  @Column()
  storage_url!: string;

  @Column()
  mime_type!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
