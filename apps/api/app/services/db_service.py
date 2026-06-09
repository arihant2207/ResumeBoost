"""
Repository layer — all Supabase writes go through here.

Design principles:
- Every function is fire-and-forget safe: exceptions are caught and logged,
  never re-raised. The in-memory store remains the source of truth for the
  request lifecycle; Supabase is persistence only.
- Functions are synchronous (Supabase Python SDK v2 is sync).
  Call them inside FastAPI BackgroundTasks so they never block responses.
"""

import logging
from datetime import datetime, timezone

from app.models.domain import JobDescriptionRecord, ResumeRecord, SessionRecord
from app.schemas.optimization import OptimizeSessionResponse
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Resumes ───────────────────────────────────────────────────────────────────

def save_resume(resume: ResumeRecord) -> None:
    """Upsert a parsed resume record into the `resumes` table."""
    client = get_supabase_client()
    if client is None:
        return

    try:
        client.table("resumes").upsert({
            "id": resume.id,
            "filename": resume.filename,
            "mime_type": resume.mime_type,
            "file_size_bytes": resume.file_size_bytes,
            "raw_text": resume.raw_text,
            "structured_content": resume.structured_content,
            "extraction_metadata": resume.extraction_metadata,
            "created_at": resume.created_at.isoformat(),
        }).execute()
        logger.info("Saved resume id=%s to Supabase", resume.id)
    except Exception:
        logger.exception("Failed to save resume id=%s to Supabase", resume.id)


# ── Job Descriptions ──────────────────────────────────────────────────────────

def save_job_description(jd: JobDescriptionRecord) -> None:
    """Upsert a job description record into the `job_descriptions` table."""
    client = get_supabase_client()
    if client is None:
        return

    try:
        client.table("job_descriptions").upsert({
            "id": jd.id,
            "raw_text": jd.raw_text,
            "resume_id": jd.resume_id,
            "created_at": jd.created_at.isoformat(),
        }).execute()
        logger.info("Saved job_description id=%s to Supabase", jd.id)
    except Exception:
        logger.exception("Failed to save job_description id=%s to Supabase", jd.id)


# ── Sessions ──────────────────────────────────────────────────────────────────

def save_session(session: SessionRecord) -> None:
    """Upsert a session record into the `sessions` table."""
    client = get_supabase_client()
    if client is None:
        return

    try:
        client.table("sessions").upsert({
            "id": session.id,
            "resume_id": session.resume_id,
            "job_description_id": session.job_description_id,
            "created_at": session.created_at.isoformat(),
        }).execute()
        logger.info("Saved session id=%s to Supabase", session.id)
    except Exception:
        logger.exception("Failed to save session id=%s to Supabase", session.id)


# ── Optimization results ──────────────────────────────────────────────────────

def save_optimization_result(
    session_id: str,
    result: OptimizeSessionResponse,
) -> None:
    """
    Upsert the AI optimization result into the `optimization_jobs` table.
    Serialises the full Pydantic model as JSON.
    """
    client = get_supabase_client()
    if client is None:
        return

    try:
        client.table("optimization_jobs").upsert({
            "session_id": session_id,
            "result": result.model_dump(),
            "completed_at": _now_iso(),
        }).execute()
        logger.info("Saved optimization result session_id=%s to Supabase", session_id)
    except Exception:
        logger.exception(
            "Failed to save optimization result session_id=%s to Supabase", session_id
        )