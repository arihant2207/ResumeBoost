import logging
import re
from fastapi import APIRouter, HTTPException, Response

from app.schemas.optimization import OptimizeSessionResponse
from app.services.pdf_service import pdf_service, PDFGenerationError
from app.services.session_loader import load_session_bundle

logger = logging.getLogger(__name__)
router = APIRouter(tags=["pdf"])


@router.post(
    "/generate-pdf/{session_id}",
    summary="Generate optimized ATS-friendly PDF resume",
    description="Loads optimized resume data from the existing session and compiles it into a downloadable PDF.",
    responses={
        404: {"description": "Session or linked data not found"},
        422: {"description": "Missing or invalid optimized data"},
        502: {"description": "PDF generation or compilation failures"},
    }
)
def generate_pdf(session_id: str) -> Response:
    bundle = load_session_bundle(session_id)

    optimized_data = getattr(bundle.session, "optimized_data", None)
    if not optimized_data:
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "MISSING_OPTIMIZATION", "message": "Run optimization first."}},
        )

    try:
        if not isinstance(optimized_data, OptimizeSessionResponse):
            if isinstance(optimized_data, dict):
                optimized_data = OptimizeSessionResponse.model_validate(optimized_data)
            else:
                raise ValueError("Optimized data is not in the correct format.")
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail={"error": {"code": "INVALID_OPTIMIZED_DATA", "message": str(exc)}},
        )

    resume = bundle.resume
    structured = resume.structured_content
    contact_info = structured.get("contact", {})

    # Skill category mapping — auto-categorize from flat list
    SKILL_CATEGORIES = {
        "Languages": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "swift", "kotlin", "j.s."],
        "AI/ML": ["nlp", "machine learning", "machine learning basics", "tensorflow", "pytorch", "scikit-learn", "llms", "rag", "fine-tuning", "huggingface", "computer vision", "stable diffusion", "langchain", "langgraph", "faiss", "pinecone", "mlflow"],
        "Frameworks": ["react.js", "react", "fastapi", "flask", "node.js", "express", "django", "rest apis", "rest api design", "fetch api", "langchain"],
        "Frontend": ["html", "css", "tailwind css", "leaflet.js", "leaflet", "openstreetmap"],
        "Cloud & DB": ["aws", "gcp", "google cloud", "oracle cloud", "azure", "postgresql", "mysql", "sqlite", "mongodb", "sql", "firebase"],
        "Tools": ["git", "docker", "vs code", "jupyter", "ci/cd", "agile", "microservices", "system design"],
    }

    def _build_categories(technical_list: list) -> list:
        """Auto-categorize skills from flat list."""
        used = set()
        result = []
        for label, keywords in SKILL_CATEGORIES.items():
            matched = []
            for skill in technical_list:
                if skill.lower() in keywords and skill not in used:
                    matched.append(skill)
                    used.add(skill)
            if matched:
                result.append({"label": label, "skills": matched})
        # Remaining uncategorized skills
        remaining = [s for s in technical_list if s not in used]
        if remaining:
            result.append({"label": "Other", "skills": remaining})
        return result

    # Skills — prefer AI optimized
    ai_skills = getattr(optimized_data, "optimized_skills", None)
    ai_categories = getattr(ai_skills, "categories", []) or []
    if ai_skills and (ai_skills.technical or ai_skills.soft or ai_categories):
        # If AI returned categories use them, else auto-generate
        if ai_categories:
            built_categories = [
                {"label": cat.label, "skills": cat.skills}
                for cat in ai_categories
                if cat.skills
            ]
        else:
            built_categories = _build_categories(ai_skills.technical)
        skills = {
            "categories": built_categories,
            "technical": ai_skills.technical,
            "soft": ai_skills.soft,
        }
    else:
        raw_skills = structured.get("skills", {})
        if isinstance(raw_skills, list):
            skills = {"categories": [], "technical": raw_skills, "soft": []}
        elif isinstance(raw_skills, dict):
            skills = {
                "categories": [],
                "technical": raw_skills.get("technical", raw_skills.get("technical_skills", [])),
                "soft": raw_skills.get("soft", raw_skills.get("soft_skills", [])),
            }
        else:
            skills = {"categories": [], "technical": [], "soft": []}

    resume_data = {
        "contact": contact_info,
        "role_titles": getattr(optimized_data, "role_titles", []),
        "summary": optimized_data.optimized_summary,
        "experience": [
            {
                "company": exp.company,
                "title": exp.title,
                "location": exp.location,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "bullets": exp.bullets,
            }
            for exp in optimized_data.optimized_experience
        ],
        "projects": [
            {
                "name": proj.name,
                "description": proj.description if hasattr(proj, "description") else "",
                "bullets": proj.bullets if hasattr(proj, "bullets") else [],
                "technologies": proj.technologies,
                "start_date": structured.get("projects", [{}])[i].get("start_date", "") if i < len(structured.get("projects", [])) else "",
                "end_date": structured.get("projects", [{}])[i].get("end_date", "") if i < len(structured.get("projects", [])) else "",
                "url": structured.get("projects", [{}])[i].get("url", "") if i < len(structured.get("projects", [])) else "",
            }
            for i, proj in enumerate(optimized_data.optimized_projects)
        ],
        "skills": skills,
        "education": structured.get("education", []),
        "certifications": [c for c in structured.get("certifications", []) if c and str(c).strip()],
        "achievements": [a for a in structured.get("achievements", []) if a and str(a).strip()],
    }

    # Filename
    raw_name = contact_info.get("name", "").strip()
    filename = "Optimized_Resume.pdf"
    if raw_name:
        parts = [p for p in re.split(r"\s+", raw_name) if p]
        if len(parts) >= 2:
            firstname = re.sub(r"[^\w\-_]", "", parts[0])
            lastname = re.sub(r"[^\w\-_]", "", parts[-1])
            if firstname and lastname:
                filename = f"{firstname}_{lastname}_Resume.pdf"
        elif len(parts) == 1:
            name_cleaned = re.sub(r"[^\w\-_]", "", parts[0])
            if name_cleaned:
                filename = f"{name_cleaned}_Resume.pdf"

    logger.info("Generating PDF session_id=%s filename=%s", session_id, filename)

    try:
        html_content = pdf_service.render_resume_to_html(resume_data)
        pdf_bytes = pdf_service.generate_pdf_from_html(html_content)
    except PDFGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail={"error": {"code": "PDF_GENERATION_FAILED", "message": str(exc)}},
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )