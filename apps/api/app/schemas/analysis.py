from pydantic import BaseModel, Field


class ResumeAnalysisResponse(BaseModel):
    """ATS-focused resume vs job description analysis from Claude."""

    match_percentage: int = Field(
        ...,
        ge=0,
        le=100,
        description="Honest overall fit score (0–100) based on evidence in the resume only.",
        examples=[72],
    )
    matched_skills: list[str] = Field(
        default_factory=list,
        description="Skills or requirements clearly supported by the resume.",
        examples=[["Python", "FastAPI", "REST APIs"]],
    )
    missing_skills: list[str] = Field(
        default_factory=list,
        description="Important JD skills or requirements not evidenced in the resume.",
        examples=[["Kubernetes", "GraphQL"]],
    )
    ats_keywords: list[str] = Field(
        default_factory=list,
        description="High-value ATS keywords from the JD to consider emphasizing.",
        examples=[["microservices", "CI/CD", "PostgreSQL"]],
    )
    strengths: list[str] = Field(
        default_factory=list,
        description="Specific resume strengths relative to this role.",
        examples=[["Strong backend API experience aligned with stack"]],
    )
    improvement_suggestions: list[str] = Field(
        default_factory=list,
        description="Actionable suggestions; do not invent experience.",
        examples=[["Add measurable impact metrics to recent role bullets"]],
    )
