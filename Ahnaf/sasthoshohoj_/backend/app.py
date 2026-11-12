"""
app.py — SasthoShohoj Backend
─────────────────────────────────────────────────────────────────
Flask API server for medical document validation and OCR extraction.

Pipeline:
  1. File validation (type, size)
  2. Pre-OCR Visual Check (rejects anime wallpapers, photos, digital art in <5ms)
  3. Pre-OCR Digital PDF Check (rejects digital invoices/receipts in <5ms)
  4. OCR processing (PyMuPDF + Pillow + EasyOCR)
  5. Medical Document Validation (detects MRI, CT, USG, CBC, Labs vs Non-medical)
  6. Structured Medical Field Extraction (only if document is confirmed medical)
"""

import os
import io
import logging
import traceback
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image

from ocr_processor     import process_file
from medical_validator import validate_medical_document, validate_visual_image
from data_extractor    import extract_medical_data

# ── Setup ─────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
app = Flask(__name__, static_folder=str(PROJECT_ROOT), static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

ALLOWED_EXT = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'}
MAX_FILE_MB = 20


def allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXT


# ── Routes ────────────────────────────────────────────────────────

@app.get('/')
def serve_index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'SasthoShohoj OCR API'})


@app.post('/api/process')
def process():
    # ── 1. Validate upload ────────────────────────────────────────
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded.'}), 400

    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'Empty filename.'}), 400

    if not allowed_file(f.filename):
        return jsonify({
            'error': 'Unsupported file type. Upload a PDF or image (JPG, PNG, TIFF, BMP, WebP).'
        }), 415

    file_bytes = f.read()
    file_size  = len(file_bytes)

    if file_size > MAX_FILE_MB * 1024 * 1024:
        return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_MB} MB.'}), 413

    ext = Path(f.filename).suffix.lower()
    is_pdf = (ext == '.pdf')
    logger.info(f"Incoming file: {f.filename!r} ({file_size/1024:.1f} KB, {'PDF' if is_pdf else 'IMAGE'})")

    # ── 2. Pre-OCR Validation (Visual Media Check for Images) ────
    # Quickly catch anime wallpapers, digital art, gaming screenshots, natural photos
    if not is_pdf:
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))
            is_valid_doc, visual_rejection = validate_visual_image(pil_img)
            if not is_valid_doc:
                logger.info(f"Pre-OCR visual rejection for {f.filename}: {visual_rejection}")
                return jsonify({
                    'is_medical': False,
                    'rejection_reason': visual_rejection,
                    'validation_confidence': 0.0,
                    'metadata': {
                        'filename':       f.filename,
                        'file_type':      ext.replace('.', '').upper(),
                        'file_size_kb':   round(file_size / 1024, 1),
                        'page_count':     1,
                        'ocr_confidence': '0.0%',
                    },
                    'document_type':   None,
                    'patient_name':    None,
                    'patient_age':     None,
                    'patient_sex':     None,
                    'test_type':       None,
                    'date':            None,
                    'facility':        None,
                    'doctor':          None,
                    'findings':        None,
                    'disease_summary': None,
                    'test_results':    [],
                    'raw_text':        '[Rejected before OCR: image was identified as artwork, wallpaper, or non-document photo]',
                }), 200
        except Exception as img_err:
            logger.warning(f"Visual pre-check error (proceeding to OCR): {img_err}")

    # ── 3. Pre-OCR Validation (Digital PDF Fast Check) ────────────
    # For digital PDFs (e.g. non-medical invoices, electric bills, certificates)
    if is_pdf:
        try:
            import pymupdf
            doc = pymupdf.open(stream=file_bytes, filetype='pdf')
            digital_text = '\n'.join(p.get_text() for p in doc).strip()
            if len(digital_text) > 80:
                fast_val = validate_medical_document(digital_text)
                if not fast_val['is_medical'] and fast_val.get('rejection_reason'):
                    logger.info(f"Pre-OCR digital PDF rejection for {f.filename}: {fast_val['rejection_reason']}")
                    return jsonify({
                        'is_medical': False,
                        'rejection_reason': fast_val['rejection_reason'],
                        'validation_confidence': 0.0,
                        'metadata': {
                            'filename':       f.filename,
                            'file_type':      'PDF',
                            'file_size_kb':   round(file_size / 1024, 1),
                            'page_count':     len(doc),
                            'ocr_confidence': '100.0% (Digital PDF)',
                        },
                        'document_type':   None,
                        'patient_name':    None,
                        'patient_age':     None,
                        'patient_sex':     None,
                        'test_type':       None,
                        'date':            None,
                        'facility':        None,
                        'doctor':          None,
                        'findings':        None,
                        'disease_summary': None,
                        'test_results':    [],
                        'raw_text':        digital_text[:1200],
                    }), 200
        except Exception as pdf_err:
            logger.warning(f"Digital PDF pre-check skipped: {pdf_err}")

    # ── 4. OCR Processing ─────────────────────────────────────────
    try:
        ocr_result = process_file(file_bytes, f.filename)
    except Exception as e:
        logger.error(f"OCR failed: {e}\n{traceback.format_exc()}")
        return jsonify({'error': f"OCR processing failed: {str(e)}"}), 500

    raw_text       = ocr_result['raw_text']
    page_count     = ocr_result['page_count']
    avg_confidence = ocr_result['avg_confidence']
    file_type      = ocr_result['file_type']

    logger.info(f"OCR finished: {page_count} page(s), avg confidence {avg_confidence}%")

    # ── 5. Medical Document Validation (FIRST) ────────────────────
    validation = validate_medical_document(raw_text)
    is_medical = validation['is_medical']

    logger.info(f"Validation result: is_medical={is_medical}, type={validation['document_type']}")

    # ── 6. Structured Field Extraction (ONLY IF MEDICAL) ──────────
    extracted = {}
    if is_medical:
        extracted = extract_medical_data(raw_text, validation['document_type'])

    # ── 7. Build and return structured response ───────────────────
    response = {
        'is_medical':            is_medical,
        'rejection_reason':      validation.get('rejection_reason'),
        'validation_confidence': validation.get('confidence'),

        'metadata': {
            'filename':        f.filename,
            'file_type':       file_type.upper(),
            'file_size_kb':    round(file_size / 1024, 1),
            'page_count':      page_count,
            'ocr_confidence':  f'{avg_confidence}%',
        },

        # Structured medical fields (None if rejected)
        'document_type':   validation.get('document_type') if is_medical else None,
        'patient_name':    extracted.get('patient_name') if is_medical else None,
        'patient_age':     extracted.get('patient_age') if is_medical else None,
        'patient_sex':     extracted.get('patient_sex') if is_medical else None,
        'test_type':       extracted.get('test_type') if is_medical else None,
        'date':            extracted.get('date') if is_medical else None,
        'facility':        extracted.get('facility') if is_medical else None,
        'doctor':          extracted.get('doctor') if is_medical else None,
        'findings':        extracted.get('findings') if is_medical else None,
        'disease_summary': extracted.get('disease_summary') if is_medical else None,
        'test_results':    extracted.get('test_results', []) if is_medical else [],

        'raw_text': raw_text,
    }

    return jsonify(response), 200


if __name__ == '__main__':
    logger.info('Starting SasthoShohoj OCR API on http://localhost:5001')
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
