from app.models.domain import JobDescriptionRecord, ResumeRecord, SessionRecord
from app.schemas.job_description import JobDescriptionResponse
from app.schemas.resume import ExtractionMetadata, ResumeResponse, StructuredResume
from app.schemas.session import SessionResponse


def resume_to_response(record: ResumeRecord) -> ResumeResponse:
    return ResumeResponse(
        id=record.id,
        filename=record.filename,
        mime_type=record.mime_type,
        file_size_bytes=record.file_size_bytes,
        raw_text=record.raw_text,
        structured_content=StructuredResume.model_validate(record.structured_content),
        extraction_metadata=ExtractionMetadata.model_validate(record.extraction_metadata),
        created_at=record.created_at.isoformat(),
    )


def job_description_to_response(record: JobDescriptionRecord) -> JobDescriptionResponse:
    return JobDescriptionResponse(
        id=record.id,
        raw_text=record.raw_text,
        resume_id=record.resume_id,
        character_count=len(record.raw_text),
        created_at=record.created_at.isoformat(),
    )


def session_to_response(
    session: SessionRecord,
    resume: ResumeRecord,
    job_description: JobDescriptionRecord,
) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        resume=resume_to_response(resume),
        job_description=job_description_to_response(job_description),
        created_at=session.created_at.isoformat(),
    )
