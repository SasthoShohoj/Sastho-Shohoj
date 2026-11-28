"""
data_extractor.py
─────────────────────────────────────────────────────────────────
Extracts structured medical fields from raw OCR text with OCR-error tolerance.

Features:
  • Patient Name: stops at newlines, intra-line labels like Age/Pge/Sex/ID/DOB.
  • Patient Age: handles '24 Y', '24 Years', '24 yrs', 'Age: 24', 'Pge: 24'.
  • Patient Sex/Gender: handles 'Male', 'Female', 'Sex Male', 'M', 'F', '24Y/M', 'Age/Sex: 45/Male'.
  • Test / Report Date: catches formatted, named-month, fused (12-Nov2026), and standalone dates.
  • Facility: tolerant of OCR typos like 'Hcspital', 'Hospltal', 'Cllnic'.
  • Doctor: handles 'Peferred By', 'Ref By', 'Dr: Name', filters non-name words.
  • Findings: matches with or without colons, captures multi-line observations.
  • Disease Summary / Impression: handles 'Impression', 'Imdression', 'Diagnosis', 'Advice'.
  • Variable Test Parameters:
      - Blood / Lab tests (Haemoglobin, Creatinine, Sugar, SGPT, TSH)
      - Qualitative tests (Blood Group, Dengue, Urine Protein, Pus Cells)
      - Unitless tests (pH, Specific Gravity, INR)
      - Imaging measurements (Organ sizes in cm/mm, disc bulges, thicknesses)
      - Supports multi-line table layouts where OCR splits name and value across lines
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
    r'recommendation|advice|treatment|ultrasound|mri|ct|xray|consultation|'
    r'physician|consultant|specialist|department|institute|institution|'
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
    s = re.sub(r'^(?:Mr\.?|Mrs\.?|Ms\.?|Miss\.?|Md\.?|Master)\s+', '', s, flags=re.I).strip()
    return s if len(s) >= 2 else None


# ──────────────────────────────────────────────────────────────────
# 1. Patient Name
# ──────────────────────────────────────────────────────────────────

def extract_patient_name(text: str) -> str | None:
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
            # Stop before intra-line labels
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
        # Age: 24 Years / Pge: 24 Y / Age - 24 yrs (inline on same line)
        r"\b[ap]ge\s*[:\-/]?\s*(\d{1,3})\s*(?:years?|yrs?|y\b)?",
        # Age/Sex: 21 Years / Male (compound inline)
        r"\b[ap]ge\s*[/\\]\s*s[eoa]x\s*[:\-\.]?\s*(\d{1,3})\s*(?:years?|yrs?|y\b)?",
        # Inline shorthand: 24 Y / M or 24Y/M or PgelSex 26 Y
        r"\b(\d{1,3})\s*[Yy](?:[\/\s\|]|$)",
        # Standalone Age : 24
        r"\b[ap]ge\s*[:\-/]\s*(\d{1,3})\b",
        # Separated labels on same line: "Sex: Female Age: 22" or "Age:22 Sex:Male"
        r"\b(?:s[eoa]x|gender)\s*[:\-\.]?\s*(?:male|female|m|f)\s*[,;\s]+[ap]ge\s*[:\-\.]?\s*(\d{1,3})\b",
        r"\b[ap]ge\s*[:\-\.]?\s*(\d{1,3})\s*[,;\s]+(?:s[eoa]x|gender)\s*[:\-\.]?\s*(?:male|female|m|f)\b",
        # Split-row layout: "Age\nSex\n21 Years\nMale" or "Age\n21 Years"
        # Match "Age" or "Age/Sex" on a line, then find the number on a following line
        r"(?:^|\n)\s*[ap]ge(?:\s*[/\\]\s*s[eoa]x)?\s*\n(?:[^\n]*\n){0,2}?\s*(\d{1,3})\s*(?:years?|yrs?|y\b)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE | re.MULTILINE)
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
    # 1. Compound row: Age/Sex: 45 Yrs / Male or PgelSex 26 Y / Male or Sex/Age: Female / 28 Yrs
    m_compound = re.search(r'\b(?:[ap]ge\s*[\/\\]\s*s[eoa]x|[ap]gel\s*s[eoa]x|s[eoa]x\s*[\/\\]\s*[ap]ge)\s*[:\-\.]?\s*([^\n\r]+)', text, re.I)
    if m_compound:
        segment = m_compound.group(1).lower()
        if re.search(r'\b(female|f)\b', segment):
            return 'Female'
        if re.search(r'\b(male|m)\b', segment):
            return 'Male'

    # 2. Labelled inline: Sex: Male, Sox: Female, Gender: M, Sex-F, Sex Male
    m_label = re.search(r'\b(?:s[eoa]x|gender)\s*[:\-\.\s]\s*(male|female|m\b|f\b)', text, re.I)
    if m_label:
        v = m_label.group(1).lower()
        return 'Female' if v.startswith('f') else 'Male'

    # 3. Shorthand like 28/F or 45 Y / Male or M / 42Y
    m_short1 = re.search(r'\b\d{1,3}\s*(?:y|yrs|years)?\s*[\/\|\\]\s*(male|female|m\b|f\b)', text, re.I)
    if m_short1:
        v = m_short1.group(1).lower()
        return 'Female' if v.startswith('f') else 'Male'

    m_short2 = re.search(r'\b(male|female|m\b|f\b)\s*[\/\|\\]\s*\d{1,3}\s*(?:y|yrs|years)?', text, re.I)
    if m_short2:
        v = m_short2.group(1).lower()
        return 'Female' if v.startswith('f') else 'Male'

    # 4. Separated labels on the same line (any order):
    #    "Sex: Female Age: 22"  /  "Age: 22 Sex: Female"  /  "Sex Female, Age 22"
    m_sep = re.search(
        r'\b(?:s[eoa]x|gender)\s*[:\-\.]?\s*(male|female)\b[^.\n]{0,40}\b[ap]ge\s*[:\-\.]?\s*\d{1,3}\b'
        r'|\b[ap]ge\s*[:\-\.]?\s*\d{1,3}\b[^.\n]{0,40}\b(?:s[eoa]x|gender)\s*[:\-\.]?\s*(male|female)\b',
        text, re.I
    )
    if m_sep:
        v = (m_sep.group(1) or m_sep.group(2) or '').lower()
        if v:
            return 'Female' if v.startswith('f') else 'Male'

    # 5. Split-row layout: "Age\nSex\n21 Years\nMale" – find "Sex" or "Gender" on its own line,
    #    then scan the next 1-3 lines for a Male/Female token (skipping the age line).
    m_split = re.search(
        r'(?:^|\n)\s*(?:s[eoa]x|gender)\s*\n'
        r'(?:[^\n]*\n){0,2}?\s*(male|female)\b',
        text, re.I | re.MULTILINE
    )
    if m_split:
        return m_split.group(1).capitalize()

    # Also handle the reverse split: "Age/Sex" label on own line, values follow
    m_split_compound = re.search(
        r'(?:^|\n)\s*[ap]ge\s*[/\\]\s*s[eoa]x\s*\n'
        r'(?:[^\n]*\n){0,2}?\s*(?:\d{1,3}\s*(?:years?|yrs?|y)?\s*[/\\]?\s*)?(male|female)\b',
        text, re.I | re.MULTILINE
    )
    if m_split_compound:
        return m_split_compound.group(1).capitalize()

    # 6. Standalone MALE / FEMALE near demographic info
    m_demo = re.search(r'(?:patient|name|age|\d{1,2}\s*y)[^\n\r]{0,60}?\b(male|female)\b', text, re.I)
    if m_demo:
        return m_demo.group(1).capitalize()

    return None


# ──────────────────────────────────────────────────────────────────
# 4. Test / Report Date
# ──────────────────────────────────────────────────────────────────

def extract_date(text: str) -> str | None:
    months = (
        r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
        r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
    )

    # 1. Labelled dates: Date:, Dt:, Dated:, Report Date:, Exam Date:, Collection Date:, Dale:
    date_label_pat = (
        rf'\b(?:d[a-z]te|d[at]ed?|dt|exam\s*date|study\s*date|col(?:lection)?\s*date|rep(?:ort)?\s*date)\s*[:\-\.]?\s*'
        rf'('
        rf'\d{{1,2}}[\s\-\/\.]*{months}[\s\-\/\.]*\d{{2,4}}|'
        rf'{months}[\s\-\/\.]*\d{{1,2}},?[\s\-\/\.]*\d{{2,4}}|'
        rf'\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{2,4}}|'
        rf'\d{{4}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{1,2}}'
        rf')'
    )
    m1 = re.search(date_label_pat, text, re.I)
    if m1:
        return _clean(m1.group(1))

    # 2. Exam: 12-Nov2026 or Date \n Exam: 12-Nov2026
    m_exam = re.search(rf'\b(?:exam|date)\s*[:\-\.]?\s*(\d{{1,2}}[\s\-\/\.]*{months}[\s\-\/\.]*\d{{2,4}}|\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.]\d{{2,4}})', text, re.I)
    if m_exam:
        return _clean(m_exam.group(1))

    # 3. Standalone dates anywhere in document with 4-digit year (1980–2035)
    standalone_pat = (
        rf'\b('
        rf'\d{{1,2}}[\s\-\/\.]*{months}[\s\-\/\.]*(?:19\d\d|20[0-3]\d)|'
        rf'{months}[\s\-\/\.]*\d{{1,2}},?[\s\-\/\.]*(?:19\d\d|20[0-3]\d)|'
        rf'\d{{1,2}}[\/\-\.]\d{{1,2}}[\/\-\.](?:19\d\d|20[0-3]\d)|'
        rf'(?:19\d\d|20[0-3]\d)[\/\-\.]\d{{1,2}}[\/\-\.]\d{{1,2}}'
        rf')\b'
    )
    m2 = re.search(standalone_pat, text, re.I)
    if m2:
        return _clean(m2.group(1))

    return None


# ──────────────────────────────────────────────────────────────────
# 5. Facility / Hospital
# ──────────────────────────────────────────────────────────────────

def extract_facility(text: str) -> str | None:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]

    _HOSP_KW = re.compile(
        r'\b(h[o0c]spitals?|cl[i1l]n[i1]cs?|d[i1]agnost[i1]c(?:\s+cent(?:er|re))?|med[i1]cal|health\s*care|pathology|laborator(?:y|ies))\b',
        re.I,
    )

    def _is_noise(s: str) -> bool:
        """True for phone-only, URL, e-mail, or pure-number lines."""
        return bool(re.match(
            r'^[\+\d\s\(\)\-\.]+$'
            r'|^www\.'
            r'|^https?://'
            r'|.*@',
            s, re.I,
        ))

    def _is_skip_word(s: str) -> bool:
        """True for boilerplate slogans we don't want as prefixes."""
        return bool(re.match(
            r'^(?:exceptional|care|always|together|healthier|tomorrow)',
            s, re.I,
        ))

    header = lines[:8]

    for idx, line in enumerate(header):
        if not _HOSP_KW.search(line):
            continue

        # ── Does a real brand word come BEFORE the keyword in this line? ──────
        # e.g. "Apollo Hospitals Dhaka" or "National Hospital"
        kw_m = _HOSP_KW.search(line)
        prefix_text = line[:kw_m.start()]
        prefix_words = re.findall(r'[A-Za-z]{2,}', prefix_text)
        if prefix_words:
            # Keyword is embedded – the whole line IS the name.
            # But first strip any leading label word like "Facility: " or "Hospital: ".
            clean_line = re.sub(
                r'^\s*(?:facility|hospital|clinic|diagnostic\s+cent(?:er|re)|center|centre|lab)\s*[:\-]\s*',
                '', line, flags=re.I,
            ).strip(' :;,-')
            return clean_line[:75]

        # ── Is there meaningful text AFTER the keyword? ───────────────────────
        # e.g. "Hospital: Square Hospital Ltd"  or  "Clinic: Green Life"
        # Strip a leading "Hospital: " / "Facility: " label prefix first.
        stripped_prefix = re.sub(
            r'^\s*(?:hospital|clinic|facility|diagnostic\s+cent(?:er|re)|center|centre|lab)\s*[:\-]\s*',
            '', line, flags=re.I,
        ).strip(' :;,-')
        # Remove the keyword itself before counting words, so a bare "Hospital" line
        # doesn't falsely look like it has content.
        no_kw = _HOSP_KW.sub('', stripped_prefix).strip()
        suffix_words = re.findall(r'[A-Za-z]{2,}', no_kw)
        if suffix_words and not _is_noise(stripped_prefix):
            return stripped_prefix[:75]

        # ── Line is just the bare keyword (e.g. "Hospital") – look backward ──
        for prev_idx in range(idx - 1, max(idx - 4, -1), -1):
            prev = header[prev_idx]
            if not prev or _is_noise(prev) or _is_skip_word(prev):
                continue
            # Skip pure-number / address fragments
            if re.match(r'^[\d\s\+\-\(\)\.\/,]+$', prev):
                continue
            return f"{prev} {line}"[:75]

        # Fallback: bare keyword line
        return line[:75]

    # ── No keyword in header – try an inline label anywhere in the text ───────
    # e.g. "Facility: Dhaka Medical College Hospital"
    # Require a colon/dash after the label word to avoid false matches inside names.
    m = re.search(
        r'\b(?:facility|hospital|clinic|center|centre|diagnostic\s+cent(?:er|re))\b\s*[:\-\.]\s*'
        r'([A-Za-z][A-Za-z \t\.\,\&]{3,70})',
        text, re.I,
    )
    if m:
        return _clean(m.group(1)[:75])

    return None


