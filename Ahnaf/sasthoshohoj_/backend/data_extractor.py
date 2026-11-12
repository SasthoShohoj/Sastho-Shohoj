"""
data_extractor.py  (v2 — improved heuristics)
─────────────────────────────────────────────────────────────────
Extracts structured medical fields from raw OCR text.

Design principles for prototype robustness:
  • Each extractor tries multiple ordered patterns, most-specific first.
  • After a regex hit we always sanitise: strip trailing noise tokens,
    enforce a character allow-list, cap length.
  • Never return a value longer than makes sense (name ≤ 50 chars,
    age ≤ 3 digits, etc.).
  • A field returns None rather than garbage when nothing found.
"""

import re
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Internal utilities
# ──────────────────────────────────────────────────────────────────

def _clean(s: str | None) -> str | None:
    """Strip surrounding whitespace / punctuation noise."""
    if not s:
        return None
    s = re.sub(r'\s+', ' ', s).strip(' \t\r\n:;,.-_|/')
    return s or None


def _first_group(pattern: str, text: str, group: int = 1,
                 flags: int = re.IGNORECASE) -> str | None:
    m = re.search(pattern, text, flags)
    if not m:
        return None
    try:
        v = m.group(group)
        return _clean(v) if v else None
    except IndexError:
        return None


def _cap(s: str | None, maxlen: int) -> str | None:
    return s[:maxlen].rstrip() if s and len(s) > maxlen else s


# Tokens that are almost certainly NOT a person's name
_NAME_BLACKLIST = re.compile(
    r'^\s*(?:name|patient|report|date|age|sex|gender|dob|mr|mrs|ms|dr|hospital|'
    r'clinic|lab|test|sample|id|no|ref|signature|ward|bed|room|'
    r'male|female|positive|negative|normal|abnormal|result|'
    r'findings?|impression|diagnosis|history|examination|'
    r'investigation|recommendation|advice|treatment|'
    r'[0-9]|n/?a|nil|not\s+available)\s*$',
    re.IGNORECASE,
)

def _valid_name(s: str | None) -> str | None:
    """Return s only if it looks like a real person name."""
    if not s:
        return None
    s = _clean(s)
    if not s:
        return None
    # Must have only letters, spaces, dots, hyphens; at least 2 chars
    if not re.match(r'^[A-Za-z][A-Za-z\s\.\-]{1,}$', s):
        return None
    # Must not be a blacklisted token
    if _NAME_BLACKLIST.match(s):
        return None
    # Strip honourifics that leaked in
    s = re.sub(r'^(?:Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Md\.?)\s+', '', s, flags=re.I).strip()
    # Must still be ≥2 chars after strip
    return s if len(s) >= 2 else None


# ──────────────────────────────────────────────────────────────────
# Patient Name
# ──────────────────────────────────────────────────────────────────

def extract_patient_name(text: str) -> str | None:
    """
    Strategy:
      1. Look for explicit "Patient Name : …" labels.
      2. Look for "Name : …" with a following colon-separated value.
      3. Scan the first 20 lines for a capitalised name after a label.
    Stop at the first candidate that passes _valid_name().
    """

    # Pattern set — ordered from most-specific to broadest
    patterns = [
        # "Patient Name : John Doe"  or  "Patient's Name: John Doe"
        (r"patient'?s?\s*name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,48})", 1),
        # "Pt. Name : …"
        (r"pt\.?\s*name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,48})", 1),
        # "Name : John Doe" (guard against field names like "Lab Name")
        (r"(?<!\w)name\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,48})", 1),
        # "Patient : John Doe"
        (r"patient\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\-]{1,48})", 1),
    ]

    for pat, grp in patterns:
        raw = _first_group(pat, text, grp)
        if not raw:
            continue
        # Truncate at first tab / double-space / pipe / newline / digit
        raw = re.split(r'[\t\|]|\s{2,}|\n|\d', raw)[0]
        raw = _cap(raw, 50)
        candidate = _valid_name(raw)
        if candidate:
            return candidate

    return None


# ──────────────────────────────────────────────────────────────────
# Age
# ──────────────────────────────────────────────────────────────────

