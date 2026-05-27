import uuid

from fastapi import APIRouter, HTTPException

from app.models.domain import JobDescriptionRecord
from app.schemas.job_description import JobDescriptionCreate, JobDescriptionResponse
from app.services.mappers import job_description_to_response
from app.services.storage import store

router = APIRouter(prefix="/job-descriptions", tags=["job-descriptions"])

MIN_JD_LENGTH = 50


@router.post("", response_model=JobDescriptionResponse, status_code=201)
def create_job_description(body: JobDescriptionCreate) -> JobDescriptionResponse:
    raw = body.raw_text.strip()
    if len(raw) < MIN_JD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "JD_TOO_SHORT",
                    "message": f"Job description must be at least {MIN_JD_LENGTH} characters.",
                }
            },
        )

    if body.resume_id and body.resume_id not in store.resumes:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Resume not found."}},
        )

    record = JobDescriptionRecord(
        id=str(uuid.uuid4()),
        raw_text=raw,
        resume_id=body.resume_id,
    )
    store.job_descriptions[record.id] = record
    return job_description_to_response(record)


@router.get("/{job_description_id}", response_model=JobDescriptionResponse)
def get_job_description(job_description_id: str) -> JobDescriptionResponse:
    record = store.job_descriptions.get(job_description_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Job description not found."}},
        )
    return job_description_to_response(record)
