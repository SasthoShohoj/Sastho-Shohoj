"""
data_extractor.py
─────────────────────────────────────────────────────────────────
Extracts structured medical fields from raw OCR text with OCR-error tolerance.

Features:
  • Patient Name: stops at newlines, intra-line labels like Age/Pge/Sex/ID/DOB.
  • Patient Age: handles '24 Y', '24 Years', '24 yrs', 'Age: 24', 'Pge: 24'.
  • Patient Sex: handles 'Male', 'Female', 'Sex Male', 'M', 'F', '24Y/M'.
  • Test / Report Date: catches formatted and bare medical dates.
  • Facility: tolerant of OCR typos like 'Hcspital', 'Hospltal', 'Cllnic'.
  • Doctor: parses 'Ref By: Dr: Farhan Islam', stops before qualifications.
  • Findings: matches with or without colons, captures multi-line observations.
  • Disease Summary / Impression: captures diagnostic impressions and advice.
  • Lab Parameters: parameter names, numerical values, units, reference ranges.
"""

import re
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Sanitisation & Validation
# ──────────────────────────────────────────────────────────────────

def _clean(s: str | None) -> str | None:
    if not s:
        return None
    s = re.sub(r'[ \t]+', ' ', s).strip(' \t\r\n:;,.-_|/()[]{}')
    return s or None


_NAME_BLACKLIST = re.compile(
    r'^\s*(?:name|patient|report|date|age|pge|sex|gender|dob|mr|mrs|ms|dr|prof|'
    r'hospital|clinic|lab|test|sample|id|no|ref|signature|ward|bed|room|'
    r'male|female|positive|negative|normal|abnormal|result|findings?|'
    r'impression|diagnosis|history|examination|investigation|'
    r'recommendation|advice|treatment|ultrasound|mri|ct|xray|'
    r'[0-9]|n/?a|nil|not\s+available)\s*$',
    re.IGNORECASE,
)


def _valid_name(s: str | None) -> str | None:
    if not s:
        return None
    s = _clean(s)
    if not s or len(s) < 2:
        return None
    if _NAME_BLACKLIST.match(s):
        return None
    # Strip honorifics that leaked into the string
    s = re.sub(r'^(?:Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Md\.?|Master)\s+', '', s, flags=re.I).strip()
    return s if len(s) >= 2 else None


# ──────────────────────────────────────────────────────────────────
# 1. Patient Name
# ──────────────────────────────────────────────────────────────────

def extract_patient_name(text: str) -> str | None:
    """
    Extracts patient name from labels.
    Never crosses newlines. Stops before intra-line labels like Age/Pge/Sex/ID.
    """
    patterns = [
        # Explicit Patient Name: Ahnaf Rahman
        r"(?:patient'?s?\s*name|pt\.?\s*name)\s*[:\-\.]?\s*([A-Za-z][A-Za-z \t\.\-]{1,45})",
        # Patient: Ahnaf Rahman
        r"(?<![A-Za-z])patient\s*[:\-\.]?\s*([A-Za-z][A-Za-z \t\.\-]{1,45})",
        # Name: Ahnaf Rahman (guard against Lab Name / Hospital Name)
        r"(?<!(?:lab|hospital|clinic|doctor|dr|father|mother|husband|institution))\s+name\s*[:\-\.]?\s*([A-Za-z][A-Za-z \t\.\-]{1,45})",
        r"^name\s*[:\-\.]?\s*([A-Za-z][A-Za-z \t\.\-]{1,45})",
    ]

    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            raw = m.group(1).strip()
            # Stop before intra-line labels (handles OCR typos like Pge for Age)
            raw = re.split(
                r'\b(?:[ap]ge|sex|gender|dob|date|ref|id|no|bed|ward|cabin|reg|phone)\b',
                raw,
                flags=re.I,
            )[0].strip(' :;,-')
            name = _valid_name(raw)
            if name:
                return name

    return None


# ──────────────────────────────────────────────────────────────────
# 2. Patient Age
# ──────────────────────────────────────────────────────────────────

