"""
medical_validator.py
─────────────────────────────────────────────────────────────────
Determines whether OCR'd text is from a valid medical document.

Logic: keyword scoring across categories. A document must pass
a minimum score threshold AND contain at least one strong medical
"anchor" term. Documents that look like invoices, groceries, or
engineering docs are actively penalised.
"""

import re

# ── Strong medical anchors (at least 1 required) ─────────────────
MEDICAL_ANCHORS = [
    r'\b(mri|magnetic resonance imaging)\b',
    r'\b(ct scan|computed tomography|ctscan)\b',
    r'\bultrasonography\b',
    r'\bultra.?sound\b',
    r'\bechocardiogram\b',
    r'\bx.?ray\b',
    r'\bhaemoglobin\b',
    r'\bhemoglobin\b',
    r'\bbiopsy\b',
    r'\bradiology\b',
    r'\bpathology\b',
    r'\bdiagnosis\b',
    r'\bprescription\b',
    r'\bblood (test|report|count|sugar|pressure)\b',
    r'\blab(oratory)? report\b',
    r'\bmedical report\b',
    r'\bdischarge summary\b',
    r'\boperation (note|report|theatre)\b',
    r'\banesthesia\b',
    r'\bsurgery\b',
    r'\bimpression:\b',
    r'\bfindings:\b',
    r'\bclinical (note|history|summary)\b',
    r'\bpatient (name|id|age|dob)\b',
    r'\b(doctor|dr\.?|physician|consultant)\b',
    r'\b(hospital|clinic|medical cent(er|re))\b',
    r'\b(wbc|rbc|platelet|hematocrit|hba1c)\b',
    r'\b(serum|plasma|urine)\b',
    r'\b(mg/dl|mmol/l|g/dl|iu/l|mEq/L)\b',
    r'\b(ecg|eeg|emg|endoscopy|colonoscopy)\b',
    r'\b(fracture|tumour|tumor|cyst|lesion|nodule)\b',
    r'\b(hypertension|diabetes|asthma|anemia)\b',
]

# ── Supporting medical terms (boost score) ───────────────────────
MEDICAL_SUPPORT = [
    r'\b(patient|referral|ward|admission|discharge)\b',
    r'\b(dosage|dose|tablet|capsule|injection|medication)\b',
    r'\b(temperature|pulse|bp|spo2|oxygen saturation)\b',
    r'\b(normal|abnormal|within normal limits|positive|negative)\b',
    r'\b(test|result|report|scan|image|study)\b',
    r'\b(age|sex|gender|dob|date of birth)\b',
    r'\b(left|right|bilateral|anterior|posterior)\b',
    r'\b(acute|chronic|mild|moderate|severe)\b',
]

# ── Anti-medical / reject terms ──────────────────────────────────
REJECT_TERMS = [
    r'\b(invoice|purchase order|po number|quotation)\b',
    r'\b(grocery|vegetables|fruits|kg|litre)\b',
    r'\b(engineering|circuit|voltage|ampere|ohm|resistance)\b',
    r'\b(certificate of (completion|achievement|merit))\b',
    r'\b(restaurant|menu|food|beverage)\b',
    r'\b(salary|payroll|payslip|employee id)\b',
    r'\b(shipping|tracking number|courier|parcel)\b',
    r'\b(receipt|subtotal|vat|gst|tax invoice)\b',
]

# ── Medical document type classification ─────────────────────────
DOC_TYPE_PATTERNS = {
    'MRI Report':              [r'\b(mri|magnetic resonance)\b'],
    'CT Scan Report':          [r'\b(ct scan|computed tomography)\b'],
    'Ultrasonography Report':  [r'\b(ultrasonography|ultra.?sound)\b'],
    'X-Ray Report':            [r'\bx.?ray\b'],
    'Echocardiogram':          [r'\becho(cardiogram)?\b'],
    'Blood Test / CBC':        [r'\b(cbc|complete blood count|haemoglobin|hemoglobin|wbc|rbc)\b'],
    'Pathology Report':        [r'\bpathology\b', r'\bbiopsy\b'],
    'Prescription':            [r'\bprescription\b', r'\b(tablet|capsule|dosage)\b'],
    'Discharge Summary':       [r'\bdischarge summary\b'],
    'ECG Report':              [r'\b(ecg|electrocardiogram)\b'],
    'Endoscopy Report':        [r'\b(endoscopy|colonoscopy|gastroscopy)\b'],
    'Lab Report':              [r'\blab(oratory)? report\b'],
}


def _score(text: str, patterns: list[str]) -> int:
    t = text.lower()
    return sum(1 for p in patterns if re.search(p, t, re.IGNORECASE))


def classify_document_type(text: str) -> str:
    best, best_score = 'General Medical Report', 0
    for doc_type, patterns in DOC_TYPE_PATTERNS.items():
        s = _score(text, patterns)
        if s > best_score:
            best, best_score = doc_type, s
    return best


def validate_medical_document(text: str) -> dict:
    """
    Returns:
        {
          "is_medical": bool,
          "confidence": float,          # 0–1
          "document_type": str,
          "rejection_reason": str | None
        }
    """
    if not text or len(text.strip()) < 20:
        return {
            'is_medical': False,
            'confidence': 0.0,
            'document_type': None,
            'rejection_reason': 'Document appears to be empty or unreadable.',
        }

    reject_hits = _score(text, REJECT_TERMS)
    if reject_hits >= 2:
        return {
            'is_medical': False,
            'confidence': 0.0,
            'document_type': None,
            'rejection_reason': (
                'This document appears to be a non-medical file '
                '(e.g. invoice, grocery list, or engineering certificate). '
                'Please upload a valid medical report.'
            ),
        }

    anchor_hits = _score(text, MEDICAL_ANCHORS)
    support_hits = _score(text, MEDICAL_SUPPORT)
    total = anchor_hits * 3 + support_hits

    confidence = min(1.0, total / 15)

    if anchor_hits == 0:
        return {
            'is_medical': False,
            'confidence': round(confidence, 2),
            'document_type': None,
            'rejection_reason': (
                'No recognisable medical content found. '
                'Accepted documents: MRI, CT scan, ultrasonography, blood tests, '
                'pathology reports, prescriptions, ECG, discharge summaries, etc.'
            ),
        }

    return {
        'is_medical': True,
        'confidence': round(confidence, 2),
        'document_type': classify_document_type(text),
        'rejection_reason': None,
    }
