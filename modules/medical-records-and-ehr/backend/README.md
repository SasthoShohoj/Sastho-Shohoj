# SasthoShohoj — Backend

A Flask-based OCR API that processes medical documents (PDFs and images).

## Setup

From the repository root:

```bash
cd modules/medical-records-and-ehr/backend
pip install -r requirements.txt
python app.py
```

The server starts at **http://localhost:5001** and serves the repository root as its static
folder, so the hub (`/`) and the module page
(`/modules/medical-records-and-ehr/index.html`, also reachable via `/records`) work with the
shared `../../css` and `../../js` assets.

## API

### `POST /api/process`
Upload a PDF or image file for processing.

**Form Data:** `file` — PDF, JPG, PNG, TIFF, BMP, or WebP (max 20 MB)

**Response (medical document):**
```json
{
  "is_medical": true,
  "document_type": "Blood Test / CBC",
  "validation_confidence": 0.87,
  "metadata": {
    "filename": "report.pdf",
    "file_type": "PDF",
    "file_size_kb": 142.3,
    "page_count": 2,
    "ocr_confidence": "91.4%"
  },
  "patient_name": "John Doe",
  "patient_age": "35 years",
  "patient_sex": "Male",
  "date": "12/11/2026",
  "facility": "City General Hospital",
  "doctor": "Dr. Smith",
  "findings": "...",
  "disease_summary": "...",
  "test_results": [
    { "parameter": "Haemoglobin", "value": "13.4", "unit": "g/dL", "reference_range": "13-17" }
  ],
  "raw_text": "..."
}
```

**Response (rejected):**
```json
{
  "is_medical": false,
  "rejection_reason": "No recognisable medical content found...",
  "raw_text": "..."
}
```

### `GET /api/health`
```json
{ "status": "ok", "service": "SasthoShohoj OCR API" }
```

### `GET /api/records`
Returns every stored record (`{ "records": [ ... ] }`), newest first.

### `DELETE /api/records/<record_id>`
Removes a record and its uploaded file. Returns `{ "deleted": true }`.

### `GET /api/files/<filename>`
Serves an uploaded document so the reports modal can preview it.

### `POST /api/prescriptions`
Saves a prescription without OCR. Multipart form data: `file`, plus optional
`title`, `date`, `doctor`, `facility`, `patient`, `notes`. Returns `201` with the new record.

## Frontend routes served by Flask
| Path | Purpose |
| --- | --- |
| `/` | Unified EasyHealth hub |
| `/records` | Redirects to the module page |
| `/modules/medical-records-and-ehr/index.html` | Medical Records & EHR module |

The Flask static folder is the **repository root**, so shared assets such as
`/css/tokens.css` and `/js/theme.js` resolve correctly. Backend sources, `.git` and
`node_modules` are blocked by a `before_request` guard.

## Notes for prototype phase
- EasyOCR downloads language models on first run (~200 MB). Subsequent runs are fast.
- GPU is disabled by default (`gpu=False`). Enable in `ocr_processor.py` if CUDA is available.
- Field extraction uses regex heuristics — good for structured reports; replace with an LLM call for unstructured text.
- Medical validation uses keyword scoring — tune `MEDICAL_ANCHORS` in `medical_validator.py` as needed.
