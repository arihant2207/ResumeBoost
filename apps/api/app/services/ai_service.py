import json
import logging
import re
from pathlib import Path
from string import Template

import anthropic
from anthropic import APIError, APIConnectionError, APITimeoutError, RateLimitError
from fastapi import HTTPException

from app.config import settings
from app.schemas.analysis import ResumeAnalysisResponse

logger = logging.getLogger(__name__)

PROMPT_PATH = Path(__file__).resolve().parent.parent / "prompts" / "resume_analysis_prompt.txt"


class AIServiceError(Exception):
    """Raised when Claude analysis fails."""


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
        logger.warning("Failed to parse Claude JSON: %s", exc)
        raise AIServiceError("Claude returned invalid JSON.") from exc


def _get_client() -> anthropic.Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "AI_NOT_CONFIGURED",
                    "message": "ANTHROPIC_API_KEY is not set. Add it to your .env file.",
                }
            },
        )
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def analyze_resume_for_job(
    resume_text: str,
    job_description: str,
    *,
    session_id: str,
) -> ResumeAnalysisResponse:
    """
    Send resume + job description to Claude and return structured ATS analysis.
    Analysis only — no resume rewriting.
    """
    prompt = _build_prompt(resume_text, job_description)
    client = _get_client()

    logger.info(
        "Starting Claude analysis session_id=%s model=%s resume_chars=%d jd_chars=%d",
        session_id,
        settings.anthropic_model,
        len(resume_text),
        len(job_description),
    )

    try:
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=settings.anthropic_max_tokens,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )
    except RateLimitError as exc:
        logger.error("Claude rate limit session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=429,
            detail={
                "error": {
                    "code": "AI_RATE_LIMITED",
                    "message": "Claude API rate limit exceeded. Try again shortly.",
                }
            },
        ) from exc
    except (APIConnectionError, APITimeoutError) as exc:
        logger.error("Claude connection error session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=503,
            detail={
                "error": {
                    "code": "AI_UNAVAILABLE",
                    "message": "Could not reach Claude API. Check your network and try again.",
                }
            },
        ) from exc
    except APIError as exc:
        logger.error("Claude API error session_id=%s: %s", session_id, exc)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_API_ERROR",
                    "message": "Claude API returned an error.",
                }
            },
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected Claude error session_id=%s", session_id)
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_ERROR",
                    "message": "Unexpected error during AI analysis.",
                }
            },
        ) from exc

    if not message.content:
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_EMPTY_RESPONSE",
                    "message": "Claude returned an empty response.",
                }
            },
        )

    text_blocks = [block.text for block in message.content if block.type == "text"]
    raw_output = "\n".join(text_blocks).strip()
    if not raw_output:
        raise HTTPException(
            status_code=502,
            detail={
                "error": {
                    "code": "AI_EMPTY_RESPONSE",
                    "message": "Claude returned no text content.",
                }
            },
        )

    usage = message.usage
    logger.info(
        "Claude analysis complete session_id=%s input_tokens=%s output_tokens=%s",
        session_id,
        getattr(usage, "input_tokens", "?"),
        getattr(usage, "output_tokens", "?"),
    )

    try:
        payload = _extract_json_payload(raw_output)
        return ResumeAnalysisResponse.model_validate(payload)
    except AIServiceError as exc:
        logger.error("Invalid Claude JSON session_id=%s", session_id)
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
                    "message": "Claude response did not match the expected schema.",
                }
            },
        ) from exc
