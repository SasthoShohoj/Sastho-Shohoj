"""
ocr_processor.py
─────────────────────────────────────────────────────────────────
Handles:
  - PDF → image conversion (via PyMuPDF / fitz)
  - Image preprocessing (Pillow / numpy) for better OCR accuracy
  - EasyOCR text extraction
  - Returns raw text + per-page metadata
"""

import io
import os
import logging
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

logger = logging.getLogger(__name__)

# ── Lazy-load EasyOCR reader (heavy — load once) ─────────────────
_reader = None

def get_reader():
    global _reader
    if _reader is None:
        import easyocr
        logger.info('Initialising EasyOCR reader…')
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        logger.info('EasyOCR ready.')
    return _reader


# ── Image preprocessing ───────────────────────────────────────────

def preprocess_image(pil_img: Image.Image) -> np.ndarray:
    """
    Greyscale → sharpen → contrast boost → numpy array for EasyOCR.
    Keeps originals >= 1800 px wide to preserve text detail.
    """
    img = pil_img.convert('RGB')

    # Upscale small scans
    w, h = img.size
    if w < 1200:
        scale = 1200 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # Greyscale
    grey = img.convert('L')

    # Sharpen
    grey = grey.filter(ImageFilter.SHARPEN)

    # Contrast
    grey = ImageEnhance.Contrast(grey).enhance(1.4)

    return np.array(grey.convert('RGB'))


# ── PDF → list of PIL images ─────────────────────────────────────

def pdf_to_images(file_bytes: bytes, dpi: int = 200) -> list[Image.Image]:
    import pymupdf as fitz  # PyMuPDF
    doc = fitz.open(stream=file_bytes, filetype='pdf')
    images = []
    mat = fitz.Matrix(dpi / 72, dpi / 72)   # scale factor
    for page in doc:
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        images.append(img)
    doc.close()
    return images


# ── Core OCR ─────────────────────────────────────────────────────

def ocr_image(pil_img: Image.Image) -> tuple[str, float]:
    """
    Returns (text, avg_confidence).
    """
    reader = get_reader()
    arr = preprocess_image(pil_img)
    results = reader.readtext(arr, detail=1, paragraph=False)

    lines, confs = [], []
    for (_bbox, text, conf) in results:
        lines.append(text)
        confs.append(conf)

    full_text = '\n'.join(lines)
    avg_conf  = float(np.mean(confs)) if confs else 0.0
    return full_text, avg_conf


def process_file(file_bytes: bytes, filename: str) -> dict:
    """
    Main entry point.

    Returns:
        {
          raw_text: str,
          page_count: int,
          avg_confidence: float,
          file_type: 'pdf' | 'image',
        }
    """
    ext = Path(filename).suffix.lower()
    is_pdf = ext == '.pdf'

    if is_pdf:
        images = pdf_to_images(file_bytes)
    else:
        images = [Image.open(io.BytesIO(file_bytes))]

    page_texts, all_confs = [], []
    for img in images:
        text, conf = ocr_image(img)
        page_texts.append(text)
        all_confs.append(conf)

    raw_text     = '\n\n--- PAGE BREAK ---\n\n'.join(page_texts)
    avg_conf     = float(np.mean(all_confs)) if all_confs else 0.0

    return {
        'raw_text':       raw_text,
        'page_count':     len(images),
        'avg_confidence': round(avg_conf * 100, 1),
        'file_type':      'pdf' if is_pdf else 'image',
    }
