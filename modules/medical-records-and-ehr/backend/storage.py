"""
storage.py — Local JSON + File Storage for SasthoShohoj Prototype
─────────────────────────────────────────────────────────────────
Stores uploaded documents (PDFs & images) in backend/uploads/
and their metadata in backend/data/records.json.
"""

import json
import re
import uuid
import shutil
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / 'uploads'
DATA_DIR = BASE_DIR / 'data'
RECORDS_FILE = DATA_DIR / 'records.json'

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _load_records() -> list[dict]:
    if not RECORDS_FILE.exists():
        return []
    try:
        with open(RECORDS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_records(records: list[dict]) -> None:
    with open(RECORDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def normalize_date_iso(date_str: str | None) -> str:
    """
    Attempts to parse various date strings (e.g., '12-Nov-2026', '12/11/2026',
    '2026-11-12', '12-Nov2026', 'November 12, 2026') into 'YYYY-MM-DD'.
    Falls back to today's date if unparseable or missing.
    """
    if not date_str or not str(date_str).strip():
        return datetime.now().strftime('%Y-%m-%d')

    s = str(date_str).strip()
    # Fix fused month-year like 12-Nov2026 -> 12-Nov-2026
    s = re.sub(r'([A-Za-z]{3,9})(\d{4})', r'\1-\2', s)
    s = re.sub(r'(\d{1,2})([A-Za-z]{3,9})', r'\1-\2', s)

    formats = [
        '%Y-%m-%d', '%Y/%m/%d', '%Y.%m.%d',
        '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
        '%m/%d/%Y', '%m-%d-%Y',
        '%d-%b-%Y', '%d %b %Y', '%d.%b.%Y',
        '%d-%B-%Y', '%d %B %Y',
        '%b %d, %Y', '%B %d, %Y', '%b %d %Y', '%B %d %Y',
        '%d/%m/%y', '%d-%m-%y',
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue

    return datetime.now().strftime('%Y-%m-%d')


def save_uploaded_file(file_bytes: bytes, original_filename: str) -> tuple[str, str]:
    """
    Saves bytes to backend/uploads/<uuid>_<safe_name>.
    Returns (stored_filename, safe_original_name).
    """
    ext = Path(original_filename).suffix.lower()
    stem = re.sub(r'[^A-Za-z0-9_\-\.]', '_', Path(original_filename).stem)[:60]
    stored_name = f"{uuid.uuid4().hex[:12]}_{stem}{ext}"
    dest = UPLOAD_DIR / stored_name
    with open(dest, 'wb') as f:
        f.write(file_bytes)
    return stored_name, original_filename


def add_record(category: str, file_bytes: bytes, original_filename: str, payload: dict) -> dict:
    """
    category: 'prescription' | 'test_report'
    """
    stored_name, orig_name = save_uploaded_file(file_bytes, original_filename)
    record_id = uuid.uuid4().hex[:12]
    now_iso = datetime.now().isoformat(timespec='seconds')

    raw_date = payload.get('date')
    iso_date = normalize_date_iso(raw_date)

    record = {
        'id': record_id,
        'category': category,
        'stored_filename': stored_name,
        'file_url': f'/api/files/{stored_name}',
        'original_filename': orig_name,
        'created_at': now_iso,
        'iso_date': iso_date,
        'display_date': raw_date or iso_date,
        'title': payload.get('title') or payload.get('document_type') or (
            'Prescription' if category == 'prescription' else 'Medical Test Report'
        ),
        'document_type': payload.get('document_type') or (
            'Prescription' if category == 'prescription' else 'General Medical Report'
        ),
        'patient_name': payload.get('patient_name'),
        'patient_age': payload.get('patient_age'),
        'patient_sex': payload.get('patient_sex'),
        'facility': payload.get('facility'),
        'doctor': payload.get('doctor'),
        'findings': payload.get('findings'),
        'disease_summary': payload.get('disease_summary'),
        'notes': payload.get('notes'),
        'test_results': payload.get('test_results', []),
        'metadata': payload.get('metadata', {}),
        'raw_text': payload.get('raw_text', ''),
    }

    records = _load_records()
    records.append(record)
    _save_records(records)
    return record


def list_records(category: str | None = None) -> list[dict]:
    records = _load_records()
    if category:
        records = [r for r in records if r.get('category') == category]
    # Sort descending by iso_date, then created_at
    records.sort(key=lambda r: (r.get('iso_date', ''), r.get('created_at', '')), reverse=True)
    return records


def delete_record(record_id: str) -> bool:
    records = _load_records()
    target = next((r for r in records if r.get('id') == record_id), None)
    if not target:
        return False

    stored = target.get('stored_filename')
    if stored:
        fpath = UPLOAD_DIR / stored
        if fpath.exists():
            try:
                fpath.unlink()
            except Exception:
                pass

    records = [r for r in records if r.get('id') != record_id]
    _save_records(records)
    return True
