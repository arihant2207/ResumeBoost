import json
import logging
import re
from pathlib import Path
from string import Template

from fastapi import HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.config import settings
from app.models.domain import ResumeRecord
from app.schemas.analysis import ResumeAnalysisResponse
from app.schemas.optimization import OptimizeSessionResponse

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "resume_analysis_prompt.txt"
OPTIMIZE_PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "resume_optimization_prompt.txt"


class AIServiceError(Exception):
    """Raised when Gemini analysis fails."""


class GeminiResumeAnalysis(BaseModel):
    """
    Internal schema for Gemini response (avoids validation errors in google-genai
    due to 'examples' or other metadata fields in ResumeAnalysisResponse).
    """
    match_percentage: int
    matched_skills: list[str]
    missing_skills: list[str]
    ats_keywords: list[str]
    strengths: list[str]
    improvement_suggestions: list[str]


def _load_prompt_template() -> str:
    if not PROMPT_PATH.is_file():
        raise AIServiceError(f"Prompt file not found: {PROMPT_PATH}")
    return PROMPT_PATH.read_text(encoding="utf-8")


def _build_prompt(resume_text: str, job_description: str) -> str:
    # Use Template (not str.format) — the prompt contains JSON with { } braces.
    template = Template(_load_prompt_template())
    return template.safe_substitute(
        resume_text=resume_text.strip(),
        job_description=job_description.strip(),
    )


def _extract_json_payload(text: str) -> dict:
    """Parse JSON from model output, tolerating optional markdown fences."""
    cleaned = text.strip()
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.warning("Failed to parse Gemini JSON: %s", exc)
        raise AIServiceError("Gemini returned invalid JSON.") from exc


def _get_client() -> genai.Client:
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "AI_NOT_CONFIGURED",
                    "message": "GEMINI_API_KEY is not set.",
                }
            },
        )
    return genai.Client(api_key=settings.gemini_api_key)


def analyze_resume_for_job(
    resume_text: str,
    job_description: str,
    *,
    session_id: str,
) -> ResumeAnalysisResponse:
    """
    Send resume + job description to Gemini and return structured ATS analysis.
    Analysis only — no resume rewriting.
    """
    prompt = _build_prompt(resume_text, job_description)
    client = _get_client()

    logger.info(
        "Starting Gemini analysis session_id=%s model=%s resume_chars=%d jd_chars=%d",
        session_id,
        settings.gemini_model,
        len(resume_text),
        len(job_description),
    )

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
            ),
        )
    except Exception as exc:
        logger.exception("Gemini analysis error session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_API_ERROR",
                    "message": str(exc),
                }
            },
        ) from exc

    raw_output = response.text
    if not raw_output or not raw_output.strip():
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_EMPTY_RESPONSE",
                    "message": "Gemini returned an empty response.",
                }
            },
        )

    usage = getattr(response, "usage_metadata", None)
    logger.info(
        "Gemini analysis complete session_id=%s input_tokens=%s output_tokens=%s",
        session_id,
        getattr(usage, "prompt_token_count", "?") if usage else "?",
        getattr(usage, "candidates_token_count", "?") if usage else "?",
    )

    try:
        payload = _extract_json_payload(raw_output)
        return ResumeAnalysisResponse.model_validate(payload)
    except AIServiceError as exc:
        logger.error("Invalid Gemini JSON session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_INVALID_RESPONSE",
                    "message": str(exc),
                }
            },
        ) from exc
    except Exception as exc:
        logger.error("Analysis validation failed session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_INVALID_RESPONSE",
                    "message": "Gemini response did not match the expected schema.",
                }
            },
        ) from exc


def _load_optimize_prompt_template() -> str:
    if not OPTIMIZE_PROMPT_PATH.is_file():
        raise AIServiceError(f"Optimization prompt file not found: {OPTIMIZE_PROMPT_PATH}")
    return OPTIMIZE_PROMPT_PATH.read_text(encoding="utf-8")


def _build_optimize_prompt(resume_text: str, resume_structured: dict, job_description: str) -> str:
    template = Template(_load_optimize_prompt_template())
    return template.safe_substitute(
        resume_text=resume_text.strip(),
        resume_structured_content=json.dumps(resume_structured, indent=2),
        job_description=job_description.strip(),
    )


def optimize_resume_for_job(
    resume: ResumeRecord,
    job_description: str,
    *,
    session_id: str,
) -> OptimizeSessionResponse:
    """
    Send resume + job description to Gemini and return tailored summary, projects, and work experience.
    """
    prompt = _build_optimize_prompt(resume.raw_text, resume.structured_content, job_description)
    client = _get_client()

    logger.info(
        "Starting Gemini optimization session_id=%s model=%s resume_chars=%d jd_chars=%d",
        session_id,
        settings.gemini_model,
        len(resume.raw_text),
        len(job_description),
    )

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
            ),
        )
    except Exception as exc:
        logger.exception("Unexpected Gemini error session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_ERROR",
                    "message": str(exc),
                }
            },
        ) from exc

    raw_output = response.text
    if not raw_output or not raw_output.strip():
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_EMPTY_RESPONSE",
                    "message": "Gemini returned an empty response.",
                }
            },
        )

    usage = getattr(response, "usage_metadata", None)
    logger.info(
        "Gemini optimization complete session_id=%s input_tokens=%s output_tokens=%s",
        session_id,
        getattr(usage, "prompt_token_count", "?") if usage else "?",
        getattr(usage, "candidates_token_count", "?") if usage else "?",
    )

    try:
        payload = _extract_json_payload(raw_output)
        validated = OptimizeSessionResponse.model_validate(payload)
        from app.services.storage import store
        session = store.sessions.get(session_id)
        if session:
            session.optimized_data = validated
        return validated
    except AIServiceError as exc:
        logger.error("Invalid Gemini JSON session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_INVALID_RESPONSE",
                    "message": str(exc),
                }
            },
        ) from exc
    except Exception as exc:
        logger.error("Optimization validation failed session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_INVALID_RESPONSE",
                    "message": "Gemini response did not match the expected schema.",
                }
            },
        ) from exc