import json
import logging
import re
import time
import unicodedata
from typing import Any

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # seconds -- exponential backoff

# Fallback regex for basic contact extraction
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?[\d][\d\s().-]{8,}\d")
LINKEDIN_URL_RE = re.compile(r"linkedin\.com/in/([\w\-]+)", re.I)
LINKEDIN_HANDLE_RE = re.compile(r"\b([a-zA-Z][a-zA-Z0-9]{2,}-[a-zA-Z0-9-]{4,})\b")
GITHUB_RE = re.compile(r"github\.com/[\w-]+", re.I)
YEAR_RANGE_RE = re.compile(r"\d{4}\s*[-\u2013|]\s*\d{4}")

# Section headers commonly found in resumes -- used by the smart fallback parser
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
1. Return ONLY valid JSON -- no markdown fences, no commentary, nothing else.
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

# ---------------------------------------------------------------------------
# Text sanitisation -- normalise Unicode before sending to Gemini so that
# smart quotes, em-dashes and stray control characters do not break the
# model's JSON string escaping.
# ---------------------------------------------------------------------------

# Map curly/typographic quotes to straight ASCII equivalents
_QUOTE_TABLE = str.maketrans({
    "\u2018": "'",   # LEFT SINGLE QUOTATION MARK
    "\u2019": "'",   # RIGHT SINGLE QUOTATION MARK
    "\u201a": "'",   # SINGLE LOW-9 QUOTATION MARK
    "\u201b": "'",   # SINGLE HIGH-REVERSED-9 QUOTATION MARK
    "\u201c": '"',   # LEFT DOUBLE QUOTATION MARK
    "\u201d": '"',   # RIGHT DOUBLE QUOTATION MARK
    "\u201e": '"',   # DOUBLE LOW-9 QUOTATION MARK
    "\u201f": '"',   # DOUBLE HIGH-REVERSED-9 QUOTATION MARK
    "\u2032": "'",   # PRIME
    "\u2033": '"',   # DOUBLE PRIME
})

# Map typographic dashes to ASCII hyphen-minus
_DASH_TABLE = str.maketrans({
    "\u2013": "-",   # EN DASH
    "\u2014": "-",   # EM DASH
    "\u2015": "-",   # HORIZONTAL BAR
    "\u2212": "-",   # MINUS SIGN
    "\ufe58": "-",   # SMALL EM DASH
    "\ufe63": "-",   # SMALL HYPHEN-MINUS
    "\uff0d": "-",   # FULLWIDTH HYPHEN-MINUS
})

# Strip C0 (except tab/LF/CR) and C1 control characters
_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")


def _sanitize_text(text: str) -> str:
    """
    Normalise Unicode in resume text before feeding it to Gemini.

    Steps (none alter visible content):
      1. NFC normalisation (canonical decomposition then recomposition).
      2. Curly/typographic quotes -> straight ASCII quotes.
      3. Typographic dashes -> ASCII hyphen-minus.
      4. Strip C0 and C1 control characters (keeps tab, LF, CR).
    """
    text = unicodedata.normalize("NFC", text)
    text = text.translate(_QUOTE_TABLE)
    text = text.translate(_DASH_TABLE)
    text = _CONTROL_CHARS_RE.sub("", text)
    return text


# ---------------------------------------------------------------------------
# JSON extraction with diagnostic logging
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    """
    Extract JSON from model response, tolerating markdown fences.

    On JSONDecodeError, logs 80 characters of context around the failure
    position so future failures are immediately diagnosable.
    """
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.I)
    if fence:
        cleaned = fence.group(1).strip()
    # Find first { to last }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1:
        cleaned = cleaned[start:end + 1]

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        # Diagnostic: show exactly where the JSON broke
        pos = exc.pos
        snippet_start = max(0, pos - 80)
        snippet_end = min(len(cleaned), pos + 80)
        context_before = repr(cleaned[snippet_start:pos])
        context_after = repr(cleaned[pos:snippet_end])
        logger.error(
            "JSONDecodeError at pos=%d (line=%d col=%d): %s | "
            "...BEFORE: %s <--HERE--> AFTER: %s...",
            pos, exc.lineno, exc.colno, exc.msg,
            context_before, context_after,
        )
        raise


# ---------------------------------------------------------------------------
# Retry logic
# ---------------------------------------------------------------------------

def _is_retryable_error(exc: Exception) -> bool:
    """503 (overloaded) and 429 (rate limit) are worth retrying; other errors are not."""
    error_str = str(exc).lower()
    retryable_signals = ["503", "429", "overloaded", "rate limit", "resource exhausted", "unavailable"]
    return any(signal in error_str for signal in retryable_signals)


# ---------------------------------------------------------------------------
# Fallback contact extraction
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Section splitter
# ---------------------------------------------------------------------------

def _split_into_sections(raw_text: str) -> dict[str, list[str]]:
    """
    Splits resume text into sections by detecting common section header lines
    (e.g. EDUCATION, PROJECTS, EXPERIENCE). Returns a dict mapping
    section key -> list of raw lines belonging to that section.
    """
    lines = [ln.rstrip() for ln in raw_text.splitlines()]
    sections: dict[str, list[str]] = {key: [] for key in SECTION_HEADERS}
    current_key: str | None = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        normalized = stripped.lower().strip(":-\u2022 ")
        matched_key = None
        for key, headers in SECTION_HEADERS.items():
            if normalized in headers or any(normalized == h for h in headers):
                matched_key = key
                break

        if matched_key:
            current_key = matched_key
            continue

        # Treat short, title-cased/uppercase standalone lines as a possible
        # unrecognised section header -- stop appending to the previous section.
        if _is_section_header_re.match(stripped) and stripped.isupper() and len(stripped.split()) <= 5:
            if not matched_key:
                current_key = None
            continue

        if current_key:
            sections[current_key].append(stripped)

    return sections


