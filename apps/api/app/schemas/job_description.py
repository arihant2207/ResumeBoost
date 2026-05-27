from pydantic import BaseModel, Field


class JobDescriptionCreate(BaseModel):
    raw_text: str = Field(..., min_length=1, max_length=15000)
    resume_id: str | None = None


class JobDescriptionResponse(BaseModel):
    id: str
    raw_text: str
    resume_id: str | None
    character_count: int
    created_at: str
