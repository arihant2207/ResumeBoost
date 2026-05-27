import logging

from fastapi import APIRouter

from app.schemas.analysis import ResumeAnalysisResponse
from app.services.ai_service import analyze_resume_for_job
from app.services.session_loader import load_session_bundle

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analysis"])


@router.post(
    "/analyze-session/{session_id}",
    response_model=ResumeAnalysisResponse,
    summary="Analyze resume against job description (Gemini)",
    description=(
        "Loads the resume and job description linked to an existing session, "
        "runs Google Gemini ATS analysis, and returns structured insights. "
        "Does not rewrite the resume or generate a PDF."
    ),
    responses={
        404: {"description": "Session or linked data not found"},
        422: {"description": "Resume or job description has no analyzable text"},
        429: {"description": "Gemini rate limit"},
        502: {"description": "Gemini API or response parsing error"},
        503: {"description": "AI not configured or unavailable"},
    },
)
def analyze_session(session_id: str) -> ResumeAnalysisResponse:
    bundle = load_session_bundle(session_id)
    logger.info("Analyze session requested session_id=%s", session_id)
    return analyze_resume_for_job(
        bundle.resume.raw_text,
        bundle.job_description.raw_text,
        session_id=session_id,
    )