# ──────────────────────────────────────────────────────────────────
# 6. Doctor / Consultant
# ──────────────────────────────────────────────────────────────────

def extract_doctor(text: str) -> str | None:
    patterns = [
        # Ref By: Dr. Shamsul Huda / Peferred By: Dr: Shamsul Huda (tolerates OCR typo P for R)
        r"(?:[pr]ef(?:erred)?\s*(?:by|\.)?|consultant|physician|doctor|reported\s*by|signed\s*by)\s*[:\-\.]?\s*((?:Dr[\.:]?)?\s*[A-Z][A-Za-z \t\.\-]{2,35})",
        # Dr. Shamsul Huda (explicit Dr. Name)
        r"(?:^|\n)\s*(Dr[\.:]\s+[A-Z][A-Za-z \t\.\-]{2,30})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.I | re.MULTILINE)
        if m:
            raw = m.group(1).strip()
            raw = re.split(r'[\(\[\n\t\|]|\b(?:consultant|mbbs|fcps|md|ms|mrcp|frcs|dgo|phd|department|complete|pathology|date|exam)\b', raw, flags=re.I)[0].strip(' :;,-')
            raw = re.sub(r'^Dr[\.:]?\s*', '', raw, flags=re.I).strip()
            name = _valid_name(raw)
            if name:
                return f"Dr. {name}"

    return None


# ──────────────────────────────────────────────────────────────────
# 7. Findings / Observations
# ──────────────────────────────────────────────────────────────────

def extract_findings(text: str) -> str | None:
    pat = (
        r"(?:^|\n)\s*(?:findings?|radiological\s+findings?|sonographic\s+findings?|observations?)\s*[:\-\.]?\s*\n?"
        r"([\s\S]+?)"
        r"(?=\n\s*(?:im[pd]ression|diagnosis|[ap]dvice|recommendation|conclusion|signature|dr\.|\n\s*\n\s*\n|$))"
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
        # Impression / Imdression: ...
        r"(?:^|\n)\s*(?:im[pd]ression|radiological\s+impression|sonographic\s+impression|conclusion|opinion)\s*[:\-\.]?\s*([\s\S]+?)(?=\n\s*(?:[ap]dvice|recommendation|signature|dr\.|\n\s*\n|$))",
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
# 9. Variable Lab & Imaging Parameter Extractor
# ──────────────────────────────────────────────────────────────────

_UNITS_REGEX = (
    r'(?:g/dL|mg/dL|mmol/L|umol/L|µmol/L|IU/L|U/L|uIU/mL|mIU/L|ng/mL|pg/mL|%|'
    r'/cumm|cells/uL|cells/µL|/uL|/µL|/HPF|lakh/cumm|mm/hr|cm|mm|mg/L|g/L|ratio|sec|'
    r'x10\^9/L|10\^3/uL|10\^6/uL|fl|fL|pg)'
)

def extract_test_results(text: str) -> list[dict]:
    # Normalise common OCR unit slash errors: mgidL, mgldL, gidL, gldL, Icumm, lcumm
    norm_text = re.sub(r'\bmg[il1]dL\b', 'mg/dL', text, flags=re.I)
    norm_text = re.sub(r'\bg[il1]dL\b', 'g/dL', norm_text, flags=re.I)
    norm_text = re.sub(r'\b[Il1]cumm\b', '/cumm', norm_text, flags=re.I)
    norm_text = re.sub(r'\blakh[il1]cumm\b', 'lakh/cumm', norm_text, flags=re.I)

    results = []
    seen = set()
    lines = [ln.strip() for ln in norm_text.splitlines() if ln.strip()]

    # 1. Single-line pattern: Parameter: Value [Unit] [Ref]
    inline_pat = re.compile(
        rf'^\s*([A-Za-z][A-Za-z0-9\s\(\)\/\-\.\+]{{2,35}}?)\s*[:\-]\s*([<>]?\s*\d[\d\.,\-\/]*|Positive|Negative|Nil|Trace|Non-reactive|Reactive|[ABO][\s\+-]+(?:Positive|Negative|Pos|Neg))\s*({_UNITS_REGEX})?(?:[^\n\r]*?\(?([<>]?\s*[\d\.\s\-–]+|Negative|Nil|Normal)\)?)?',
        re.I
    )

    # 2. Multi-column table row without colon: Parameter Name    Value   Unit   Ref
    table_pat = re.compile(
        rf'^\s*([A-Za-z][A-Za-z0-9\s\(\)\/\-\.\+]{{2,35}}?)\s{{2,}}([<>]?\s*\d[\d\.,\-\/]*|Positive|Negative|Nil|Trace|Non-reactive|Reactive|[ABO][\s\+-]+(?:Positive|Negative|Pos|Neg))\s*({_UNITS_REGEX})?(?:[^\n\r]*?\(?([<>]?\s*[\d\.\s\-–]+|Negative|Nil|Normal)\)?)?',
        re.I
    )

    i = 0
    while i < len(lines):
        line = lines[i]

        # Try single-line colon format
        m = inline_pat.search(line) or table_pat.search(line)
        if m:
            param = _clean(m.group(1))
            val = m.group(2).strip()
            unit = (m.group(3) or '').strip()
            ref = (m.group(4) or '').strip(' ()[]') or None

            _DEMO_SKIP = {
                'findings', 'impression', 'technique', 'patient name', 'referred by',
                'date', 'pge sex', 'age sex', 'page',
                'sex', 'age', 'gender', 'age sex', 'sex age', 'age/sex', 'sex/age',
                'pge', 'name', 'patient', 'dob', 'ref by', 'uhid', 'id',
            }
            if param and len(param) >= 2 and param.lower() not in _DEMO_SKIP:
                key = param.lower()
                if key not in seen:
                    seen.add(key)
                    results.append({'parameter': param, 'value': val, 'unit': unit, 'reference_range': ref})
            i += 1
            continue

        # Try two-line pattern (where OCR put Parameter Name on line i, and Value Unit on line i+1)
        if i + 1 < len(lines):
            next_line = lines[i + 1]
            m_next = re.search(
                rf'^([<>]?\s*\d[\d\.,\-\/]*|Positive|Negative|Nil|Trace|Non-reactive|Reactive|[ABO][\s\+-]+(?:Positive|Negative|Pos|Neg))\s*({_UNITS_REGEX})?(?:[^\n\r]*?\(?([<>]?\s*[\d\.\s\-–]+|Negative|Nil|Normal)\)?)?',
                next_line,
                re.I
            )
            if m_next and len(line) <= 35 and re.match(r'^[A-Za-z][A-Za-z0-9\s\(\)\/\-\.\+]{2,35}:?$', line):
                param = _clean(line)
                val = m_next.group(1).strip()
                unit = (m_next.group(2) or '').strip()
                ref = (m_next.group(3) or '').strip(' ()[]') or None

                if param and param.lower() not in (
                    'findings', 'impression', 'technique', 'complete bloodcount', 'metabolic panel',
                    'date', 'date of test', 'patient name',
                    'sex', 'age', 'gender', 'name', 'patient', 'dob', 'ref by', 'uhid', 'id', 'pge',
                ):
                    key = param.lower()
                    if key not in seen:
                        seen.add(key)
                        results.append({'parameter': param, 'value': val, 'unit': unit, 'reference_range': ref})
                    i += 2
                    continue

        i += 1

    # 3. Imaging & anatomical criteria measurements (e.g. 'L4-L5 disc shows 3.5 mm' or 'CBD: 4.2 mm')
    measure_pat = re.compile(
        r'^\s*([A-Za-z0-9][A-Za-z0-9\s\-\.]{2,35}?)\s*(?:shows?|shoivs?|heightis|measures?|is|:)\s*([^\n\r]*?\b(\d+[\.\d]*\s*(?:mm|cm|x\s*\d+[\.\d]*\s*(?:mm|cm)))\b[^\n\r]*)',
        re.I | re.MULTILINE
    )
    for m in measure_pat.finditer(norm_text):
        param = _clean(m.group(1))
        val_str = _clean(m.group(2))
        if not param or not val_str or len(param) < 2:
            continue

        unit_m = re.search(r'\b(mm|cm)\b', val_str, re.I)
        unit = unit_m.group(1) if unit_m else ''

        key = param.lower()
        if key not in seen and param.lower() not in ('slice thickness', 'technique', 'date', 'findings'):
            seen.add(key)
            results.append({
                'parameter': param,
                'value': val_str,
                'unit': unit,
                'reference_range': None,
            })

    return results[:40]


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
