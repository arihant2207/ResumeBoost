from pydantic import BaseModel, Field


class OptimizedProject(BaseModel):
    name: str = Field(..., description="Project name (MUST match original name exactly)")
    description: str = Field(..., description="Optimized description of the project and achievements")
    technologies: list[str] = Field(default_factory=list, description="Technologies used in the project")


class OptimizedExperience(BaseModel):
    company: str = Field(..., description="Company name (MUST match original company exactly)")
    title: str = Field(..., description="Job title")
    location: str = Field(..., description="Original location")
    start_date: str = Field(..., description="Start date (MUST match original start date exactly)")
    end_date: str = Field(..., description="End date (MUST match original end date exactly)")
    bullets: list[str] = Field(default_factory=list, description="Optimized accomplishment bullet points")


class OptimizedSkills(BaseModel):
    technical: list[str] = Field(default_factory=list, description="Technical skills reordered and highlighted to match JD keywords")
    soft: list[str] = Field(default_factory=list, description="Soft skills from original resume")


class OptimizeSessionResponse(BaseModel):
    optimized_summary: str = Field(..., description="Optimized professional summary.")
    optimized_projects: list[OptimizedProject] = Field(default_factory=list, description="Optimized projects section.")
    optimized_experience: list[OptimizedExperience] = Field(default_factory=list, description="Optimized work experience section.")
    optimized_skills: OptimizedSkills = Field(default_factory=OptimizedSkills, description="Skills reordered to prioritize JD-relevant keywords first.")