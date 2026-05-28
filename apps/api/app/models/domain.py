from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ResumeRecord:
    id: str
    filename: str
    mime_type: str
    file_size_bytes: int
    raw_text: str
    structured_content: dict[str, Any]
    extraction_metadata: dict[str, Any]
    created_at: datetime = field(default_factory=utc_now)


@dataclass
class JobDescriptionRecord:
    id: str
    raw_text: str
    resume_id: str | None
    created_at: datetime = field(default_factory=utc_now)


@dataclass
class SessionRecord:
    id: str
    resume_id: str
    job_description_id: str
    created_at: datetime = field(default_factory=utc_now)
    optimized_data: Any = None
