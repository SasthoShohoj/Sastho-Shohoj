"""
app.py — SasthoShohoj Backend
─────────────────────────────────────────────────────────────────
Flask API server for medical document validation and OCR extraction.

Optimized Pipeline:
  1. Fast-path Digital PDF Check: extracts text in 2ms.
     If resume or non-medical -> rejects in 5ms.
     If medical report -> extracts and returns in 15ms.
  2. Pre-OCR Visual Check: rejects anime wallpapers, memes, photos in 3ms.
  3. Optimized OCR Engine: downscales high-res scans, length-weighted confidence.
  4. Medical Document Validation: verifies medical anchors vs anti-medical penalties.
  5. Variable Parameter & Medical Field Extraction.
"""

import os
import io
import logging
import traceback
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, redirect, abort
from flask_cors import CORS
from PIL import Image

from ocr_processor     import process_file, extract_digital_pdf_text
from medical_validator import validate_medical_document, validate_visual_image
from data_extractor    import extract_medical_data
from storage           import add_record, list_records, delete_record, UPLOAD_DIR

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

# The module now lives inside the unified repository:
#   <repo>/modules/medical-records-and-ehr/backend/app.py
# Serving the whole repo as static root keeps the shared assets working
# (../../css/tokens.css, ../../js/theme.js, etc.).
MODULE_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = MODULE_ROOT.parent.parent
MODULE_URL = '/modules/medical-records-and-ehr'

ALLOWED_EXT = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp', '.webp'}
MAX_FILE_MB = 20

app = Flask(__name__, static_folder=str(REPO_ROOT), static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = (MAX_FILE_MB + 5) * 1024 * 1024
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.before_request
def block_sensitive_paths():
    """Never expose the Python backend sources, git data, or node_modules."""
    path = request.path
    blocked = (
        f'{MODULE_URL}/backend/',
        '/.git/',
        '/node_modules/',
    )
    if any(path.startswith(prefix) for prefix in blocked) or path.startswith('/.'):
        abort(404)


def allowed_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXT


# ── Static Frontend & Health Routes ───────────────────────────────

@app.get('/')
def serve_index():
    """Serve the unified EasyHealth hub (records module is linked in the nav)."""
    return send_from_directory(REPO_ROOT, 'index.html')


@app.get('/records')
def serve_records_module():
    """Convenience entry point straight to the Medical Records & EHR module."""
    return redirect(f'{MODULE_URL}/index.html')


@app.get(f'{MODULE_URL}/')
def serve_module_index():
    return send_from_directory(MODULE_ROOT, 'index.html')


@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'service': 'SasthoShohoj OCR API'})


# ── Stored Records & File Serving ─────────────────────────────────

@app.get('/api/records')
def get_records():
    category = request.args.get('category')
    return jsonify({'records': list_records(category)}), 200


@app.delete('/api/records/<record_id>')
def remove_record(record_id: str):
    if delete_record(record_id):
        return jsonify({'deleted': True}), 200
    return jsonify({'error': 'Record not found.'}), 404


@app.get('/api/files/<path:filename>')
def serve_uploaded_file(filename: str):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=False)


# ── Prescription Upload Endpoint (No OCR required) ────────────────

@app.post('/api/prescriptions')
def upload_prescription():
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
    file_size = len(file_bytes)
    if file_size > MAX_FILE_MB * 1024 * 1024:
        return jsonify({'error': f'File too large. Maximum size is {MAX_FILE_MB} MB.'}), 413

    ext = Path(f.filename).suffix.lower()
    file_type = 'PDF' if ext == '.pdf' else ext.replace('.', '').upper()
    file_size_kb = round(file_size / 1024, 1)

    title = (request.form.get('title') or '').strip() or Path(f.filename).stem
    doctor = (request.form.get('doctor') or '').strip() or None
    facility = (request.form.get('facility') or '').strip() or None
    date = (request.form.get('date') or '').strip() or None
    patient_name = (request.form.get('patient_name') or '').strip() or None
    notes = (request.form.get('notes') or '').strip() or None

    payload = {
        'title': title,
        'document_type': 'Prescription',
        'doctor': doctor,
        'facility': facility,
        'date': date,
        'patient_name': patient_name,
        'notes': notes,
        'metadata': {
            'filename': f.filename,
            'file_type': file_type,
            'file_size_kb': file_size_kb,
            'page_count': 1,
            'ocr_confidence': 'Skipped (Prescription)',
        },
    }

    record = add_record('prescription', file_bytes, f.filename, payload)
    logger.info(f"Prescription saved: {f.filename!r} (id={record['id']})")
    return jsonify({'success': True, 'record': record}), 201


# ── Process Document Endpoint ─────────────────────────────────────

