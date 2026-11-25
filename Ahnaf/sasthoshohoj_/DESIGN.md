# SasthoShohoj (স্বাস্থ্য সহজ) — System & UI Design Document

## 1. Overview

**SasthoShohoj** is a medical document management and OCR extraction portal designed with a calm, clinical **teal/mint** aesthetic. It enables users to upload **prescriptions** (instant storage without OCR) and **medical test reports** (PDFs or scanned/photographed images such as MRI, CT, Ultrasonography, CBC, and Lab reports), automatically validate medical authenticity, extract structured clinical metadata, and browse/inspect archived records in a categorized, split-view interface.

### Core Design Principles
- **Zero-Build Frontend**: Pure **Vanilla JavaScript (ES6+), HTML5, and CSS3** with inline SVG icons—no bundler or framework runtime overhead.
- **Fast-Path & Fail-Fast Validation**: Rejects non-medical images (wallpapers, artwork, photos) and non-medical digital PDFs (resumes, invoices, certificates) in milliseconds before invoking heavy CPU-based EasyOCR.
- **Tactile & Accessible UI**: Sticky lifted glassmorphic navigation, full Light/Dark mode parity, hierarchical date organization, and side-by-side original document inspection.

---

## 2. Project Architecture & Directory Structure

```text
sasthoshohoj_/
├── index.html                   # Single-page semantic HTML5 shell, inline SVGs, theme bootstrapper
├── css/
│   └── style.css                # Design tokens, glassmorphism, animations, light & dark themes
├── js/
│   └── app.js                   # State management, health polling, upload flows, filtering & modal
├── backend/
│   ├── app.py                   # Flask REST API + static frontend host (port 5001)
│   ├── ocr_processor.py         # PyMuPDF digital PDF fast-path + image preprocessing + EasyOCR
│   ├── medical_validator.py     # Pre-OCR visual classifier + semantic medical/non-medical scorer
│   ├── data_extractor.py        # OCR-resilient regex extractors for demographics, findings & labs
│   ├── storage.py               # Local JSON metadata store + uploaded file persistence
│   ├── requirements.txt         # Python dependencies (Flask, EasyOCR, PyMuPDF, Pillow, NumPy)
│   ├── start_backend.bat        # Windows one-click server launcher
│   ├── uploads/                 # Stored original PDFs and images (created at runtime)
│   └── data/
│       └── records.json         # Persisted metadata records (created at runtime)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── DESIGN.md                    # This document
└── README.md                    # Quick-start guide
```

---

## 3. Visual Design System & UI Architecture

### 3.1 Color Palette & Theming (`css/style.css`)
The interface supports **Light Mode** (`:root`) and **Dark Mode** (`[data-theme="dark"]`), persisted in `localStorage` under `sasthoshohoj-theme` and initialized before first paint via an inline `<script>` in `index.html`.

| Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--mint-bg` / `--bg-page` | `#f4fdfb` / radial mint tint | `#061012` + top radial teal glow | Page canvas |
| `--white` | `#ffffff` | `#0f2225` | Cards, inputs, surfaces |
| `--glass-bg` | `rgba(240, 253, 250, 0.72)` | `rgba(12, 30, 33, 0.74)` | Sticky lifted header |
| `--glass-border` | `rgba(20, 184, 166, 0.22)` | `rgba(45, 212, 191, 0.18)` | Header & modal borders |
| `--teal-500` | `#14b8a6` | `#14b8a6` (`#2dd4bf` active fills) | Primary CTAs, active indicators |
| `--teal-600` / `--teal-700` | `#0d9488` / `#0f766e` | `#2dd4bf` / `#5eead4` | Links, headings, badges |
| `--text` / `--gray-800` | `#374151` / `#1f2937` | `#dceeed` / `#f0faf9` | Body & primary headings |
| `--green-600` | `#16a34a` | `#4ade80` | Online status, prescription badges |
| `--red-500` / `--red-600` | `#ef4444` / `#dc2626` | `#f87171` / `#fca5a5` | Offline status, rejection banners |
| `--amber-50` / `--amber-800` | `#fffbeb` / `#92400e` | `rgba(245,158,11,0.14)` / `#fde68a` | Clinical diagnosis callout |

