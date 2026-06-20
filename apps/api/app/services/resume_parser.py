import json
import logging
import re
import time
from typing import Any

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # seconds — exponential backoff

# Fallback regex for basic contact extraction
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?[\d][\d\s().-]{8,}\d")
LINKEDIN_URL_RE = re.compile(r"linkedin\.com/in/([\w\-]+)", re.I)
LINKEDIN_HANDLE_RE = re.compile(r"\b([a-zA-Z][a-zA-Z0-9]{2,}-[a-zA-Z0-9-]{4,})\b")
GITHUB_RE = re.compile(r"github\.com/[\w-]+", re.I)
YEAR_RANGE_RE = re.compile(r"\d{4}\s*[-–|]\s*\d{4}")

# Section headers commonly found in resumes — used by the smart fallback parser
SECTION_HEADERS = {
    "experience": [
        "professional experience", "work experience", "experience",
        "employment history", "career history",
    ],
    "education": ["education", "academic background", "academics"],
    "projects": ["projects", "personal projects", "academic projects", "key projects"],
    "skills": ["technical skills", "skills", "core competencies"],
    "certifications": ["certifications", "certificates", "licenses"],
    "achievements": [
        "achievements", "accomplishments", "awards", "honors",
        "honors and awards", "achievements & awards",
    ],
}

_is_section_header_re = re.compile(r"^[A-Z][A-Za-z &/\-]{2,40}$")

PARSE_PROMPT = """You are an expert resume parser. Extract ALL information from the resume text below and return it as a single valid JSON object.

STRICT RULES:
1. Return ONLY valid JSON — no markdown fences, no commentary, nothing else.
2. Extract every piece of information present. Do not skip any section.
3. If a field is not found, use empty string "" or empty array [].
4. For LinkedIn: extract the handle or full URL if present anywhere in the resume.
5. For phone: extract only actual phone numbers, NOT year ranges like "2023-2027".
6. For skills: separate technical skills and soft skills into different arrays.
7. For projects: extract name, description, technologies, start_date, end_date.
8. For experience: extract company, title, location, start_date, end_date, and bullet points.
9. For education: extract institution, degree, graduation_date, and any details like GPA/CPI.
10. For certifications: extract as a list of strings.
11. For achievements: extract as a list of strings.

Return this exact JSON schema:
{
  "contact": {
    "name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": ""
  },
  "summary": "",
  "experience": [
    {
      "company": "",
      "title": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "bullets": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "graduation_date": "",
      "details": []
    }
  ],
  "skills": {
    "technical": [],
    "soft": []
  },
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": [],
      "start_date": "",
      "end_date": ""
    }
  ],
  "certifications": [],
  "achievements": []
}

RESUME TEXT:
{resume_text}
"""


def _extract_json(text: str) -> dict:
    """Extract JSON from model response, tolerating markdown fences."""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.I)
    if fence:
        cleaned = fence.group(1).strip()
    # Find first { to last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1:
        cleaned = cleaned[start:end+1]
    return json.loads(cleaned)


def _is_retryable_error(exc: Exception) -> bool:
    """503 (overloaded) and 429 (rate limit) are worth retrying; other errors are not."""
    error_str = str(exc).lower()
    retryable_signals = ["503", "429", "overloaded", "rate limit", "resource exhausted", "unavailable"]
    return any(signal in error_str for signal in retryable_signals)


def _fallback_contact(raw_text: str) -> dict[str, str]:
    """Basic regex contact extraction as fallback."""
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    contact = {"name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": ""}

    if lines:
        contact["name"] = lines[0]

    if m := EMAIL_RE.search(raw_text):
        contact["email"] = m.group(0)

    for m in PHONE_RE.finditer(raw_text):
        candidate = m.group(0).strip()
        if not YEAR_RANGE_RE.search(candidate) and len(re.sub(r"\D", "", candidate)) >= 8:
            contact["phone"] = candidate
            break

    if m := LINKEDIN_URL_RE.search(raw_text):
        contact["linkedin"] = f"linkedin.com/in/{m.group(1)}"
    else:
        header = " ".join(lines[:8])
        for m in LINKEDIN_HANDLE_RE.finditer(header):
            candidate = m.group(1)
            if "-" in candidate and not EMAIL_RE.search(candidate) and not YEAR_RANGE_RE.search(candidate):
                contact["linkedin"] = f"linkedin.com/in/{candidate}"
                break

    if m := GITHUB_RE.search(raw_text):
        contact["github"] = m.group(0)

    return contact


def _split_into_sections(raw_text: str) -> dict[str, list[str]]:
    """
    Splits resume text into sections by detecting common section header lines
    (e.g. 'EDUCATION', 'PROJECTS', 'EXPERIENCE'). Returns a dict mapping
    section key -> list of raw lines belonging to that section.
    """
    lines = [ln.rstrip() for ln in raw_text.splitlines()]
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADERS}
    current_key: str | None = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        normalized = stripped.lower().strip(":-• ")
        matched_key = None
        for key, headers in SECTION_HEADERS.items():
            if normalized in headers or any(normalized == h for h in headers):
                matched_key = key
                break

        if matched_key:
            current_key = matched_key
            continue

        # Treat short, title-cased/uppercase standalone lines as a possible
        # unrecognised section header — stop appending to the previous section.
        if _is_section_header_re.match(stripped) and stripped.isupper() and len(stripped.split()) <= 5:
            if not matched_key:
                current_key = None
            continue

        if current_key:
            sections[current_key].append(stripped)

    return sections


