from app.services.extraction.docx_extractor import extract_text_from_docx
from app.services.extraction.pdf_extractor import extract_text_from_pdf

ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


def extract_resume_text(data: bytes, mime_type: str) -> tuple[str, dict]:
    kind = ALLOWED_MIME_TYPES.get(mime_type)
    if kind == "pdf":
        return extract_text_from_pdf(data)
    if kind == "docx":
        return extract_text_from_docx(data)
    raise ValueError(f"Unsupported mime type: {mime_type}")
