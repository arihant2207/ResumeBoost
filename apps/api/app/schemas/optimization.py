from pydantic import BaseModel, Field


class OptimizedProject(BaseModel):
    name: str = Field(..., description="Project name (MUST match original exactly)")
    description: str = Field(default="", description="Optional paragraph description")
    bullets: list[str] = Field(default_factory=list, description="MNC-style bullet points for the project")
    technologies: list[str] = Field(default_factory=list, description="Technologies used")


class OptimizedExperience(BaseModel):
    company: str = Field(..., description="Company name (MUST match original exactly)")
    title: str = Field(..., description="Job title")
    location: str = Field(default="", description="Location")
    start_date: str = Field(..., description="Start date (MUST match original exactly)")
    end_date: str = Field(..., description="End date (MUST match original exactly)")
    bullets: list[str] = Field(default_factory=list, description="MNC-style bullet points")


class SkillCategory(BaseModel):
    label: str = Field(..., description="Category label, e.g. 'Languages', 'AI/ML'")
    skills: list[str] = Field(default_factory=list, description="Skills under this category")


class OptimizedSkills(BaseModel):
    categories: list[SkillCategory] = Field(
        default_factory=list,
        description="Skills grouped into categories like Languages, AI/ML, Frameworks, etc.",
    )
    technical: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)


class OptimizeSessionResponse(BaseModel):
    role_titles: list[str] = Field(
        default_factory=list,
        description="2-3 role titles based on candidate's skills and the job description",
    )
    optimized_summary: str = Field(..., description="Optimized professional summary.")
    optimized_projects: list[OptimizedProject] = Field(default_factory=list)
    optimized_experience: list[OptimizedExperience] = Field(default_factory=list)
    optimized_skills: OptimizedSkills = Field(default_factory=OptimizedSkills)