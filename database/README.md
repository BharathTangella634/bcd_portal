# Database Schema Documentation

This directory contains the SQL scripts and documentation for the Tanuh BCD application's relational database.

## Schema Overview

The database is built on **PostgreSQL** and uses a relational model to manage hospitals, users, patients, and their clinical encounters.

### Tables & Relationships

#### 1. Core Entities
- **`hospitals`**: Stores hospital information. `code` is used for unique identification during login.
- **`users`**: Represents staff members. Linked to `hospitals`. Roles include `admin`, `clinic`, `doctor`, and `technologist`.
- **`patients`**: Stores patient demographic information. Linked to `hospitals`.

#### 2. Questionnaire System
- **`questionnaires`**: Defines a set of questions (e.g., "BREAST_SCREENING"). Can be global or hospital-specific.
- **`questions`**: Individual questions within a questionnaire. Includes `order` and `type` (numeric, text, choice).
- **`question_translations`**: Multi-language support for question text and help text.
- **`question_options`**: Options for single/multi-choice questions.
- **`question_option_translations`**: Multi-language support for option labels.

#### 3. Clinical Data
- **`encounters`**: A clinical visit or session for a patient. Tracks `status` (draft, submitted, validated). Linked to `patient`, `hospital`, and `doctor`.
- **`responses`**: Patient/Clinic answers to questionnaire questions. Linked to `encounter` and `question`. Stores data in `value_json` (JSONB).
- **`clinical_notes`**: Textual notes added by doctors for an encounter.
- **`file_metadata`**: Metadata for uploaded files (reports, images).
- **`imaging_studies`**: References to DICOM imaging studies associated with a patient and encounter.

### Foreign Key Constraints

| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| `users` | `hospital_id` | `hospitals(id)` | CASCADE |
| `patients` | `hospital_id` | `hospitals(id)` | CASCADE |
| `questionnaires` | `hospital_id` | `hospitals(id)` | CASCADE |
| `questions` | `questionnaire_id` | `questionnaires(id)` | CASCADE |
| `question_translations` | `question_id` | `questions(id)` | CASCADE |
| `question_options` | `question_id` | `questions(id)` | CASCADE |
| `question_option_translations` | `option_id` | `question_options(id)` | CASCADE |
| `encounters` | `patient_id` | `patients(id)` | CASCADE |
| `encounters` | `hospital_id` | `hospitals(id)` | CASCADE |
| `encounters` | `doctor_id` | `users(id)` | SET NULL |
| `responses` | `encounter_id` | `encounters(id)` | CASCADE |
| `responses` | `question_id` | `questions(id)` | CASCADE |
| `responses` | `created_by_user_id` | `users(id)` | - |
| `clinical_notes` | `encounter_id` | `encounters(id)` | CASCADE |
| `clinical_notes` | `doctor_id` | `users(id)` | CASCADE |
| `file_metadata` | `encounter_id` | `encounters(id)` | CASCADE |
| `file_metadata` | `uploaded_by_user_id` | `users(id)` | CASCADE |
| `imaging_studies` | `patient_id` | `patients(id)` | CASCADE |
| `imaging_studies` | `encounter_id` | `encounters(id)` | CASCADE |

## Initialization

To initialize the database schema, you can run the provided `schema.sql` script against your PostgreSQL instance:

```bash
psql -U your_user -d your_db -f database/schema.sql
```

*Note: If you are using Docker Compose, the database is automatically initialized if you place scripts in the `docker-entrypoint-initdb.d/` directory, or by the application's ORM (TypeORM) in development mode.*
