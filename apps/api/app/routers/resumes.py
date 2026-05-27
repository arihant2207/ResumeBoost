import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import settings
from app.models.domain import ResumeRecord
from app.schemas.resume import ResumeResponse
from app.services.extraction import ALLOWED_MIME_TYPES, extract_resume_text
from app.services.mappers import resume_to_response
from app.services.resume_parser import parse_resume_structure
from app.services.storage import store

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(file: UploadFile = File(...)) -> ResumeResponse:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "INVALID_FILE", "message": "Filename is required."}},
        )

    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "INVALID_MIME",
                    "message": "Only PDF and DOCX files are supported.",
                }
            },
        )

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "FILE_TOO_LARGE",
                    "message": f"File must be under {settings.max_upload_bytes // (1024 * 1024)} MB.",
                }
            },
        )

    if not data:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "EMPTY_FILE", "message": "Uploaded file is empty."}},
        )

    try:
        raw_text, metadata = extract_resume_text(data, mime_type)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "EXTRACTION_FAILED", "message": str(exc)}},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "EXTRACTION_FAILED",
                    "message": "Could not extract text from the file.",
                }
            },
        ) from exc

    structured = parse_resume_structure(raw_text)
    record = ResumeRecord(
        id=str(uuid.uuid4()),
        filename=file.filename,
        mime_type=mime_type,
        file_size_bytes=len(data),
        raw_text=raw_text,
        structured_content=structured,
        extraction_metadata=metadata,
    )
    store.resumes[record.id] = record
    return resume_to_response(record)


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: str) -> ResumeResponse:
    record = store.resumes.get(resume_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Resume not found."}},
        )
    return resume_to_response(record)
