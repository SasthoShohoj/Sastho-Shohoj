# Project Progress & Development Checklist

Track implementation progress for EasyHealth / Sastho-Shohoj. Check off items with `- [x]` as each step is completed and deployed.

---

### Phase 1: Core Platform & Directory Setup

- [ ] **Repository & Database Scaffolding**
  - [ ] Initialize project monorepo/folder structure (`client`, `server`, `shared`)
  - [ ] Configure database connection (PostgreSQL / SQLite)
  - [ ] Set up database schema migrations and seed scripts
- [ ] **Authentication & Roles**
  - [ ] Implement user authentication (JWT / sessions)
  - [ ] Implement role-based authorization (`Patient`, `Doctor`, `Hospital Admin`, `Platform Admin`)
  - [ ] Build patient registration and profile onboarding flow
- [ ] **Healthcare Directory & Discovery**
  - [ ] Database schema for healthcare facilities (hospitals, clinics, diagnostic centers, pharmacies)
  - [ ] Database schema for doctors (qualifications, specialties, BMDC registration, chamber affiliations)
  - [ ] Map integration (Google Maps / OpenStreetMap) for address selection and coordinate storage
  - [ ] Location-aware radius search to find doctors and facilities nearby
  - [ ] Multi-filter search (by name, specialty, location, fee, availability)

---

### Phase 2: Appointment Management

- [ ] **Booking Engine & Conflict Prevention**
  - [ ] Define appointment state machine (`Pending`, `Under Review`, `Confirmed`, `Rescheduled`, `Cancelled`, `Completed`, `Rejected`)
  - [ ] Doctor schedule and chamber time-slot configuration
  - [ ] Concurrency/collision prevention logic to prevent double booking of time slots
- [ ] **Patient Booking Workflow**
  - [ ] Doctor profile view with consultation fees and chamber time slots
  - [ ] Appointment request submission modal (date, time slot, initial complaints)
  - [ ] Patient dashboard to view and track submitted appointment requests
  - [ ] Patient request workflow for rescheduling and cancellation
- [ ] **Hospital & Clinic Admin Portal**
  - [ ] Admin dashboard showing live pending requests
  - [ ] Admin triage controls (confirm, propose alternative time, reject with reason)
  - [ ] Admin approval workflow for rescheduling and cancellations
  - [ ] Phone-based appointment creation for walk-in/call-in patients (with patient lookup/registration)

---

### Phase 3: Doctor Portal

- [ ] **Doctor Workspace**
  - [ ] Doctor login and dashboard
  - [ ] Today's consultation agenda and upcoming appointment queue
  - [ ] View patient history and documents shared for the consultation
- [ ] **Consultation & Prescription System**
  - [ ] Mark appointment as completed
  - [ ] Record consultation notes and diagnosis
  - [ ] Digital prescription generator (medicines, dosage, duration, instructions)
  - [ ] Order/recommend diagnostic tests
  - [ ] Automatically attach prescription and visit notes to the patient's medical history

---

### Phase 4: Patient Medical Records (EHR)

- [ ] **Medical History Feed**
  - [ ] Chronological medical timeline for patients (past visits, prescriptions, reports)
  - [ ] Diagnostic report upload interface (PDFs, images) with metadata (test name, date, lab)
  - [ ] Private file storage integration with secure, short-lived download links
- [ ] **Privacy & Consent Management**
  - [ ] Personal health card (blood group, allergies, chronic conditions, emergency contacts)
  - [ ] Patient consent controls (granting a specific doctor temporary access to records)
  - [ ] Access logs for sensitive medical document views

---

### Phase 5: Integrated Communication & Notifications

- [ ] **Notification System**
  - [ ] In-app notification center (status changes, upcoming visit reminders)
  - [ ] SMS gateway integration for Bangladesh (booking confirmations, schedule changes, OTPs)
  - [ ] Email notifications for appointment details and receipts
- [ ] **Automated Reminders**
  - [ ] Automated reminder alerts (24 hours and 2 hours before scheduled consultation)
  - [ ] Notification delivery status logging and retry handling

---

### Phase 6: Emergency Assistance

- [ ] **Emergency Directory**
  - [ ] National Emergency Services (**999**) direct-dial banner
  - [ ] Location-based emergency room and urgent care hospital finder
  - [ ] Verified ambulance provider directory with direct call contacts
- [ ] **Emergency Dispatch Support**
  - [ ] Emergency location sharing payload for quick assistance
  - [ ] Urgent consultation triage flow for partnering emergency desks

---

### Phase 7: AI Navigation & Multi-Platform Expansion

- [ ] **AI-Assisted Discovery**
  - [ ] Natural-language search in both Bangla and English
  - [ ] LLM-assisted specialty recommendation based on symptoms
  - [ ] Strict safety guardrails (non-diagnostic disclaimers, urgent emergency redirection)
- [ ] **Mobile & Production Readiness**
  - [ ] Cross-platform mobile app (React Native or Flutter)
  - [ ] Offline caching for prescriptions and emergency contacts
  - [ ] Security audits, rate-limiting, and database indexing optimizations

---

## Modular Facility & Feature Development Guide

EasyHealth is organized as a decoupled, multi-contributor web platform. Multiple developers can work concurrently on separate features without git conflicts by following this flow:

### 1. Isolated Feature Subdirectories
Create your dedicated folder at the repository root (e.g. `appointments/`, `records/`, `admin/`) with its own standalone assets:
```
EasyHealth/
├── appointments/
│   ├── index.html
│   ├── appointments.css
│   └── appointments.js
```

### 2. Adhere to Clinical Design Tokens
Link the shared design tokens from `css/tokens.css` to maintain visual consistency:
```html
<link rel="stylesheet" href="../css/tokens.css">
```
- Use soft rounded cards (`14px` radius) and category pills (`border-radius: 9999px`).
- Retain the clean, light-mode palette (`#f8fafc` canvas, `#ffffff` cards).

### 3. Register in `js/modules.config.js`
Add your facility descriptor to `MODULES` in `js/modules.config.js`:
```javascript
{
  id: 'appointments',
  title: { en: 'Doctor Consultations', bn: 'ডাক্তার অ্যাপয়েন্টমেন্ট' },
  subtitle: {
    en: 'Specialist discovery and chamber booking',
    bn: 'বিশেষজ্ঞ চিকিৎসক খুঁজুন ও সময়সূচী বুক করুন'
  },
  icon: 'stethoscope',
  path: 'appointments/index.html',
  status: 'ACTIVE', // change from PLANNED to ACTIVE
  badge: { en: 'Active Beta', bn: 'চালু রয়েছে' },
  badgeType: 'badge-blue',
  team: 'Your Team Name'
}
```
The root landing page (`index.html`) will dynamically render your card and route without modifying the core landing codebase.

