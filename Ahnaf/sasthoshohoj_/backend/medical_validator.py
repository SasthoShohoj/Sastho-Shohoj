"""
medical_validator.py
─────────────────────────────────────────────────────────────────
Validates whether an uploaded file is a genuine medical document.

Multi-stage pipeline:
  Stage 1: Pre-OCR Visual Inspection (for images)
           Detects colorful anime wallpapers, digital artwork, gaming screenshots,
           memes, natural photos/selfies vs monochrome medical scans / paper reports.
  Stage 2: Semantic Text Validation
           Scores medical terms against anti-medical/rejection patterns
           (invoices, grocery lists, certificates, resumes, entertainment).
"""

import re
import numpy as np
from PIL import Image

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
    r'\bblood (test|report|count|sugar|pressure|glucose)\b',
    r'\blab(oratory)? report\b',
    r'\bmedical report\b',
    r'\bdischarge summary\b',
    r'\boperation (note|report|theatre)\b',
    r'\banesthesia\b',
    r'\bsurgery\b',
    r'\bimpression\b',
    r'\bfindings\b',
    r'\bclinical (note|history|summary|indication)\b',
    r'\bpatient (name|id|age|dob|sex|gender)\b',
    r'\b(doctor|dr\.?|physician|consultant|specialist)\b',
    r'\b(hospital|clinic|medical cent(er|re)|diagnostic)\b',
    r'\b(wbc|rbc|platelet|hematocrit|haematocrit|hba1c)\b',
    r'\b(serum|plasma|urine|stool|csf)\b',
    r'\b(mg/dl|mmol/l|g/dl|iu/l|mEq/L|cells/µl|cells/ul)\b',
    r'\b(ecg|eeg|emg|endoscopy|colonoscopy|gastroscopy)\b',
    r'\b(fracture|tumour|tumor|cyst|lesion|nodule|calculus)\b',
    r'\b(hypertension|diabetes|asthma|anemia|infection)\b',
    r'\b(creatinine|bilirubin|cholesterol|tsh|sgpt|sgot|alt|ast)\b',
]

# ── Supporting medical terms (boost score) ───────────────────────
MEDICAL_SUPPORT = [
    r'\b(patient|referral|ward|admission|discharge|bed|cabin)\b',
    r'\b(dosage|dose|tablet|capsule|injection|medication|syrup)\b',
    r'\b(temperature|pulse|bp|spo2|oxygen saturation|heart rate)\b',
    r'\b(normal|abnormal|within normal limits|positive|negative|borderline)\b',
    r'\b(test|result|report|scan|image|study|specimen|investigation)\b',
    r'\b(age|sex|gender|dob|date of birth)\b',
    r'\b(left|right|bilateral|anterior|posterior|superior|inferior)\b',
    r'\b(acute|chronic|mild|moderate|severe)\b',
    r'\b(liver|kidney|gallbladder|spleen|pancreas|heart|lung|brain)\b',
]

# ── Anti-medical / reject terms (invoices, groceries, engineering, anime, certs) ──
REJECT_TERMS = [
    # Commercial & invoices
    r'\b(invoice|purchase order|po number|quotation|proforma)\b',
    r'\b(subtotal|tax invoice|vat|gst|total amount due|cash receipt)\b',
    r'\b(grocery|super\s*shop|market|vegetables?|fruits?|kg\b|litre\b)\b',
    r'\b(restaurant|menu|food|beverage|table no|waiter|dine in)\b',
    r'\b(shipping|tracking number|courier|parcel|delivery address)\b',
    r'\b(salary|payroll|payslip|employee id|net pay|basic pay)\b',
    # Engineering & academic certs
    r'\b(circuit|voltage|ampere|ohm|resistance|transistor|capacitor)\b',
    r'\b(certificate of (completion|achievement|merit|participation))\b',
    r'\b(bachelor of (science|arts|engineering)|diploma in|semester|cgpa)\b',
    # Entertainment / Anime / Games
    r'\b(anime|manga|wallpaper|deviantart|pixiv|cosplay|fanart)\b',
    r'\b(genshin|naruto|pokemon|dragon\s*ball|attack on titan)\b',
    r'\b(playstation|xbox|steam|discord|twitch|gameplay)\b',
]

# ── Medical document type classification ─────────────────────────
DOC_TYPE_PATTERNS = {
    'MRI Report':              [r'\b(mri|magnetic resonance)\b'],
    'CT Scan Report':          [r'\b(ct scan|computed tomography)\b'],
    'Ultrasonography Report':  [r'\b(ultrasonography|ultra.?sound|usg)\b'],
    'X-Ray Report':            [r'\bx.?ray\b', r'\bradiograph\b'],
    'Echocardiogram':          [r'\becho(cardiogram)?\b'],
    'Blood Test / CBC':        [r'\b(cbc|complete blood count|haemoglobin|hemoglobin|wbc|rbc|platelet)\b'],
    'Pathology Report':        [r'\bpathology\b', r'\bbiopsy\b', r'\bcytology\b'],
    'Prescription':            [r'\bprescription\b', r'\b(tablet|capsule|dosage|rx\b)\b'],
    'Discharge Summary':       [r'\bdischarge summary\b'],
    'ECG Report':              [r'\b(ecg|electrocardiogram)\b'],
    'Endoscopy Report':        [r'\b(endoscopy|colonoscopy|gastroscopy)\b'],
    'Biochemistry / Lab':      [r'\b(creatinine|bilirubin|lipid profile|liver function|lft|kft)\b'],
    'Lab Report':              [r'\blab(oratory)? report\b'],
}


