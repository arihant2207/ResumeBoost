from io import BytesIO

from docx import Document


def extract_text_from_docx(data: bytes) -> tuple[str, dict]:
    """Extract plain text from DOCX bytes. Returns (text, metadata)."""
    warnings: list[str] = []
    doc = Document(BytesIO(data))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    raw = "\n\n".join(paragraphs).strip()
    if not raw:
        warnings.append("No extractable text found in the document.")
    return raw, {
        "parser": "python-docx",
        "paragraph_count": len(paragraphs),
        "char_count": len(raw),
        "warnings": warnings,
    }