def extract_patient_age(text: str) -> str | None:
    """
    Look for   Age : 35 Y   /   Age: 35 Years   /   35 yrs   etc.
    Age must be 1–120.
    """
    patterns = [
        r"age\s*[:\-/]?\s*(\d{1,3})\s*(?:years?|yrs?|Y\b)",
        r"age\s*[:\-/]\s*(\d{1,3})",
        r"\bage\s*:\s*(\d{1,3})",
        # "35 Y / M"  or  "35Y"  style (common in lab header rows)
        r"(\d{1,3})\s*[Yy](?:[\/\s]|$)",
    ]
    for pat in patterns:
        v = _first_group(pat, text, 1)
        if v:
            try:
                n = int(v)
                if 1 <= n <= 120:
                    return f"{n} years"
            except ValueError:
                continue
    return None


# ──────────────────────────────────────────────────────────────────
# Sex / Gender
# ──────────────────────────────────────────────────────────────────

def extract_patient_sex(text: str) -> str | None:
    """
    Handles  Sex: M / F / Male / Female   and shorthand in header rows
    like  "35Y / M"  or  "M | 35".
    """
    # Explicit label
    patterns = [
        r"(?:sex|gender)\s*[:\-]\s*(male|female|m\b|f\b)",
        # "35Y/M" or "35 Y / Male"
        r"\d{1,3}\s*[Yy]\s*[\/\|]\s*(male|female|m\b|f\b)",
        # "M / 35Y"
        r"\b(male|female|m\b|f\b)\s*[\/\|]\s*\d{1,3}\s*[Yy]",
        # standalone in a header: just "Male" or "Female" on its own
        r"^\s*(male|female)\s*$",
    ]
    _map = {'m': 'Male', 'f': 'Female', 'male': 'Male', 'female': 'Female'}
    for pat in patterns:
        v = _first_group(pat, text, 1,
                         flags=re.IGNORECASE | re.MULTILINE)
        if v:
            return _map.get(v.strip().lower(), v.capitalize())
    return None


# ──────────────────────────────────────────────────────────────────
# Date
# ──────────────────────────────────────────────────────────────────

_MONTH_NAMES = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'

def extract_date(text: str) -> str | None:
    """
    Tries explicit-label patterns first, then bare date patterns.
    Returns the first credible hit.
    """
    labelled = [
        # Date : 12/11/2026
        rf"(?:date\s*of\s*(?:report|test|exam|study|sample|collection)|"
        rf"report\s*date|sample\s*date|collection\s*date|date)\s*[:\-]?\s*"
        rf"(\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{2,4}})",

        # Date : 12 Nov 2026
        rf"(?:date\s*of\s*(?:report|test|exam|study|sample|collection)|"
        rf"report\s*date|date)\s*[:\-]?\s*"
        rf"(\d{{1,2}}\s+{_MONTH_NAMES}\s+\d{{2,4}})",
    ]
    bare = [
        # Bare  DD/MM/YYYY  or  DD-MM-YYYY  (must have 4-digit year)
        r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})",
        # Bare  DD Month YYYY
        rf"(\d{{1,2}}\s+{_MONTH_NAMES}\s+\d{{4}})",
    ]
    for pat in labelled + bare:
        v = _first_group(pat, text, 1)
        if v:
            return _clean(v)
    return None


# ──────────────────────────────────────────────────────────────────
# Facility / Hospital
# ──────────────────────────────────────────────────────────────────

def extract_facility(text: str) -> str | None:
    """
    Prefer the letterhead (first 6 lines).  Fall back to inline labels.
    """
    lines = text.splitlines()

    # ── Letterhead scan ──────────────────────────────────────────
    for line in lines[:6]:
        line = line.strip()
        if not line or len(line) < 5:
            continue
        if re.search(
            r'(hospital|clinic|medical\s+cent(?:er|re)|diagnostic|'
            r'laboratory|health\s+cent(?:er|re)|institute|infirmary)',
            line, re.I
        ):
            # Avoid picking up field labels like "Hospital Name : ..."
            # by stripping the label part if present
            cleaned = re.sub(
                r'^(?:hospital|clinic|facility|centre|center|lab)\s*[:\-]\s*',
                '', line, flags=re.I
            ).strip()
            return _cap(_clean(cleaned), 90)

    # ── Inline label ─────────────────────────────────────────────
    patterns = [
        r"(?:hospital|clinic|diagnostic\s+cent(?:er|re)|facility|centre|center)"
        r"\s*[:\-]\s*([A-Za-z][A-Za-z\s\.\,&\-]{3,70})",
        r"(?:referred\s*(?:from|by)|from\s*(?:centre|center|hospital|clinic))"
        r"\s*[:\-]?\s*([A-Za-z][A-Za-z\s\.\,]{3,60})",
    ]
    for pat in patterns:
        v = _first_group(pat, text, 1)
        if v:
            # Stop at newline / tab / pipe
            v = re.split(r'[\n\t\|]', v)[0]
            return _cap(_clean(v), 90)
    return None


