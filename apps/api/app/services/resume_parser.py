import json
import logging
import re
from typing import Any

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# Fallback regex for basic contact extraction
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?[\d][\d\s().-]{8,}\d")
LINKEDIN_URL_RE = re.compile(r"linkedin\.com/in/([\w\-]+)", re.I)
LINKEDIN_HANDLE_RE = re.compile(r"\b([a-zA-Z][a-zA-Z0-9]{2,}-[a-zA-Z0-9-]{4,})\b")
GITHUB_RE = re.compile(r"github\.com/[\w-]+", re.I)
YEAR_RANGE_RE = re.compile(r"\d{4}\s*[-–|]\s*\d{4}")

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


def parse_resume_structure(raw_text: str) -> dict[str, Any]:
    """
    AI-powered resume parser using Gemini.
    Works with any resume format/template.
    Falls back to regex-based parsing if AI call fails.
    """
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set — using fallback parser.")
        return _fallback_parse(raw_text)

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = PARSE_PROMPT.replace("{resume_text}", raw_text.strip())

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
        logger.warning("AI resume parsing failed (%s) — using fallback parser.", exc)
        return _fallback_parse(raw_text)


def _fallback_parse(raw_text: str) -> dict[str, Any]:
    """Simple regex fallback when AI is unavailable."""
    logger.info("Using fallback regex resume parser.")
    contact = _fallback_contact(raw_text)
    return {
        "contact": contact,
        "summary": "",
        "experience": [],
        "education": [],
        "skills": {"technical": [], "soft": []},
        "projects": [],
        "certifications": [],
        "achievements": [],
    }