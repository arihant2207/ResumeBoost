import fitz  # PyMuPDF


def extract_text_from_pdf(data: bytes) -> tuple[str, dict]:
    """Extract plain text from PDF bytes. Returns (text, metadata)."""
    warnings: list[str] = []
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        page_count = len(doc)
        parts: list[str] = []
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                parts.append(text)
        raw = "\n\n".join(parts).strip()
        if not raw:
            warnings.append("No extractable text found; the PDF may be scanned/image-only.")
        return raw, {
            "parser": "pymupdf",
            "page_count": page_count,
            "char_count": len(raw),
            "warnings": warnings,
        }
    finally:
        doc.close()