# ──────────────────────────────────────────────────────────────────
# Doctor / Consultant
# ──────────────────────────────────────────────────────────────────

def extract_doctor(text: str) -> str | None:
    patterns = [
        # "Reported by : Dr. John Smith"
        (r"(?:reported\s*by|signed\s*by|authorised\s*by|verified\s*by)"
         r"\s*[:\-]?\s*((?:Dr\.?|Prof\.?)\s*[A-Za-z][A-Za-z\s\.\-]{1,45})", 1),
        # "Consultant : Dr. Smith"
        (r"(?:consultant|physician|doctor)\s*[:\-]\s*"
         r"((?:Dr\.?|Prof\.?)?\s*[A-Za-z][A-Za-z\s\.\-]{1,45})", 1),
        # "Dr. John Smith" anywhere (but not at start of a sentence mid-paragraph)
        (r"(?:^|\n)\s*(Dr\.?\s+[A-Z][A-Za-z\s\.\-]{1,40})", 1),
        # "Referred by : Dr. …"
        (r"referred\s*by\s*[:\-]?\s*((?:Dr\.?)?\s*[A-Za-z][A-Za-z\s\.\-]{1,45})", 1),
    ]
    for pat, grp in patterns:
        raw = _first_group(pat, text, grp, flags=re.IGNORECASE | re.MULTILINE)
        if not raw:
            continue
        raw = re.split(r'[\t\|]|\s{2,}|\n', raw)[0]
        raw = _cap(raw, 55)
        candidate = _valid_name(raw)
        if candidate:
            return candidate
    return None


# ──────────────────────────────────────────────────────────────────
# Findings / Impression
# ──────────────────────────────────────────────────────────────────

def extract_findings(text: str) -> str | None:
    """
    Grab the paragraph that follows a FINDINGS / IMPRESSION / OPINION header.
    Uses a non-greedy match and stops at the next section header.
    """
    # Section-break sentinel (stop before these)
    _STOP = (r'(?=\n\s*(?:recommendation|advice|impression|conclusion|'
             r'signature|dr\.?\s|thank|note\s*:|attachment))')

    patterns = [
        rf"(?:^|\n)\s*(?:findings?|impression|radiological\s+(?:findings?|impression)|"
        rf"sonographic\s+(?:findings?|impression)|opinion|conclusion)\s*[:\-]\s*"
        rf"([\s\S]{{20,800}}?){_STOP}",

        rf"(?:^|\n)\s*(?:findings?|impression)\s*\n+"
        rf"([\s\S]{{20,600}}?){_STOP}",
    ]
    for pat in patterns:
        v = _first_group(pat, text, 1,
                         flags=re.IGNORECASE | re.MULTILINE)
        if v:
            # Also stop at double blank line
            v = re.split(r'\n\s*\n\s*\n', v)[0]
            return _cap(_clean(v), 700)
    return None


# ──────────────────────────────────────────────────────────────────
# Disease Summary / Diagnosis
# ──────────────────────────────────────────────────────────────────

def extract_disease_summary(text: str) -> str | None:
    patterns = [
        r"(?:^|\n)\s*(?:diagnosis|clinical\s+(?:history|summary|notes?)|"
        r"assessment|advice|recommendation|clinical\s+indication|'impression')"
        r"\s*[:\-]\s*([\s\S]{10,500}?)(?=\n\s*\n|\n\s*[A-Z][a-z]+\s*[:\-]|$)",
    ]
    for pat in patterns:
        v = _first_group(pat, text, 1,
                         flags=re.IGNORECASE | re.MULTILINE)
        if v:
            return _cap(_clean(v), 500)
    return None


# ──────────────────────────────────────────────────────────────────
# Lab / Test Results Table
# ──────────────────────────────────────────────────────────────────