# ---------------------------------------------------------------------------
# Bullet helpers
# ---------------------------------------------------------------------------

def _lines_to_bullets(lines: list[str], limit: int = 6) -> list[str]:
    """
    Converts raw section lines into bullet strings, stripping bullet markers.

    A line is only included when:
      - It contains at least 10 characters (guards against stray bullet dots
        or single-character fragments that produce broken-looking output).
      - It contains at least one letter (pure punctuation / digit-only lines
        are skipped).
    """
    bullets = []
    for line in lines:
        cleaned = re.sub(r"^[\u2022\-\*]\s*", "", line).strip()
        # Must be a real sentence fragment, not a stray symbol or short token
        if len(cleaned) >= 10 and re.search(r"[A-Za-z]", cleaned):
            bullets.append(cleaned)
        if len(bullets) >= limit:
            break
    return bullets


def _pick_first_real_line(lines: list[str], start: int = 0) -> str:
    """
    Return the first line from lines[start:] that looks like a real label
    (contains a letter and is not purely a bullet/symbol fragment).
    Returns "" if nothing qualifies.
    """
    for line in lines[start:]:
        cleaned = re.sub(r"^[\u2022\-\*]\s*", "", line).strip()
        if re.search(r"[A-Za-z]", cleaned) and len(cleaned) >= 2:
            return cleaned
    return ""


# ---------------------------------------------------------------------------
# Smart fallback parser
# ---------------------------------------------------------------------------

def _smart_fallback_parse(raw_text: str) -> dict[str, Any]:
    """
    Section-aware fallback parser used when Gemini is unavailable after retries.

    Detects common resume section headers and extracts raw line content so the
    PDF is never fully empty, even without AI assistance.

    Safety guarantee: if a section's content cannot be reliably parsed (e.g.
    too few lines, or no real text found), that section is omitted entirely
    from the output rather than rendered with garbled/partial content.
    """
    contact = _fallback_contact(raw_text)
    sections = _split_into_sections(raw_text)

    # --- Education ---
    education: list[dict] = []
    education_lines = sections.get("education", [])
    institution = _pick_first_real_line(education_lines, 0)
    if institution:
        degree = _pick_first_real_line(education_lines, 1)
        education.append({
            "institution": institution,
            "degree": degree,
            "graduation_date": "",
            "details": _lines_to_bullets(education_lines[2:], limit=4),
        })

    # --- Projects ---
    projects: list[dict] = []
    proj_lines = sections.get("projects", [])
    proj_name = _pick_first_real_line(proj_lines, 0)
    if proj_name:
        projects.append({
            "name": proj_name,
            "description": "",
            "technologies": [],
            "start_date": "",
            "end_date": "",
            "bullets": _lines_to_bullets(proj_lines[1:]),
        })

    # --- Experience ---
    experience: list[dict] = []
    exp_lines = sections.get("experience", [])
    company = _pick_first_real_line(exp_lines, 0)
    if company:
        title = _pick_first_real_line(exp_lines, 1)
        experience.append({
            "company": company,
            "title": title,
            "location": "",
            "start_date": "",
            "end_date": "",
            "bullets": _lines_to_bullets(exp_lines[2:]),
        })

    # --- Skills ---
    skills_lines = sections.get("skills", [])
    technical_skills: list[str] = []
    for line in skills_lines:
        parts = re.split(r"[,;|\u2022]", line)
        for part in parts:
            cleaned = re.sub(r"^[A-Za-z &/]+:\s*", "", part.strip())
            cleaned = cleaned.strip()
            if cleaned and len(cleaned) < 40 and re.search(r"[A-Za-z]", cleaned):
                technical_skills.append(cleaned)

    # --- Certifications & Achievements ---
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


# ---------------------------------------------------------------------------
# Gemini API call with retry
# ---------------------------------------------------------------------------

def _call_gemini_parse_with_retry(prompt: str) -> str:
    """
    Calls Gemini for resume parsing with exponential backoff retry on
    transient errors (503, 429). Raises the last exception if all attempts fail.

    max_output_tokens is set to 8192 to prevent JSON truncation on long resumes.
    (A complex resume with many experience/project entries can easily exceed
    4096 tokens of JSON output, causing a mid-object cut that produces the
    Expecting comma delimiter JSONDecodeError.)
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
                    max_output_tokens=8192,   # raised from 4096 -- prevents truncation
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
                    "Resume parsing transient error attempt=%d/%d -- retrying in %ds. Error: %s",
                    attempt, MAX_RETRIES, delay, exc,
                )
                time.sleep(delay)
            else:
                logger.error(
                    "Resume parsing failed after %d attempts. Last error: %s",
                    MAX_RETRIES, exc,
                )

    raise last_exc  # type: ignore[misc]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def parse_resume_structure(raw_text: str) -> dict[str, Any]:
    """
    AI-powered resume parser using Gemini.
    Works with any resume format/template.

    Pipeline:
      1. Sanitise the raw text (normalise Unicode, strip control chars).
      2. Call Gemini with retry logic (503/429 only).
      3. Parse the JSON response with diagnostic logging on failure.
      4. If Gemini is unavailable after all retries, fall back to the
         section-aware regex parser (_smart_fallback_parse).
    """
    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set -- using fallback parser.")
        return _smart_fallback_parse(raw_text)

    try:
        sanitized_text = _sanitize_text(raw_text.strip())
        prompt = PARSE_PROMPT.replace("{resume_text}", sanitized_text)
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

        # Validate phone -- remove if it looks like a year range
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
        logger.warning("AI resume parsing failed after retries (%s) -- using smart fallback parser.", exc)
        return _smart_fallback_parse(raw_text)
