import logging

from fastapi import APIRouter, BackgroundTasks

from app.schemas.optimization import OptimizeSessionResponse
from app.services.ai_service import optimize_resume_for_job
from app.services.db_service import save_optimization_result
from app.services.session_loader import load_session_bundle

logger = logging.getLogger(__name__)

router = APIRouter(tags=["optimization"])


@router.post(
    "/optimize-session/{session_id}",
    response_model=OptimizeSessionResponse,
    summary="Optimize resume summary, experience, and projects tailored to a job description (Gemini)",
    description=(
        "Loads the resume and job description linked to an existing session, "
        "runs Google Gemini to rewrite the professional summary, projects, and work experience "
        "sections tailored to the job description, and returns the optimized sections."
    ),
    responses={
        404: {"description": "Session or linked data not found"},
        422: {"description": "Resume or job description has no analyzable text"},
        429: {"description": "Gemini rate limit"},
        502: {"description": "Gemini API or response parsing error"},
        503: {"description": "AI not configured, overloaded, or unavailable"},
    },
)
def optimize_session(
    session_id: str,
    background_tasks: BackgroundTasks,
) -> OptimizeSessionResponse:
    bundle = load_session_bundle(session_id)
    logger.info("Optimize session requested session_id=%s", session_id)

    result = optimize_resume_for_job(
        bundle.resume,
        bundle.job_description.raw_text,
        session_id=session_id,
    )

    background_tasks.add_task(save_optimization_result, session_id, result)

    return result