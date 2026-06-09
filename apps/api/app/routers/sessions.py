import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.domain import SessionRecord
from app.schemas.session import SessionCreate, SessionResponse
from app.services.db_service import save_session
from app.services.mappers import session_to_response
from app.services.storage import store

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
def create_session(body: SessionCreate, background_tasks: BackgroundTasks) -> SessionResponse:
    resume = store.resumes.get(body.resume_id)
    if not resume:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Resume not found."}},
        )

    job_description = store.job_descriptions.get(body.job_description_id)
    if not job_description:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Job description not found."}},
        )

    session = SessionRecord(
        id=str(uuid.uuid4()),
        resume_id=body.resume_id,
        job_description_id=body.job_description_id,
    )
    store.sessions[session.id] = session

    # Persist to Supabase in background — does not block the response
    background_tasks.add_task(save_session, session)

    return session_to_response(session, resume, job_description)


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str) -> SessionResponse:
    session = store.sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Session not found."}},
        )

    resume = store.resumes.get(session.resume_id)
    job_description = store.job_descriptions.get(session.job_description_id)
    if not resume or not job_description:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Session data incomplete."}},
        )

    return session_to_response(session, resume, job_description)