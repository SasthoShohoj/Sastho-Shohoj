# SasthoShohoj (স্বাস্থ্য সহজ) — Medical Document Portal

A minimal aesthetic medical document processing portal built with **Vanilla JavaScript, HTML5, and CSS3** on the frontend, powered by a **Python (Flask + EasyOCR + PyMuPDF)** backend.

---

## Architecture Overview

```
modules/medical-records-and-ehr/
├── index.html                 # Module page — uses the shared EasyHealth header
├── css/
│   └── style.css              # Medical teal/mint palette, animations, responsive design
├── js/
│   └── app.js                 # Vanilla JS: DOM manipulation, health check, drag-and-drop, API requests
├── backend/
│   ├── app.py                 # Flask REST API + static server (serves the repo root & /api endpoints)
│   ├── medical_validator.py   # Multi-stage validation: visual check (anime/photos) & text classifier
│   ├── data_extractor.py      # OCR-resilient field extractor (Patient name, age, sex, doctor, labs)
│   ├── ocr_processor.py       # PyMuPDF PDF parser + Pillow preprocessing + EasyOCR engine
│   ├── requirements.txt       # Python dependencies
│   ├── start_backend.bat      # 1-click Windows starter script
│   └── README.md              # Backend documentation
└── assets/                    # Sample documents used for manual testing
```

Shared styles, tokens and scripts (`css/tokens.css`, `css/landing.css`, `js/theme.js`,
`js/i18n.js`, `js/header.js`) live at the repository root and are loaded with `../../`
paths, so the module must be served from the repo root (see below).

---

## Features

1. **Medical Teal/Mint Visual Design**: Clean medical aesthetics with custom typography, SVG icons, and responsive layouts.
2. **Two Functional Tabs**:
   * **Upload Document**: Drag-and-drop & file picker supporting PDFs and all common image formats (JPG, PNG, TIFF, BMP, WebP) with live image preview.
   * **Medical Reports**: Dedicated tab with access placeholder.
3. **Multi-Stage Medical Validation**:
   * **Stage 1 (Pre-OCR Visual Inspection)**: Instantly detects and rejects colorful anime wallpapers, digital art, gaming screenshots, and selfies before OCR.
   * **Stage 2 (Pre-OCR Digital PDF Check)**: Fast text check for digital non-medical documents (commercial invoices, grocery bills, university certificates).
   * **Stage 3 (Semantic Medical Verification)**: Classifies documents (MRI, CT, Ultrasonography, CBC, Lab reports, Prescriptions) and stops extraction if non-medical.
4. **Structured Data Extraction**:
   * Patient Name, Age, Sex, Test Date, Facility, Doctor / Consultant.
   * Findings & Radiologist observations.
   * Disease Summary & Clinical diagnosis.
   * Tabular Lab Parameters with values, units, and reference ranges.
   * Collapsible raw OCR text inspection for prototype debugging.
5. **Real-Time Backend Status Monitor**:
   * Top-right indicator automatically polling `/api/health` every 8s (**ONLINE** in green pulse / **OFFLINE** in red).
   * Interactive popover with 3-step setup guide and a "Retry now" button.

---

## Running the Application

### 1. Start the Backend
```bash
cd modules/medical-records-and-ehr/backend
pip install -r requirements.txt
python app.py
```
*(Or double-click `backend/start_backend.bat` on Windows)*

The backend will start at **http://localhost:5001** and serves the whole repository as
static root, so both the hub (`/`) and this module
(`/modules/medical-records-and-ehr/index.html`) load with all shared assets intact.

### 2. Open the Frontend
You have two convenient options:
* **Option A (recommended)**: Navigate directly to
  **http://localhost:5001/modules/medical-records-and-ehr/index.html** (or
  **http://localhost:5001/records**, which redirects here).
* **Option B**: Serve the repository root with VS Code Live Server
  (`http://127.0.0.1:5500/modules/medical-records-and-ehr/index.html`). CORS is enabled for
  `/api/*`, so the page connects to the backend on port 5001 either way.

> Opening `index.html` directly from the filesystem (`file://`) is not supported because the
> shared `../../css` / `../../js` assets need an HTTP server.
