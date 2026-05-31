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

    # Skills — prefer AI optimized, fallback to original
    ai_skills = getattr(optimized_data, "optimized_skills", None)
    if ai_skills and (ai_skills.technical or ai_skills.soft):
        skills = {"technical": ai_skills.technical, "soft": ai_skills.soft}
    else:
        raw_skills = structured.get("skills", {})
        if isinstance(raw_skills, list):
            skills = {"technical": raw_skills, "soft": []}
        elif isinstance(raw_skills, dict):
            skills = {
                "technical": raw_skills.get("technical", raw_skills.get("technical_skills", [])),
                "soft": raw_skills.get("soft", raw_skills.get("soft_skills", [])),
            }
            if not skills["technical"] and not skills["soft"]:
                all_vals = []
                for v in raw_skills.values():
                    if isinstance(v, list):
                        all_vals.extend(v)
                    elif isinstance(v, str):
                        all_vals.append(v)
                skills = {"technical": all_vals, "soft": []}
        else:
            skills = {"technical": [], "soft": []}

    resume_data = {
        "contact": contact_info,
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
                "start_date": getattr(proj, "start_date", ""),
                "end_date": getattr(proj, "end_date", ""),
                "url": getattr(proj, "url", ""),
            }
            for proj in optimized_data.optimized_projects
        ],
        "skills": skills,
        "education": structured.get("education", []),
        "certifications": structured.get("certifications", []),
        "achievements": structured.get("achievements", []),
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