from typing import Any

from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""


class ExperienceItem(BaseModel):
    company: str = ""
    title: str = ""
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    graduation_date: str = ""
    details: list[str] = Field(default_factory=list)


class SkillsBlock(BaseModel):
    technical: list[str] = Field(default_factory=list)
    soft: list[str] = Field(default_factory=list)


class StructuredResume(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str = ""
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    skills: SkillsBlock = Field(default_factory=SkillsBlock)
    certifications: list[str] = Field(default_factory=list)
    projects: list[dict[str, Any]] = Field(default_factory=list)


class ExtractionMetadata(BaseModel):
    parser: str
    page_count: int | None = None
    paragraph_count: int | None = None
    char_count: int
    warnings: list[str] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    id: str
    filename: str
    mime_type: str
    file_size_bytes: int
    raw_text: str
    structured_content: StructuredResume
    extraction_metadata: ExtractionMetadata
    created_at: str