def _lines_to_bullets(lines: list[str], limit: int = 6) -> list[str]:
    """Converts raw section lines into bullet-like strings, stripping bullet markers."""
    bullets = []
    for line in lines:
        cleaned = re.sub(r"^[•\-\*\u2022]\s*", "", line).strip()
        if len(cleaned) > 3:
            bullets.append(cleaned)
        if len(bullets) >= limit:
            break
    return bullets


def _smart_fallback_parse(raw_text: str) -> dict[str, Any]:
    """
    Section-aware fallback parser used when Gemini is unavailable after retries.
    Detects common resume section headers and extracts raw line content so the
    PDF is never fully empty, even without AI assistance.
    """
    contact = _fallback_contact(raw_text)
    sections = _split_into_sections(raw_text)

    education_lines = sections.get("education", [])
    education = []
    if education_lines:
        education.append({
            "institution": education_lines[0] if education_lines else "",
            "degree": education_lines[1] if len(education_lines) > 1 else "",
            "graduation_date": "",
            "details": education_lines[2:6],
        })

    projects = []
    proj_lines = sections.get("projects", [])
    if proj_lines:
        projects.append({
            "name": proj_lines[0] if proj_lines else "",
            "description": "",
            "technologies": [],
            "start_date": "",
            "end_date": "",
            "bullets": _lines_to_bullets(proj_lines[1:]),
        })

    experience = []
    exp_lines = sections.get("experience", [])
    if exp_lines:
        experience.append({
            "company": exp_lines[0] if exp_lines else "",
            "title": exp_lines[1] if len(exp_lines) > 1 else "",
            "location": "",
            "start_date": "",
            "end_date": "",
            "bullets": _lines_to_bullets(exp_lines[2:]),
        })

    skills_lines = sections.get("skills", [])
    technical_skills: list[str] = []
    for line in skills_lines:
        parts = re.split(r"[,;|•]", line)
        for part in parts:
            cleaned = re.sub(r"^[A-Za-z &/]+:\s*", "", part.strip())
            cleaned = cleaned.strip()
            if cleaned and len(cleaned) < 40:
                technical_skills.append(cleaned)

    certifications = _lines_to_bullets(sections.get("certifications", []), limit=10)
    achievements = _lines_to_bullets(sections.get("achievements", []), limit=10)

    logger.info(
        "Smart fallback parser extracted: education=%d projects=%d experience=%d "
        "skills=%d certifications=%d achievements=%d",
        len(education), len(projects), len(experience),
        len(technical_skills), len(certifications), len(achievements),
    )

    return {
        "contact": contact,
        "summary": "",
        "experience": experience,
        "education": education,
        "skills": {"technical": technical_skills, "soft": []},
        "projects": projects,
        "certifications": certifications,
        "achievements": achievements,
    }


def _call_gemini_parse_with_retry(prompt: str) -> str:
    """
    Calls Gemini for resume parsing with exponential backoff retry on
    transient errors (503, 429). Raises the last exception if all attempts fail.
    """
    client = genai.Client(api_key=settings.gemini_api_key)
    last_exc: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.0,
                    max_output_tokens=4096,
                ),
            )
            raw_output = response.text
            if not raw_output or not raw_output.strip():
                raise ValueError("Empty response from Gemini")

            logger.info("AI resume parsing succeeded on attempt=%d", attempt)
            return raw_output

        except Exception as exc:
            last_exc = exc

            if not _is_retryable_error(exc):
                logger.warning("Resume parsing non-retryable error: %s", exc)
                raise

            if attempt < MAX_RETRIES:
                delay = RETRY_DELAYS[attempt - 1]
                logger.warning(
                    "Resume parsing transient error attempt=%d/%d — retrying in %ds. Error: %s",
                    attempt, MAX_RETRIES, delay, exc,
                )
                time.sleep(delay)
            else:
                logger.error(
                    "Resume parsing failed after %d attempts. Last error: %s",
                    MAX_RETRIES, exc,
                )

    raise last_exc  # type: ignore[misc]


def parse_resume_structure(raw_text: str) -> dict[str, Any]:
    """
    AI-powered resume parser using Gemini.
    Works with any resume format/template.
    Retries on transient Gemini errors (503/429) before falling back to a
    section-aware regex parser if AI remains unavailable.
    """
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — using fallback parser.")
        return _smart_fallback_parse(raw_text)

    try:
        prompt = PARSE_PROMPT.replace("{resume_text}", raw_text.strip())
        raw_output = _call_gemini_parse_with_retry(prompt)
        parsed = _extract_json(raw_output)

        # Ensure all required keys exist
        parsed.setdefault("contact", {})
        parsed.setdefault("summary", "")
        parsed.setdefault("experience", [])
        parsed.setdefault("education", [])
        parsed.setdefault("skills", {"technical": [], "soft": []})
        parsed.setdefault("projects", [])
        parsed.setdefault("certifications", [])
        parsed.setdefault("achievements", [])

        contact = parsed["contact"]
        contact.setdefault("name", "")
        contact.setdefault("email", "")
        contact.setdefault("phone", "")
        contact.setdefault("location", "")
        contact.setdefault("linkedin", "")
        contact.setdefault("github", "")

        # Validate phone — remove if it looks like a year range
        if contact.get("phone") and YEAR_RANGE_RE.search(contact["phone"]):
            contact["phone"] = ""

        logger.info(
            "AI resume parsing complete: contact=%s skills=%d projects=%d experience=%d",
            contact.get("name"),
            len(parsed["skills"].get("technical", [])),
            len(parsed["projects"]),
            len(parsed["experience"]),
        )
        return parsed

    except Exception as exc:
        logger.warning("AI resume parsing failed after retries (%s) — using smart fallback parser.", exc)
        return _smart_fallback_parse(raw_text)