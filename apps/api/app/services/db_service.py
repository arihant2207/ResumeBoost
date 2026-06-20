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
import uuid
from datetime import datetime, timezone

from app.models.domain import JobDescriptionRecord, ResumeRecord, SessionRecord
from app.schemas.analysis import ResumeAnalysisResponse
from app.schemas.optimization import OptimizeSessionResponse
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Resumes ───────────────────────────────────────────────────────────────────

def save_resume(resume: ResumeRecord) -> None:
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
) -> str | None:
    """
    Upsert the AI optimization result into the `optimization_jobs` table.
    Returns the generated optimization_job id on success, None on failure.
    """
    client = get_supabase_client()
    if client is None:
        return None

    job_id = str(uuid.uuid4())
    try:
        client.table("optimization_jobs").upsert({
            "id": job_id,
            "session_id": session_id,
            "status": "completed",
            "result": result.model_dump(),
            "completed_at": _now_iso(),
            "created_at": _now_iso(),
        }).execute()
        logger.info("Saved optimization result session_id=%s job_id=%s to Supabase", session_id, job_id)
        return job_id
    except Exception:
        logger.exception(
            "Failed to save optimization result session_id=%s to Supabase", session_id
        )
        return None


# ── ATS scores ─────────────────────────────────────────────────────────────────

def save_ats_score(
    session_id: str,
    analysis: ResumeAnalysisResponse,
) -> None:
    """
    Upsert the ATS analysis result into the `ats_scores` table.
    Linked via session_id so the dashboard can join sessions -> ats_scores.
    """
    client = get_supabase_client()
    if client is None:
        return

    try:
        client.table("ats_scores").upsert({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "overall_score": analysis.match_percentage,
            "keyword_score": analysis.match_percentage,
            "formatting_score": None,
            "structure_score": None,
            "breakdown": None,
            "matched_keywords": analysis.matched_skills,
            "missing_keywords": analysis.missing_skills,
            "suggestions": analysis.improvement_suggestions,
            "created_at": _now_iso(),
        }).execute()
        logger.info("Saved ats_score session_id=%s to Supabase", session_id)
    except Exception:
        logger.exception("Failed to save ats_score session_id=%s to Supabase", session_id)