# ──────────────────────────────────────────────────────────────────
# Stage 1: Pre-OCR Visual Image Inspection
# ──────────────────────────────────────────────────────────────────

def validate_visual_image(pil_img: Image.Image) -> tuple[bool, str | None]:
    """
    Fast pre-OCR inspection for images.
    Detects whether an image is a document/scan vs an anime wallpaper,
    digital artwork, gaming screenshot, meme, or natural photo.

    Returns:
        (is_valid_document, rejection_reason)
    """
    try:
        # Resize thumbnail to 200x200 for near-instant analysis (<5ms)
        thumb = pil_img.resize((200, 200)).convert('RGB')
        arr = np.array(thumb, dtype=np.float32) / 255.0

        # 1. Grayscale check (Radiology scans: X-ray, MRI, CT film, or monochrome document)
        rg_diff = np.abs(arr[:, :, 0] - arr[:, :, 1])
        gb_diff = np.abs(arr[:, :, 1] - arr[:, :, 2])
        max_channel_diff = float(np.mean(rg_diff + gb_diff))

        if max_channel_diff < 0.05:
            # Essentially grayscale -> definitely consistent with a radiology film or scanned document
            return True, None

        # 2. Color saturation and paper background analysis
        hsv = np.array(thumb.convert('HSV'), dtype=np.float32) / 255.0
        sat = hsv[:, :, 1]
        val = hsv[:, :, 2]

        mean_sat = float(np.mean(sat))
        vibrant_pixels = float(np.mean(sat > 0.28))
        # Paper background: near-white or light neutral pixels
        paper_pixels = float(np.mean((val > 0.70) & (sat < 0.18)))

        # Anime wallpaper / colorful art check:
        # High saturation across most of the image, lack of neutral paper document background
        if vibrant_pixels > 0.35 and paper_pixels < 0.25:
            return False, (
                "The uploaded image appears to be a colorful illustration, a natural imagery, "
                "or digital artwork rather than a medical document or scan."
            )

        # Natural colorful photo (landscape, selfie, meme)
        if mean_sat > 0.40 and paper_pixels < 0.18:
            return False, (
                "The uploaded image appears to be a photo or wallpaper, not a medical document. "
                "Please upload a scanned medical report, lab result, prescription, or radiology image."
            )

        return True, None

    except Exception as e:
        # If visual inspection encounters an unexpected format, allow downstream OCR to evaluate
        return True, None


# ──────────────────────────────────────────────────────────────────
# Stage 2: Post-OCR / Text Medical Validation
# ──────────────────────────────────────────────────────────────────

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
    Evaluates OCR text to determine if it is a genuine medical record.

    Returns:
        {
          "is_medical": bool,
          "confidence": float,          # 0.0 to 1.0
          "document_type": str | None,
          "rejection_reason": str | None
        }
    """
    if not text or len(text.strip()) < 15:
        return {
            'is_medical': False,
            'confidence': 0.0,
            'document_type': None,
            'rejection_reason': 'No readable text could be found on the uploaded document.',
        }

    # Check anti-medical terms (invoices, grocery lists, certs, engineering, anime)
    reject_hits = _score(text, REJECT_TERMS)
    if reject_hits >= 2:
        return {
            'is_medical': False,
            'confidence': 0.0,
            'document_type': None,
            'rejection_reason': (
                'This document was identified as a non-medical file '
                '(e.g. commercial invoice, grocery bill, engineering certificate, or non-medical media). '
                'Please upload a valid medical report.'
            ),
        }

    anchor_hits = _score(text, MEDICAL_ANCHORS)
    support_hits = _score(text, MEDICAL_SUPPORT)
    total_score = anchor_hits * 3 + support_hits

    confidence = min(1.0, total_score / 12)

    # Must have at least 1 strong medical anchor
    if anchor_hits == 0:
        return {
            'is_medical': False,
            'confidence': round(confidence, 2),
            'document_type': None,
            'rejection_reason': (
                'No recognisable medical terms or diagnostics found. '
                'Accepted documents include: MRI, CT scan, Ultrasonography, Blood/Lab tests, '
                'Pathology reports, Prescriptions, ECG, Discharge summaries, etc.'
            ),
        }

    return {
        'is_medical': True,
        'confidence': round(max(0.60, confidence), 2),
        'document_type': classify_document_type(text),
        'rejection_reason': None,
    }
