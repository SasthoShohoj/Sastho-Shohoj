# SasthoShohoj (স্বাস্থ্য সহজ) — Medical Document Portal

A minimal aesthetic medical document processing portal built with **Vanilla JavaScript, HTML5, and CSS3** on the frontend, powered by a **Python (Flask + EasyOCR + PyMuPDF)** backend.

---

## Architecture Overview

```
sasthoshohoj_/
├── index.html                 # Main single-page interface (Semantic HTML5)
├── css/
│   └── style.css              # Medical teal/mint palette, animations, responsive design
├── js/
│   └── app.js                 # Vanilla JS: DOM manipulation, health check, drag-and-drop, API requests
├── backend/
│   ├── app.py                 # Flask REST API + static server (serves frontend & /api endpoints)
│   ├── medical_validator.py   # Multi-stage validation: visual check (anime/photos) & text classifier
│   ├── data_extractor.py      # OCR-resilient field extractor (Patient name, age, sex, doctor, labs)
│   ├── ocr_processor.py       # PyMuPDF PDF parser + Pillow preprocessing + EasyOCR engine
│   ├── requirements.txt       # Python dependencies
│   ├── start_backend.bat      # 1-click Windows starter script
│   └── README.md              # Backend documentation
└── public/
    ├── favicon.svg
    └── icons.svg
```

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
cd backend
pip install -r requirements.txt
python app.py
```
*(Or double-click `backend/start_backend.bat` on Windows)*

The backend will start at **http://localhost:5001** and will also automatically serve the frontend!

### 2. Open the Frontend
You have two convenient options:
* **Option A**: Navigate directly to **http://localhost:5001** in your browser.
* **Option B**: Double-click `index.html` or open it with VS Code Live Server (`http://127.0.0.1:5500`). Open CORS is enabled, so it connects seamlessly either way.