# Known lab parameters for a whitelist-assist
_LAB_PARAM_HINTS = re.compile(
    r'(?:haemoglobin|hemoglobin|hematocrit|haematocrit|'
    r'wbc|white\s*blood|rbc|red\s*blood|platelet|'
    r'neutrophil|lymphocyte|monocyte|eosinophil|basophil|'
    r'mcv|mch|mchc|rdw|mpv|'
    r'glucose|blood\s*sugar|hba1c|'
    r'creatinine|urea|uric\s*acid|'
    r'sodium|potassium|chloride|bicarbonate|'
    r'alt|ast|alp|ggt|bilirubin|albumin|protein|'
    r'tsh|t3|t4|'
    r'cholesterol|triglyceride|hdl|ldl|vldl|'
    r'esr|crp|'
    r'urine\s*(?:protein|glucose|ketone|ph|sg)|'
    r'psa|ca[\s\-]?\d+)',
    re.IGNORECASE,
)

_UNIT_PAT = (
    r'(?:g/dL|mg/dL|mmol/L|IU/L|U/L|mEq/L|mIU/L|'
    r'µmol/L|umol/L|nmol/L|pmol/L|ng/mL|µg/dL|ug/dL|ng/dL|'
    r'%|/µL|/uL|/mm³|/mm3|cells/µL|cells/uL|'
    r'pg|fL|fl|mm/hr|mg/L|g/L|mOsm/kg|'
    r'×10³/µL|x10\^3/uL|10\^3/µL)'
)

def extract_test_results(text: str) -> list[dict]:
    results = []
    seen_params: set[str] = set()

    # Pattern: "Parameter   Value   Unit   (Ref range)"
    # Allow colon separator between param and value too
    row_re = re.compile(
        rf"^([A-Za-z][A-Za-z0-9\s\(\)\/\-\.,]{{2,50}}?)"   # parameter
        rf"[\s:,]+"                                           # separator
        rf"(\d[\d\.,]{{0,8}})"                               # value
        rf"(\s*{_UNIT_PAT})?"                                 # unit (optional)
        rf"(?:\s+[\(\[]?([\d\.\s\-–]+)[\)\]]?)?"             # ref range (optional)
        rf"\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    for m in row_re.finditer(text):
        param_raw = m.group(1).strip().rstrip(':, ')
        value     = m.group(2).strip().replace(',', '.')
        unit      = (m.group(3) or '').strip()
        ref       = (m.group(4) or '').strip(' ()[]') or None

        param = _clean(param_raw)
        if not param or len(param) < 2:
            continue

        # Deduplicate
        key = param.lower()
        if key in seen_params:
            continue

        # Boost confidence: prefer rows that contain known parameter names
        # but don't discard unknown ones outright (new doc types exist)
        is_known = bool(_LAB_PARAM_HINTS.search(param))

        # Basic sanity: skip rows where "value" is clearly a year / phone
        try:
            fval = float(value)
            if fval > 100_000:          # implausible lab value
                continue
        except ValueError:
            continue

        seen_params.add(key)
        results.append({
            'parameter':       param,
            'value':           value,
            'unit':            unit,
            'reference_range': ref,
            '_known':          is_known,  # used for internal sorting; stripped below
        })

    # Sort: known parameters first, preserve order among each group
    results.sort(key=lambda r: 0 if r.pop('_known') else 1)
    return results[:35]


# ──────────────────────────────────────────────────────────────────
# Master extractor
# ──────────────────────────────────────────────────────────────────

def extract_medical_data(text: str, document_type: str) -> dict:
    name  = extract_patient_name(text)
    age   = extract_patient_age(text)
    sex   = extract_patient_sex(text)
    date  = extract_date(text)
    fac   = extract_facility(text)
    doc   = extract_doctor(text)
    finds = extract_findings(text)
    summ  = extract_disease_summary(text)
    labs  = extract_test_results(text)

    logger.debug(
        "Extraction → name=%r age=%r sex=%r date=%r facility=%r doctor=%r "
        "findings=%r summary=%r labs=%d",
        name, age, sex, date, fac, doc,
        (finds or '')[:60], (summ or '')[:60], len(labs),
    )

    return {
        'patient_name':    name,
        'patient_age':     age,
        'patient_sex':     sex,
        'test_type':       document_type,
        'date':            date,
        'facility':        fac,
        'doctor':          doc,
        'findings':        finds,
        'disease_summary': summ,
        'test_results':    labs,
    }