### 3.2 Sticky Lifted Glassmorphic Header
- `.navbar` uses `position: sticky; top: 14px; z-index: 60;` with `max-width: 980px`, `border-radius: 16px`, and `backdrop-filter: blur(18px) saturate(170%)`.
- Houses the **SasthoShohoj** brand mark on the left and `.navbar-actions` on the right:
  1. **Theme Toggle (`#themeToggleBtn`)**: Sun/Moon SVG switcher.
  2. **Backend Status Widget (`#statusBtn`)**: Polls `GET /api/health` every 8 seconds. Shows `Backend Online` (pulsing green dot) or `Backend Offline` (red dot + chevron). Clicking when offline opens `#offlineGuide` with a 3-step startup checklist and **Retry now** button.

### 3.3 Tab Views & Micro-Interactions
- **Main Tab Bar (`.tab-bar`)**: Centered segmented pill switcher (`Upload Document` | `Medical Reports`). Active tab uses a teal fill with elevation shadow; switching triggers `@keyframes tabFadeSlide` (`10px` upward fade).
- **Sub-Tab Bar (`.subtab-bar`)**: Inside Medical Reports, switches between `Test Reports` and `Prescriptions`, each displaying live count badges (`#countTestReports`, `#countPrescriptions`).
- **Hover & Selection Animations**:
  - `.upload-mode-card`: Lifts `translateY(-3px)` on hover; active selection scales the mode icon (`scale(1.06)`) with a teal ring.
  - `.upload-card`: Drop zone floats the upload SVG (`@keyframes iconFloat`) on hover/drag.
  - `.report-card`: Staggered `@keyframes cardFadeUp` entrance and `translateY(-4px)` elevation on hover.
  - `.modal-dialog`: Smooth `@keyframes modalScaleIn` entrance.

---

## 4. Frontend Flows (`js/app.js`)

### 4.1 Upload Document Flow (`#tabUpload`)
Users select one of two modes via `.upload-mode-card`:
1. **Medical Test Report Upload (`test_report`)**:
   - Accepts `PDF, JPG, PNG, TIFF, BMP, WebP` (max `20 MB`).
   - Shows live image preview (`URL.createObjectURL`) for image files.
   - Submits `FormData` to `POST /api/process` with a `60s` `AbortController` timeout and live elapsed-seconds counter.
   - Displays either `#rejectionBanner` (if `is_medical === false`) or `#resultCard` (structured patient info, file metadata, findings, diagnosis, lab parameters table, collapsible raw OCR debug text) and automatically saves valid reports.
2. **Prescription Upload (`prescription`)**:
   - Reveals `#prescriptionForm` with optional metadata fields: `Title / Reason`, `Date`, `Doctor Name`, `Hospital / Clinic`, `Patient Name`, and `Notes`.
   - Submits `FormData` directly to `POST /api/prescriptions`—**bypassing EasyOCR completely**—for instant persistence.

### 4.2 Medical Reports Browser (`#tabReports`)
- Fetches all records via `GET /api/records` and filters client-side by active sub-tab (`test_report` or `prescription`).
- **Search & Filters**:
  - Live keyword search across `title`, `document_type`, `doctor`, `facility`, `patient_name`, `findings`, `disease_summary`, `notes`, `original_filename`, and `display_date`.
  - Dynamic dropdowns populated from the active sub-tab's records: **Hospital / Clinic**, **Doctor**, **Month**, plus **From / To Date** inputs, **Sort Order** (`Newest First` / `Oldest First`, default `desc`), and **Reset**.
- **Hierarchical Date Categorization**:
  1. **Month Group** (`formatMonthLabel`, e.g., `November 2026`).
  2. **Date Range Sub-group** (`getDateRangeBucket`), bucketing days of the month into 4 ranges:
     - Days `1–7` (e.g., `Nov 01 – Nov 07`)
     - Days `8–14` (e.g., `Nov 08 – Nov 14`)
     - Days `15–21` (e.g., `Nov 15 – Nov 21`)
     - Days `22–end` (e.g., `Nov 22 – Nov 30`)
- **Report Cards**: Display document/test pill, date, title, Doctor, Hospital/Clinic, **Show Details** button, and Delete button.

### 4.3 Split-View Details Dialog (`#detailModal`)
Clicking **Show Details** opens a `94vw` (max `1240px`) × `88vh` two-column modal:
- **Left Pane (`.modal-left-pane`)**: Renders the original uploaded file from `GET /api/files/<stored_filename>` using `<img>` for images or an embedded `<iframe>` for PDFs, plus an **Open in new tab ↗** link.
- **Right Pane (`.modal-right-pane`)**: Scrollable clinical & patient metadata, file metadata, prescription notes, findings, diagnosis summary, lab parameters table, and raw OCR text.

---

## 5. Backend Processing & Data Pipeline (`backend/`)

