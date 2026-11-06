# Contributing to EasyHealth (Sastho-Shohoj)

Welcome to **EasyHealth** (upstream: [Sastho-Shohoj](https://github.com/SasthoShohoj/Sastho-Shohoj)). We are building an integrated healthcare ecosystem for Bangladesh designed to make healthcare discovery, doctor appointments, emergency assistance, and digital health records accessible, fast, and organized.

This document outlines our contribution guidelines, technical standards, and a phased **Development Plan** with tick boxes (`- [ ]`) to track implementation progress.

---

## Table of Contents

1. [Code of Conduct & Core Principles](#code-of-conduct--core-principles)
2. [Contribution Workflow](#contribution-workflow)
3. [Repository Setup & Local Development](#repository-setup--local-development)
4. [Master Development Plan & Checklist](#master-development-plan--checklist)
   - [Phase 1: Project Scaffolding & Core Directory](#phase-1-project-scaffolding--core-directory)
   - [Phase 2: Centralized Appointment Management](#phase-2-centralized-appointment-management)
   - [Phase 3: Doctor Portal & Clinical Workflow](#phase-3-doctor-portal--clinical-workflow)
   - [Phase 4: Electronic Health Records (EHR) & Patient Portal](#phase-4-electronic-health-records-ehr--patient-portal)
   - [Phase 5: Notification & Communication Hub](#phase-5-notification--communication-hub)
   - [Phase 6: Emergency Assistance & Resource Discovery](#phase-6-emergency-assistance--resource-discovery)
   - [Phase 7: AI Healthcare Navigation & Multi-Platform Expansion](#phase-7-ai-healthcare-navigation--multi-platform-expansion)
5. [Security, Privacy, and Data Integrity Standards](#security-privacy-and-data-integrity-standards)
6. [Pull Request (PR) Checklist](#pull-request-pr-checklist)

---

## Code of Conduct & Core Principles

- **Zero Mock / Synthetic Data in Production:** Never inject speculative constants, fake doctor profiles, or simulated facility statuses into production databases.
- **Privacy First (HIPAA / GDPR Aligned):** Health and patient data are strictly confidential. Personal Health Information (PHI) must never be logged, cached in plain text, or exposed to unauthorized roles.
- **AI Safety Boundaries:** The integrated AI assistant serves purely for **navigation and specialty discovery** (in Bangla and English). It must never diagnose medical conditions, suggest treatments, or prescribe medication. Urgent symptoms must immediately route to emergency services.
- **English-Only PRs & Commits:** Keep all pull request titles, commit messages, and code comments in clean, professional English for universal maintainability.

---

## Contribution Workflow

Follow these steps when contributing to the project:

- [ ] **Step 1: Synchronize with Upstream**
  ```bash
  git remote add upstream https://github.com/SasthoShohoj/Sastho-Shohoj.git
  git fetch upstream
  git checkout main
  git merge --ff-only upstream/main
  ```
- [ ] **Step 2: Create a Feature Branch**
  - Use conventional naming: `feat/<feature-name>`, `fix/<bug-fix>`, `refactor/<module>`, `docs/<topic>`.
  ```bash
  git checkout -b feat/appointment-scheduling
  ```
- [ ] **Step 3: Implement & Test Changes**
  - Write clean, modular code with functional comments.
  - Implement unit and integration tests where applicable.
  - Avoid committing scratch scripts, temporary dumps, or environment credentials.
- [ ] **Step 4: Commit Using Conventional Commits**
  - Examples:
    - `feat(auth): implement role-based access control middleware`
    - `fix(booking): prevent concurrent slot reservation collision`
    - `docs(contributing): add development roadmap tick boxes`
- [ ] **Step 5: Push & Open a Pull Request**
  - Push your branch to your fork (`origin`).
  - Open a pull request against the `main` branch.
  - Complete the [PR Checklist](#pull-request-pr-checklist).

---

## Repository Setup & Local Development

- [ ] **Prerequisites**
  - Node.js (v18.x or v20.x LTS)
  - PostgreSQL 15+ (or SQLite 3 for early prototyping)
  - Git
- [ ] **Environment Configuration**
  ```bash
  cp .env.example .env
  ```
  Fill in the necessary environment parameters:
  ```env
  PORT=5000
  NODE_ENV=development
  DATABASE_URL=postgresql://user:password@localhost:5432/easyhealth
  JWT_SECRET=your_jwt_secret_key
  MAPS_API_KEY=your_maps_api_key
  SMS_GATEWAY_API_KEY=your_sms_gateway_key
  AI_API_KEY=your_gemini_or_llm_key
  ```
- [ ] **Install Dependencies**
  ```bash
  npm install
  ```
- [ ] **Run Migrations & Seeds**
  ```bash
  npm run db:migrate
  npm run db:seed
  ```
- [ ] **Start Development Server**
  ```bash
  npm run dev
  ```

---

## Master Development Plan & Checklist

Mark off tasks with `[x]` as they are completed and merged.

### Phase 1: Project Scaffolding & Core Directory

- [ ] **Architecture & Infrastructure**
  - [ ] Initialize monorepo or modular folder structure (`/server`, `/client`, `/shared`).
  - [ ] Set up code formatting and linting (ESLint, Prettier).
  - [ ] Configure database ORM / query builder (e.g., Prisma, Drizzle, or Knex) with PostgreSQL & SQLite support.
  - [ ] Set up automated database migration scripts.
- [ ] **Authentication & Access Control**
  - [ ] Implement user schema supporting multiple roles (`PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `PLATFORM_ADMIN`).
  - [ ] Secure password hashing (bcrypt / argon2) and JWT / session management.
  - [ ] Role-Based Access Control (RBAC) middleware for protected endpoints.
  - [ ] Patient registration and onboarding workflow (phone number, email, DOB, basic medical vitals).
- [ ] **Healthcare Directory & Discovery**
  - [ ] Schema and CRUD APIs for healthcare facilities (hospitals, clinics, diagnostic centers, pharmacies).
  - [ ] Schema and CRUD APIs for doctors (BMDC registration, qualifications, specialties, chamber affiliations).
  - [ ] Map integration (Google Maps / OpenStreetMap) with address autocomplete and coordinate storage.
  - [ ] Geolocation query engine: search facilities and doctors by proximity, radius, and division/district.
  - [ ] Search & filtering engine (by doctor name, specialty, facility, fee, and availability).

---

### Phase 2: Centralized Appointment Management

- [ ] **Data Model & Scheduling Logic**
  - [ ] Appointment state machine implementation (`PENDING_REVIEW`, `UNDER_REVIEW`, `CONFIRMED`, `RESCHEDULE_REQUESTED`, `CANCELLED`, `REJECTED`, `COMPLETED`).
  - [ ] Doctor schedule and chamber availability slot modeling.
  - [ ] Atomic booking engine with transaction locking to eliminate double bookings and race conditions.
- [ ] **Patient Booking Interface**
  - [ ] Doctor profile view with chamber schedules, consultation fees, and available time slots.
  - [ ] Appointment request submission modal (selecting chamber, preferred date/time, chief complaints).
  - [ ] Patient appointment tracking dashboard with live status indicators.
- [ ] **Hospital & Clinic Admin Portal**
  - [ ] Clinic admin dashboard displaying real-time incoming appointment queue.
  - [ ] Triage actions: Confirm, propose alternative time, or reject with a structured reason.
  - [ ] Rescheduling and cancellation request handling workflow.
  - [ ] Phone-based appointment creation module for walk-in or phone-call patients with existing patient lookup.

---

### Phase 3: Doctor Portal & Clinical Workflow

- [ ] **Doctor Workspace**
  - [ ] Doctor authentication and profile management (chambers, fees, vacation/leave schedule).
  - [ ] Daily agenda and consultation queue view.
  - [ ] Authorized view of patient medical background and consultation history prior to visit.
- [ ] **Consultation & Prescription System**
  - [ ] Consultation completion workflow with clinical observation notes.
  - [ ] Digital prescription generator (medication name, dosage, frequency, duration, special instructions).
  - [ ] Diagnostic investigation / lab test requisition generator.
  - [ ] Automated record linking to the patient's centralized medical timeline.

---

### Phase 4: Electronic Health Records (EHR) & Patient Portal

- [ ] **Medical Timeline & Document Storage**
  - [ ] Chronological medical history feed for patients (consultations, prescriptions, reports).
  - [ ] Private cloud storage integration (S3 / Cloud Storage / Supabase) with signed URLs for medical documents.
  - [ ] Diagnostic report upload interface for patients (PDF, images) with metadata tagging (test type, date, lab).
- [ ] **Patient Privacy & Consent Matrix**
  - [ ] Patient personal health profile (blood group, known allergies, chronic illnesses, emergency contacts).
  - [ ] Granular permission system: patient explicitly authorizes a doctor to view past records for an active consultation.
  - [ ] Audit log engine recording all medical record access and downloads.

---

### Phase 5: Notification & Communication Hub

- [ ] **Multi-Channel Notification Architecture**
  - [ ] Centralized notification dispatcher with support for in-app, SMS, and email.
  - [ ] In-app notification bell and notification center for web and mobile.
- [ ] **Provider Integrations**
  - [ ] SMS gateway integration for Bangladesh (transactional appointment confirmations, OTPs, schedule changes).
  - [ ] Email service integration (Nodemailer / Resend / SendGrid) for appointment summaries and receipts.
  - [ ] Automated scheduled reminders (cron jobs triggering reminders 24 hours and 2 hours before appointments).
  - [ ] Notification delivery status logs and retry mechanism.

---

### Phase 6: Emergency Assistance & Resource Discovery

- [ ] **Emergency Directory**
  - [ ] Prominent quick-dial UI for National Emergency Services (**999**).
  - [ ] Geolocation-based discovery of 24/7 emergency rooms and trauma centers.
  - [ ] Direct-dial ambulance provider directory with service radius and contact details.
- [ ] **Emergency Request Coordination**
  - [ ] Emergency location sharing payload generator for rapid patient dispatch.
  - [ ] Urgent consultation request triage module for partner hospital emergency desks.

---

### Phase 7: AI Healthcare Navigation & Multi-Platform Expansion

- [ ] **AI-Assisted Navigation**
  - [ ] Bilingual (Bangla & English) natural language search input.
  - [ ] Symptom-to-specialty mapper using Gemini / LLM API with strict prompt engineering.
  - [ ] Safety guardrails: non-diagnostic disclaimers and immediate emergency redirections for severe symptoms.
- [ ] **Mobile Application**
  - [ ] Cross-platform mobile app (React Native or Flutter) for iOS and Android.
  - [ ] Offline caching for downloaded prescriptions, emergency contacts, and confirmed appointments.
  - [ ] Push notification service integration (FCM / APNs).
- [ ] **Platform Hardening & Scale**
  - [ ] Automated CI/CD pipeline (GitHub Actions) for linting, testing, and security scanning.
  - [ ] OWASP Top 10 security audit (SQL injection, XSS, CSRF, rate-limiting on sensitive endpoints).
  - [ ] Database indexing on geolocation coordinates, doctor specialties, and appointment time slots.

---

## Security, Privacy, and Data Integrity Standards

1. **Parameter Sanitization:** Always use parameterized SQL queries or ORM abstractions. Never concatenate raw strings into SQL queries.
2. **Access Control Checks:** Verify role and ownership on every protected backend route. Never trust client-provided user IDs.
3. **Sensitive File Protection:** Medical files must never be publicly readable. All asset delivery must use short-lived pre-signed URLs (maximum 15 minutes validity).
4. **Credential Hygiene:** Never commit `.env`, private keys, database credentials, or test customer identities.

---

## Pull Request (PR) Checklist

Before submitting a PR for review, verify:

- [ ] Code follows project formatting and passes all lint checks (`npm run lint`).
- [ ] All new and existing unit/integration tests pass (`npm test`).
- [ ] Database migrations are backwards-compatible and tested on both fresh and populated databases.
- [ ] No API keys, credentials, or private health data are committed.
- [ ] PR title and description are written in clear, concise English following conventional commit patterns.
- [ ] Corresponding tasks in the [Master Development Plan](#master-development-plan--checklist) have been updated.
