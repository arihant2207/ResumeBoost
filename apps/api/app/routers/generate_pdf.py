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
        404: {
            "description": "Session or linked data not found",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "NOT_FOUND", "message": "Session not found."}}
                }
            }
        },
        422: {
            "description": "Missing or invalid optimized data",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "MISSING_OPTIMIZATION", "message": "Session does not contain optimized resume data. Please run optimization first."}}
                }
            }
        },
        502: {
            "description": "PDF generation or compilation failures",
            "content": {
                "application/json": {
                    "example": {"error": {"code": "PDF_GENERATION_FAILED", "message": "PDF engine not initialized. Please ensure WeasyPrint and GTK+ libraries are installed."}}
                }
            }
        },
    }
)
def generate_pdf(session_id: str) -> Response:
    # 1. Load the session bundle
    bundle = load_session_bundle(session_id)
    
    # 2. Retrieve and validate optimized data
    optimized_data = getattr(bundle.session, "optimized_data", None)
    if not optimized_data:
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "MISSING_OPTIMIZATION",
                    "message": "Session does not contain optimized resume data. Please run optimization first.",
                }
            },
        )
    
    try:
        if not isinstance(optimized_data, OptimizeSessionResponse):
            if isinstance(optimized_data, dict):
                optimized_data = OptimizeSessionResponse.model_validate(optimized_data)
            else:
                raise ValueError("Optimized data is not in the correct format.")
    except Exception as exc:
        logger.error("Invalid optimized data format for session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=422,
            detail={
                "error": {
                    "code": "INVALID_OPTIMIZED_DATA",
                    "message": f"Optimized data is invalid: {str(exc)}",
                }
            },
        )
    
    # 3. Combine original and optimized data
    resume = bundle.resume
    contact_info = resume.structured_content.get("contact", {})
    
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
                "description": proj.description,
                "technologies": proj.technologies,
            }
            for proj in optimized_data.optimized_projects
        ],
        "skills": resume.structured_content.get("skills", {}),
        "education": resume.structured_content.get("education", []),
        "certifications": resume.structured_content.get("certifications", []),
    }
    
    # 4. Determine downloadable filename
    raw_name = contact_info.get("name", "").strip()
    filename = "Optimized_Resume.pdf"
    if raw_name:
        # Split name and keep only first and last parts
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
                
    logger.info("Generating PDF for session_id=%s filename=%s", session_id, filename)
    
    # 5. Render HTML and compile to PDF
    try:
        html_content = pdf_service.render_resume_to_html(resume_data)
        pdf_bytes = pdf_service.generate_pdf_from_html(html_content)
    except PDFGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "PDF_GENERATION_FAILED",
                    "message": str(exc),
                }
            },
        )
        
    # 6. Return response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
