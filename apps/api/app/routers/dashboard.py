"""
Dashboard endpoints — read-only aggregation views over Supabase data.

Architecture note: the frontend never queries Supabase directly with the
anon key for this data (RLS policies on sessions/optimization_jobs/ats_scores
do not currently grant anon-level reads). Instead, the backend uses the
Supabase service-role client to fetch and shape the data, and the frontend
calls this REST endpoint like any other backend route.

Known limitation (tracked separately, not fixed here): sessions/optimization_jobs/
ats_scores do not yet store a user_id column, so this endpoint currently returns
the most recent sessions across ALL users rather than filtering per-user. Proper
per-user filtering requires adding auth middleware to the FastAPI backend that can
verify the caller's Supabase JWT and extract their user_id — a separate, larger
piece of work. Until that exists, do not present this dashboard data as private
to the logged-in user.
"""

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter

from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

RECENT_SESSIONS_LIMIT = 50
RETENTION_DAYS = 30


def _truncate(text: str | None, length: int = 160) -> str:
    if not text:
        return ""
    text = text.strip()
    return text if len(text) <= length else text[: length - 1].rstrip() + "…"


@router.get("/sessions")
def get_dashboard_sessions() -> list[dict]:
    """
    Returns the most recent sessions enriched with their optimization result
    and ATS score, shaped for the frontend's ResumeSession interface.

    Never raises on failure — returns an empty list and logs the exception,
    so a Supabase outage degrades the dashboard to an empty state rather
    than a 500 error.
    """
    client = get_supabase_client()
    if client is None:
        logger.warning("Supabase client unavailable — returning empty dashboard list.")
        return []

    try:
        sessions_resp = (
            client.table("sessions")
            .select("id, resume_id, job_description_id, created_at")
            .order("created_at", desc=True)
            .limit(RECENT_SESSIONS_LIMIT)
            .execute()
        )
        sessions = sessions_resp.data or []
        if not sessions:
            return []

        session_ids = [s["id"] for s in sessions]
        resume_ids = list({s["resume_id"] for s in sessions if s.get("resume_id")})
        jd_ids = list({s["job_description_id"] for s in sessions if s.get("job_description_id")})

        # Fetch related data in bulk rather than per-session (N+1 avoidance)
        optimization_resp = (
            client.table("optimization_jobs")
            .select("session_id, result, status, completed_at")
            .in_("session_id", session_ids)
            .execute()
        )
        optimizations_by_session = {
            row["session_id"]: row for row in (optimization_resp.data or [])
        }

        ats_resp = (
            client.table("ats_scores")
            .select("session_id, overall_score, matched_keywords, missing_keywords")
            .in_("session_id", session_ids)
            .execute()
        )
        ats_by_session = {row["session_id"]: row for row in (ats_resp.data or [])}

        resumes_by_id: dict[str, dict] = {}
        if resume_ids:
            resumes_resp = (
                client.table("resumes")
                .select("id, filename, structured_content")
                .in_("id", resume_ids)
                .execute()
            )
            resumes_by_id = {row["id"]: row for row in (resumes_resp.data or [])}

        jds_by_id: dict[str, dict] = {}
        if jd_ids:
            jds_resp = (
                client.table("job_descriptions")
                .select("id, raw_text")
                .in_("id", jd_ids)
                .execute()
            )
            jds_by_id = {row["id"]: row for row in (jds_resp.data or [])}

        results = []
        for session in sessions:
            session_id = session["id"]
            resume = resumes_by_id.get(session.get("resume_id"), {})
            jd = jds_by_id.get(session.get("job_description_id"), {})
            ats = ats_by_session.get(session_id, {})
            optimization = optimizations_by_session.get(session_id, {})

            created_at_str = session.get("created_at")
            expires_at_str = None
            if created_at_str:
                try:
                    created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    expires_dt = created_dt + timedelta(days=RETENTION_DAYS)
                    expires_at_str = expires_dt.isoformat()
                except (ValueError, AttributeError):
                    expires_at_str = None

            structured = resume.get("structured_content") or {}
            contact = structured.get("contact", {}) if isinstance(structured, dict) else {}
            resume_name = (
                resume.get("filename")
                or contact.get("name")
                or "Untitled resume"
            )

            results.append({
                "id": session_id,
                "resume_name": resume_name,
                "jd_preview": _truncate(jd.get("raw_text")),
                "ats_score": ats.get("overall_score"),
                "matched_skills": ats.get("matched_keywords") or [],
                "missing_skills": ats.get("missing_keywords") or [],
                "optimization_status": optimization.get("status"),
                "pdf_url": None,  # PDFs are generated on-demand, not stored as files
                "created_at": created_at_str,
                "expires_at": expires_at_str,
            })

        return results

    except Exception:
        logger.exception("Failed to load dashboard sessions from Supabase.")
        return []