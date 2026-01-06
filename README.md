# Tanuh BCD Website

This repository contains the codebase for the Tanuh BCD website, a platform designed for hospital management and data collection. The project is organized into several key modules, including AI, backend, database, and frontend.

## Project Structure

The repository is organized into the following main directories:

- **AI/**: Contains AI-related source code, datasets, models, and experimentation notebooks.
- **backend/**: Core backend logic, API endpoints, database management, and data validation schemas.
- **database/**: SQL schema definitions, version-controlled migrations, and seed data.
- **frontend/**: React-based frontend application, including reusable components, pages, and assets.
- **old_resources/**: Historical assets and data used as a reference during development.

### Detailed Directory Overview

#### AI
- `data/`: Datasets and data processing scripts.
- `models/`: Trained models and architecture definitions.
- `notebooks/`: Jupyter notebooks for research and testing.
- `src/`: Core AI logic.
- `tests/`: Unit and integration tests for AI components.

#### backend
- `src/`: Core source code.
  - `api/`: API endpoints and routing logic.
  - `core/`: Core configurations and logic.
  - `db/`: Database session and connection management.
  - `models/`: Backend data models (ORM).
  - `schemas/`: Pydantic models for data validation.
- `migrations/`: Database schema migration scripts.
- `tests/`: Backend test suite.

#### database
- `schemas/`: SQL definitions for the database structure.
- `migrations/`: Version-controlled database change logs.
- `seeds/`: Initial data for development and testing environments.

#### frontend
- `public/`: Static files (index.html, etc.).
- `src/`: React source code.
  - `assets/`: Images (logos), styles, and localized resources (locales).
  - `components/`: Reusable UI components (e.g., Footer).
  - `pages/`: Individual view components (e.g., LoginPage).
  - `hooks/`, `services/`, `utils/`: Frontend logic and helper functions.
- `tests/`: Component and end-to-end tests.

## Key Features

### Frontend
- **Login Page**: A specialized login screen featuring:
  - Header with Tanuh and IISc logos.
  - Form fields for Hospital Name, Role selection, Email, and Password.
  - "Forgot password / Reset password" functionality.
- **Footer**: A responsive footer with clickable social media icons (Website, LinkedIn, Twitter, YouTube) linked to URLs defined in environment variables.
- **Localization**: Supports multiple languages (Bengali, English, Gujarati, Hindi, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu) with dedicated JSON files for consent forms, questionnaires, and thank-you messages.

## Configuration

The project uses a common `.env` file located in the root directory to manage environment variables across all modules.

The frontend is configured to automatically copy this file to the `frontend/` directory during `npm start` or `npm run build` using `prestart` and `prebuild` hooks. This ensures that the environment variables are always in sync with the root configuration without requiring manual copying or symbolic links.

### Environment Variables
The following variables are used by the frontend:
- `REACT_APP_WEBSITE_URL`
- `REACT_APP_LINKEDIN_URL`
- `REACT_APP_TWITTER_URL`
- `REACT_APP_YOUTUBE_URL`

## Setup and Development

### Prerequisites
- Node.js (for frontend)
- Python (for backend/AI)

### Getting Started
1. Clone the repository.
2. Configure the `.env` file in the root directory with the necessary URLs and credentials.
3. To start the frontend application, run the provided starter script from the root directory:
   ```bash
   ./fe_starter.sh
   ```
4. Follow the specific setup instructions in each module's directory (where available).
