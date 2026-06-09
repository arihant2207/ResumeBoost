from pydantic import BaseModel

from app.schemas.job_description import JobDescriptionResponse
from app.schemas.resume import ResumeResponse


class SessionCreate(BaseModel):
    resume_id: str
    job_description_id: str


class SessionResponse(BaseModel):
    id: str
    resume: ResumeResponse
    job_description: JobDescriptionResponse