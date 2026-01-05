-- SQL Migration Script for Tanuh BCD Database Schema

-- Enumerated Types
CREATE TYPE user_role_enum AS ENUM ('clinic', 'doctor', 'technologist','admin');
CREATE TYPE encounter_status_enum AS ENUM ('draft', 'submitted', 'validated');

-- 1. Hospitals Table
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- MRN or hospital ID
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    sex VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Questionnaires Table
CREATE TABLE questionnaires (
    id SERIAL PRIMARY KEY,
    hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE, -- Nullable for global questionnaires
    code VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Questions Table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    type VARCHAR(255) NOT NULL, -- text, single-choice, multi-choice, numeric
    code VARCHAR(255) NOT NULL
);

-- 6. Question Translations Table
CREATE TABLE question_translations (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    text TEXT NOT NULL,
    help_text TEXT
);

-- 7. Question Options Table
CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL,
    value VARCHAR(255) NOT NULL
);

-- 8. Question Option Translations Table
CREATE TABLE question_option_translations (
    id SERIAL PRIMARY KEY,
    option_id INTEGER NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    label VARCHAR(255) NOT NULL
);

-- 9. Encounters Table
CREATE TABLE encounters (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status encounter_status_enum DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Responses Table
CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    value_json JSONB NOT NULL,
    created_by_user_id INTEGER NOT NULL REFERENCES users(id),
    updated_by_user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Clinical Notes Table
CREATE TABLE clinical_notes (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. File Metadata Table
CREATE TABLE file_metadata (
    id SERIAL PRIMARY KEY,
    encounter_id INTEGER NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    uploaded_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL, -- report, image, video, other
    storage_url TEXT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Imaging Studies Table
CREATE TABLE imaging_studies (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id INTEGER NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    modality VARCHAR(255) NOT NULL,
    study_instance_uid VARCHAR(255) NOT NULL,
    series_instance_uid VARCHAR(255) NOT NULL,
    dicom_store_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
