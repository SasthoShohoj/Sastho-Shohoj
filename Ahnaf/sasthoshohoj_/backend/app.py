"""
app.py — SasthoShohoj Backend
─────────────────────────────────────────────────────────────────
Flask API server.

Endpoints
─────────
POST /api/process
    Body: multipart/form-data  { file: <PDF or image> }
    Returns: JSON response (see /api/process handler)

GET  /api/health
    Returns: { "status": "ok" }

Run:
    python app.py
"""

import os
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

from ocr_processor     import process_file
from medical_validator import validate_medical_document
from data_extractor    import extract_medical_data

# ── Setup ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])

# ── Allowed file types ────────────────────────────────────────────
ALLOWED_MIME = {
    'application/pdf',
    'image/jpeg', 'image/jpg',
    'image/png',
    'image/tiff', 'image/tif',
    'image/bmp',
    'image/webp',
}

ALLOWED_EXT = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'}

MAX_FILE_MB = 20


def allowed_file(filename: str, mimetype: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXT or mimetype in ALLOWED_MIME


# ── Routes ────────────────────────────────────────────────────────

@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'SasthoShohoj OCR API'})


@app.post('/api/process')
def process():
    # ── Validate upload ───────────────────────────────────────────
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400

    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Empty filename.'}), 400

    if not allowed_file(f.filename, f.content_type or ''):
        return jsonify({
            'error': f'Unsupported file type. Upload a PDF or image (JPG, PNG, TIFF, BMP, WebP).'
        }), 415

    file_bytes = f.read()
    file_size  = len(file_bytes)

    if file_size > MAX_FILE_MB * 1024 * 1024:
        return jsonify({'error': f'File too large. Max {MAX_FILE_MB} MB.'}), 413

    logger.info(f'Processing: {f.filename!r}  ({file_size/1024:.1f} KB)')

    # ── OCR ───────────────────────────────────────────────────────
    try:
        ocr_result = process_file(file_bytes, f.filename)
    except Exception as e:
        logger.error(f'OCR failed: {e}\n{traceback.format_exc()}')
        return jsonify({'error': f'OCR processing failed: {str(e)}'}), 500

    raw_text       = ocr_result['raw_text']
    page_count     = ocr_result['page_count']
    avg_confidence = ocr_result['avg_confidence']
    file_type      = ocr_result['file_type']

    logger.info(f'OCR done — {page_count} page(s), confidence {avg_confidence}%')

    # ── Medical validation ────────────────────────────────────────
    validation = validate_medical_document(raw_text)
    is_medical = validation['is_medical']

    logger.info(f'Medical? {is_medical}  |  type: {validation["document_type"]}')

    # ── Data extraction (only if medical) ─────────────────────────
    extracted = {}
    if is_medical:
        extracted = extract_medical_data(raw_text, validation['document_type'])

    # ── Build response ────────────────────────────────────────────
    response = {
        # Validation
        'is_medical':        is_medical,
        'rejection_reason':  validation.get('rejection_reason'),
        'validation_confidence': validation.get('confidence'),

        # Document metadata
        'metadata': {
            'filename':        f.filename,
            'file_type':       file_type.upper(),
            'file_size_kb':    round(file_size / 1024, 1),
            'page_count':      page_count,
            'ocr_confidence':  f'{avg_confidence}%',
        },

        # Extracted fields (None when not medical)
        'document_type':   validation.get('document_type'),
        'patient_name':    extracted.get('patient_name'),
        'patient_age':     extracted.get('patient_age'),
        'patient_sex':     extracted.get('patient_sex'),
        'test_type':       extracted.get('test_type'),
        'date':            extracted.get('date'),
        'facility':        extracted.get('facility'),
        'doctor':          extracted.get('doctor'),
        'findings':        extracted.get('findings'),
        'disease_summary': extracted.get('disease_summary'),
        'test_results':    extracted.get('test_results', []),

        # Raw OCR output (always included for debugging)
        'raw_text': raw_text,
    }

    return jsonify(response), 200


# ── Entry point ───────────────────────────────────────────────────
if __name__ == '__main__':
    logger.info('Starting SasthoShohoj OCR API on http://localhost:5001')
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