```text
Upload (POST /api/process)
  │
  ├─► [PDF] PyMuPDF extract_digital_pdf_text() (<= 4 pages, >= 80 chars)
  │     ├─► Non-medical (Resume / Invoice / etc.) ──► Reject in ~2-5ms
  │     └─► Valid Medical Digital PDF ──► extract_medical_data() ──► Save & Return
  │
  ├─► [Image] validate_visual_image() (200x200 HSV saturation & paper check)
  │     └─► High-saturation art / anime wallpaper / photo ──► Reject in <5ms
  │
  └─► [Scanned PDF / Document Image] process_file()
        ├─► Resize max dimension to 1500px (or 150 DPI PDF render, max 3 pages)
        ├─► EasyOCR (en, CPU, mag_ratio=1.0, length-weighted confidence)
        └─► validate_medical_document(raw_text)
              ├─► False ──► Return rejection_reason (skip extraction)
              └─► True  ──► extract_medical_data() ──► add_record() ──► Return JSON
```

### Key Backend Modules
- **`ocr_processor.py`**:
  - `extract_digital_pdf_text()`: Instant native text extraction via `pymupdf` (`fitz`).
  - `preprocess_image()`: Caps max image dimension at `1500px` (upscales `<800px` to `1000px`), converts to greyscale, applies `1.3x` contrast boost.
  - `ocr_image()`: Runs `easyocr.Reader(['en'], gpu=False)` with `canvas_size=1500, mag_ratio=1.0` and computes **character-length weighted confidence** so short punctuation boxes do not skew reading accuracy.
- **`medical_validator.py`**:
  - `validate_visual_image()`: Allows grayscale scans (`max_channel_diff < 0.05`) and paper documents; rejects colorful illustrations/wallpapers (`vibrant_pixels > 0.35 and paper_pixels < 0.25`) and natural photos (`mean_sat > 0.40 and paper_pixels < 0.18`).
  - `validate_medical_document()`: Scores `MEDICAL_ANCHORS`, `MEDICAL_SUPPORT`, `RESUME_TERMS`, and `REJECT_TERMS`, then classifies into `MRI Report`, `CT Scan Report`, `Ultrasonography Report`, `X-Ray Report`, `Blood Test / CBC`, `Prescription`, `Discharge Summary`, etc.
- **`data_extractor.py`**:
  - OCR-resilient regex extractors for `patient_name`, `patient_age`, `patient_sex` (supports compound `Age/Sex: 26 Y / Male`), `date` (handles fused `12-Nov2026` and OCR label typos), `facility`, `doctor`, `findings`, `disease_summary`, and `test_results` (normalizes `mgidL`/`Icumm`, supports single-line, multi-line split rows, qualitative values, and imaging `mm`/`cm` measurements).
- **`storage.py`**:
  - Normalizes dates to `YYYY-MM-DD` (`normalize_date_iso`), saves raw files under `backend/uploads/<uuid>_<name>`, and persists records in `backend/data/records.json`.

---

## 6. REST API Reference (`http://localhost:5001`)

| Method | Endpoint | Purpose | Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves `index.html` (static assets served from project root) | `200 text/html` |
| `GET` | `/api/health` | Backend liveness check | `200 { "status": "ok", "service": "SasthoShohoj OCR API" }` |
| `POST` | `/api/process` | Validates & runs OCR/extraction on Test Reports; auto-saves if medical | `200` JSON with `is_medical`, metadata, `test_results`, `saved_record` |
| `POST` | `/api/prescriptions` | Saves prescription file + optional form metadata without OCR | `201 { "success": true, "record": { ... } }` |
| `GET` | `/api/records` | Lists stored records (optional `?category=test_report\|prescription`), sorted by date desc | `200 { "records": [ ... ] }` |
| `DELETE` | `/api/records/<record_id>` | Deletes a record from `records.json` and removes its file from `uploads/` | `200 { "deleted": true }` / `404` |
| `GET` | `/api/files/<filename>` | Serves uploaded PDF or image inline for modal viewing | `200` binary stream |

---

## 7. Prototype Limitations & Future Roadmap
- **Local JSON Storage**: `backend/data/records.json` is suitable for single-user prototyping; migrate to **SQLite / PostgreSQL** with user authentication for multi-user deployment.
- **Regex vs. LLM Extraction**: `data_extractor.py` relies on deterministic regex heuristics; complex unstructured clinical notes can be upgraded to a local/cloud medical LLM parser.
- **OCR Hardware**: EasyOCR currently runs on CPU (`gpu=False`, `torch.set_num_threads(4)`); enabling CUDA GPU acceleration will reduce image OCR latency below 1 second.