def extract_patient_age(text: str) -> str | None:
    patterns = [
        # Age: 24 Years / Pge: 24 Y / Age - 24 yrs
        r"\b[ap]ge\s*[:\-/]?\s*(\d{1,3})\s*(?:years?|yrs?|y\b)?",
        # Inline shorthand: 24 Y / M or 24Y/M
        r"\b(\d{1,3})\s*[Yy](?:[\/\s\|]|$)",
        # Standalone Age : 24
        r"\b[ap]ge\s*[:\-/]\s*(\d{1,3})\b",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val_str = m.group(1)
            try:
                n = int(val_str)
                if 1 <= n <= 120:
                    return f"{n} years"
            except ValueError:
                continue
    return None


# ──────────────────────────────────────────────────────────────────
# 3. Patient Sex / Gender
# ──────────────────────────────────────────────────────────────────

def extract_patient_sex(text: str) -> str | None:
    # 1. Explicit label (with or without colon, e.g. "Sex Male" or "Sex: Female")
    m = re.search(r"\b(?:sex|gender)\s*[:\-\.]?\s*(male|female|m\b|f\b)", text, re.I)
    if m:
        v = m.group(1).lower()
        return "Male" if v.startswith('m') else "Female"

    # 2. Shorthand like 24Y / M or 24/M
    m2 = re.search(r"\b\d{1,3}\s*[Yy]?\s*[\/\|]\s*(male|female|m\b|f\b)", text, re.I)
    if m2:
        v = m2.group(1).lower()
        return "Male" if v.startswith('m') else "Female"

    # 3. M / 24Y
    m3 = re.search(r"\b(male|female|m\b|f\b)\s*[\/\|]\s*\d{1,3}\s*[Yy]?", text, re.I)
    if m3:
        v = m3.group(1).lower()
        return "Male" if v.startswith('m') else "Female"

    return None


# ──────────────────────────────────────────────────────────────────
# 4. Test / Report Date
# ──────────────────────────────────────────────────────────────────

def extract_date(text: str) -> str | None:
    month_names = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'

    # Explicit labelled dates (with or without colon)
    labelled = [
        rf"(?:date\s*of\s*(?:report|test|exam|study|sample|collection)|report\s*date|test\s*date|sample\s*date|date)\s*[:\-\.]?\s*(\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{2,4}})",
        rf"(?:date\s*of\s*(?:report|test|exam|study)|report\s*date|test\s*date|date)\s*[:\-\.]?\s*(\d{{1,2}}\s+{month_names}\s+\d{{2,4}})",
    ]
    for pat in labelled:
        m = re.search(pat, text, re.I)
        if m:
            return _clean(m.group(1))

    # Bare standalone dates with 4-digit year
    bare_matches = re.findall(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b", text)
    if bare_matches:
        return _clean(bare_matches[0])

    return None


# ──────────────────────────────────────────────────────────────────
# 5. Facility / Hospital
# ──────────────────────────────────────────────────────────────────

def extract_facility(text: str) -> str | None:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    # Check header lines (first 5 lines), OCR typo tolerant
    for line in lines[:5]:
        if re.search(r'\b(h[o0c]spital|cl[i1l]n[i1]c|d[i1]agnost[i1]c|med[i1]cal|health\s*care|pathology)\b', line, re.I):
            clean_line = re.sub(r'^(?:hospital|clinic|facility|center|centre|lab)\s*[:\-]\s*', '', line, flags=re.I).strip(' :;,-')
            return clean_line[:75]

    # Check inline label
    m = re.search(r"(?:hospital|clinic|center|centre|diagnostic\s+cent(?:er|re))\s*[:\-\.]?\s*([A-Za-z][A-Za-z \t\.\,\&]{3,60})", text, re.I)
    if m:
        return _clean(m.group(1)[:75])

    return None


# ──────────────────────────────────────────────────────────────────
# 6. Doctor / Consultant
# ──────────────────────────────────────────────────────────────────

def extract_doctor(text: str) -> str | None:
    patterns = [
        # Ref By: Dr: Farhan Islam / Doctor: Dr. Smith
        r"(?:ref(?:erred)?\s*(?:by|\.)?|consultant|physician|doctor|reported\s*by|signed\s*by)\s*[:\-\.]?\s*((?:Dr[\.:]?)?\s*[A-Z][A-Za-z \t\.\-]{2,35})",
        # Dr. Farhan Islam
        r"(?:^|\n)\s*(Dr[\.:]\s+[A-Z][A-Za-z \t\.\-]{2,30})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I | re.MULTILINE)
        if m:
            raw = m.group(1).strip()
            # Stop before qualification degrees or next line headers
            raw = re.split(r'[\(\[\n\t\|]|\b(?:consultant|mbbs|fcps|md|ms|mrcp|frcs|dgo|phd|department|complete|pathology)\b', raw, flags=re.I)[0].strip(' :;,-')
            # Standardise Dr prefix
            raw = re.sub(r'^Dr[\.:]?\s*', '', raw, flags=re.I).strip()
            name = _valid_name(raw)
            if name:
                return f"Dr. {name}"

    return None


# ──────────────────────────────────────────────────────────────────
# 7. Findings / Observations
# ──────────────────────────────────────────────────────────────────

def extract_findings(text: str) -> str | None:
    # Match paragraph after Findings or Observations header (with or without colon)
    pat = (
        r"(?:^|\n)\s*(?:findings?|radiological\s+findings?|sonographic\s+findings?|observations?)\s*[:\-\.]?\s*\n?"
        r"([\s\S]+?)"
        r"(?=\n\s*(?:impression|diagnosis|[ap]dvice|recommendation|conclusion|signature|dr\.|\n\s*\n\s*\n|$))"
    )
    m = re.search(pat, text, re.I)
    if m:
        val = _clean(m.group(1))
        if val and len(val) >= 15:
            return val[:800]
    return None


# ──────────────────────────────────────────────────────────────────
# 8. Disease Summary / Diagnosis / Impression
# ──────────────────────────────────────────────────────────────────

def extract_disease_summary(text: str) -> str | None:
    patterns = [
        # Impression: ... (with or without colon)
        r"(?:^|\n)\s*(?:impression|radiological\s+impression|sonographic\s+impression|conclusion|opinion)\s*[:\-\.]?\s*([\s\S]+?)(?=\n\s*(?:[ap]dvice|recommendation|signature|dr\.|\n\s*\n|$))",
        # Diagnosis: ...
        r"(?:^|\n)\s*(?:diagnosis|clinical\s+(?:history|summary|indication|notes?)|assessment)\s*[:\-\.]?\s*([\s\S]+?)(?=\n\s*(?:findings?|[ap]dvice|recommendation|signature|dr\.|\n\s*\n|$))",
        # Advice / Pdvice: ...
        r"(?:^|\n)\s*(?:[ap]dvice|recommendations?)\s*[:\-\.]?\s*([\s\S]+?)(?=\n\s*(?:signature|dr\.|\n\s*\n|$))",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I)
        if m:
            val = _clean(m.group(1))
            if val and len(val) >= 5:
                return val[:600]
    return None


# ──────────────────────────────────────────────────────────────────
# 9. Lab / Test Results Table
# ──────────────────────────────────────────────────────────────────

_UNIT_PAT = (
    r'(?:g/dL|mg/dL|mmol/L|IU/L|U/L|mEq/L|mIU/L|'
    r'µmol/L|umol/L|nmol/L|pmol/L|ng/mL|µg/dL|ug/dL|ng/dL|'
    r'%|/µL|/uL|/mm³|/mm3|cells/µL|cells/uL|'
    r'pg|fL|fl|mm/hr|mg/L|g/L|mOsm/kg)'
)

def extract_test_results(text: str) -> list[dict]:
    results = []
    seen = set()

    row_re = re.compile(
        rf"^([A-Za-z][A-Za-z0-9\s\(\)\/\-\.]{{2,40}}?)"
        rf"[\s:,]+"
        rf"(\d[\d\.,]{{0,7}})"
        rf"(\s*{_UNIT_PAT})?"
        rf"(?:\s+[\(\[]?([\d\.\s\-–]+)[\)\]]?)?"
        rf"\s*$",
        re.I | re.MULTILINE,
    )

    for m in row_re.finditer(text):
        param = _clean(m.group(1))
        val_str = m.group(2).strip()
        unit = (m.group(3) or '').strip()
        ref = (m.group(4) or '').strip(' ()[]') or None

        if not param or len(param) < 2 or not val_str:
            continue

        if param.lower() in ('parameter', 'test', 'investigation', 'page', 'date'):
            continue

        try:
            num = float(val_str.replace(',', ''))
            if num > 200_000:
                continue
        except ValueError:
            continue

        key = param.lower()
        if key not in seen:
            seen.add(key)
            results.append({
                'parameter': param,
                'value': val_str,
                'unit': unit,
                'reference_range': ref,
            })

    return results[:35]


# ──────────────────────────────────────────────────────────────────
# Master Extractor
# ──────────────────────────────────────────────────────────────────

def extract_medical_data(text: str, document_type: str) -> dict:
    return {
        'patient_name':    extract_patient_name(text),
        'patient_age':     extract_patient_age(text),
        'patient_sex':     extract_patient_sex(text),
        'test_type':       document_type,
        'date':            extract_date(text),
        'facility':        extract_facility(text),
        'doctor':          extract_doctor(text),
        'findings':        extract_findings(text),
        'disease_summary': extract_disease_summary(text),
        'test_results':    extract_test_results(text),
    }
