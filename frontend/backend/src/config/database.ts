import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { Hospital } from '../entities/Hospital';
import { User } from '../entities/User';
import { Patient } from '../entities/Patient';
import { Questionnaire } from '../entities/Questionnaire';
import { Question } from '../entities/Question';
import { QuestionTranslation } from '../entities/QuestionTranslation';
import { QuestionOption } from '../entities/QuestionOption';
import { QuestionOptionTranslation } from '../entities/QuestionOptionTranslation';
import { Encounter } from '../entities/Encounter';
import { Response } from '../entities/Response';
import { ClinicalNote } from '../entities/ClinicalNote';
import { FileMetadata } from '../entities/FileMetadata';
import { ImagingStudy } from '../entities/ImagingStudy';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Hospital,
    User,
    Patient,
    Questionnaire,
    Question,
    QuestionTranslation,
    QuestionOption,
    QuestionOptionTranslation,
    Encounter,
    Response,
    ClinicalNote,
    FileMetadata,
    ImagingStudy,
  ],
  migrations: [],
  subscribers: [],
});
