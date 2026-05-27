import json
import logging
import re
from pathlib import Path
from string import Template

from fastapi import HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError
from pydantic import BaseModel

from app.config import settings
from app.schemas.analysis import ResumeAnalysisResponse

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "resume_analysis_prompt.txt"


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
                    "message": "GEMINI_API_KEY is not set. Add it to your .env file.",
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
                response_mime_type="application/json",
                response_schema=GeminiResumeAnalysis,
                temperature=0.0,
            ),
        )
    except APIError as exc:
        logger.error("Gemini API error session_id=%s: status_code=%s message=%s", session_id, exc.code, str(exc))
        if exc.code == 429:
            status_code = 429
            error_code = "AI_RATE_LIMITED"
            error_message = "Gemini API rate limit exceeded. Try again shortly."
        elif exc.code in (401, 403):
            status_code = 503
            error_code = "AI_NOT_CONFIGURED"
            error_message = "Gemini API authentication failed. Check your API key."
        elif exc.code and exc.code >= 500:
            status_code = 502
            error_code = "AI_UNAVAILABLE"
            error_message = "Gemini API is currently unavailable or returned a server error."
        else:
            status_code = 502
            error_code = "AI_API_ERROR"
            error_message = f"Gemini API error: {str(exc)}"
        raise HTTPException(
            status_code=status_code,
            detail={
                "error": {
                    "code": error_code,
                    "message": error_message,
                }
            },
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected Gemini error session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_ERROR",
                    "message": "Unexpected error during AI analysis.",
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

    # Note: Usage metadata can be optionally logged if available from google-genai
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