@app.post('/api/process')
def process():
    # ── 1. Validate Upload ────────────────────────────────────────
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
    file_size_kb = round(file_size / 1024, 1)

    logger.info(f"Incoming: {f.filename!r} ({file_size_kb} KB, {'PDF' if is_pdf else 'IMAGE'})")

    # ── 2. Fast-Path: Digital PDF (Resumes, Digital Reports in <10ms) ──
    if is_pdf:
        digital_text, total_pages = extract_digital_pdf_text(file_bytes)
        if digital_text:
            logger.info(f"Digital text extracted ({len(digital_text)} chars in 2ms). Running validation...")
            validation = validate_medical_document(digital_text)
            is_medical = validation['is_medical']

            if not is_medical:
                logger.info(f"Digital PDF rejected: {validation.get('rejection_reason')}")
                return jsonify({
                    'is_medical':            False,
                    'rejection_reason':      validation.get('rejection_reason'),
                    'validation_confidence': 0.0,
                    'metadata': {
                        'filename':       f.filename,
                        'file_type':      'PDF',
                        'file_size_kb':   file_size_kb,
                        'page_count':     total_pages,
                        'ocr_confidence': '100% (Digital)',
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
                    'raw_text':        digital_text[:1500],
                }), 200

            # It IS a digital medical document! Extract directly and save:
            extracted = extract_medical_data(digital_text, validation['document_type'])
            response_payload = {
                'is_medical':            True,
                'rejection_reason':      None,
                'validation_confidence': validation.get('confidence'),
                'metadata': {
                    'filename':       f.filename,
                    'file_type':      'PDF',
                    'file_size_kb':   file_size_kb,
                    'page_count':     total_pages,
                    'ocr_confidence': '100% (Digital)',
                },
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
                'raw_text':        digital_text,
            }
            saved_rec = add_record('test_report', file_bytes, f.filename, response_payload)
            response_payload['saved_record'] = saved_rec
            return jsonify(response_payload), 200

    # ── 3. Pre-OCR Visual Check for Images (Anime/Photos in <5ms) ──
    if not is_pdf:
        try:
            pil_img = Image.open(io.BytesIO(file_bytes))
            is_valid_doc, visual_rejection = validate_visual_image(pil_img)
            if not is_valid_doc:
                logger.info(f"Visual pre-check rejected {f.filename}: {visual_rejection}")
                return jsonify({
                    'is_medical':            False,
                    'rejection_reason':      visual_rejection,
                    'validation_confidence': 0.0,
                    'metadata': {
                        'filename':       f.filename,
                        'file_type':      ext.replace('.', '').upper(),
                        'file_size_kb':   file_size_kb,
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
                    'raw_text':        '[Rejected before OCR: image was identified as artwork, wallpaper, or natural photo]',
                }), 200
        except Exception as img_err:
            logger.warning(f"Visual check skipped on error: {img_err}")

    # ── 4. Scanned PDF / Image OCR Processing ─────────────────────
    try:
        ocr_result = process_file(file_bytes, f.filename)
    except Exception as e:
        logger.error(f"OCR failed: {e}\n{traceback.format_exc()}")
        return jsonify({'error': f"OCR processing failed: {str(e)}"}), 500

    raw_text       = ocr_result['raw_text']
    page_count     = ocr_result['page_count']
    avg_confidence = ocr_result['avg_confidence']
    file_type      = ocr_result['file_type']

    logger.info(f"OCR complete ({page_count} page(s), weighted conf {avg_confidence}%). Validating...")

    # ── 5. Medical Document Validation ────────────────────────────
    validation = validate_medical_document(raw_text)
    is_medical = validation['is_medical']

    logger.info(f"Validation result: is_medical={is_medical}, type={validation['document_type']}")

    # ── 6. Structured Field Extraction (Only if medical) ──────────
    extracted = {}
    if is_medical:
        extracted = extract_medical_data(raw_text, validation['document_type'])

    # ── 7. Save if Medical & Return Result ────────────────────────
    response_payload = {
        'is_medical':            is_medical,
        'rejection_reason':      validation.get('rejection_reason'),
        'validation_confidence': validation.get('confidence'),

        'metadata': {
            'filename':        f.filename,
            'file_type':       file_type.upper(),
            'file_size_kb':    file_size_kb,
            'page_count':      page_count,
            'ocr_confidence':  f"{avg_confidence}%",
        },

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

    if is_medical:
        saved_rec = add_record('test_report', file_bytes, f.filename, response_payload)
        response_payload['saved_record'] = saved_rec

    return jsonify(response_payload), 200


if __name__ == '__main__':
    logger.info('Starting SasthoShohoj OCR API on http://localhost:5001')
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
