from fastapi import HTTPException

from app.models.domain import JobDescriptionRecord, ResumeRecord, SessionRecord
from app.services.storage import store


class SessionBundle:
    __slots__ = ("session", "resume", "job_description")

    def __init__(
        self,
        session: SessionRecord,
        resume: ResumeRecord,
        job_description: JobDescriptionRecord,
    ) -> None:
        self.session = session
        self.resume = resume
        self.job_description = job_description


def load_session_bundle(session_id: str) -> SessionBundle:
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
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Session data incomplete. Re-create the session.",
                }
            },
        )

    if not resume.raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "EMPTY_RESUME",
                    "message": "Resume has no extractable text to analyze.",
                }
            },
        )

    if not job_description.raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "EMPTY_JD",
                    "message": "Job description is empty.",
                }
            },
        )

    return SessionBundle(session, resume, job_description)
