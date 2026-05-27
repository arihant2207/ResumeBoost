from app.models.domain import JobDescriptionRecord, ResumeRecord, SessionRecord


class InMemoryStore:
    """MVP store — replaced by database in a later phase."""

    def __init__(self) -> None:
        self.resumes: dict[str, ResumeRecord] = {}
        self.job_descriptions: dict[str, JobDescriptionRecord] = {}
        self.sessions: dict[str, SessionRecord] = {}


store = InMemoryStore()
