import re
from typing import Any

SECTION_HEADERS = {
    "experience": ("experience", "work experience", "employment", "professional experience"),
    "education": ("education", "academic"),
    "skills": ("skills", "technical skills", "core competencies", "technologies"),
    "summary": ("summary", "professional summary", "profile", "about me", "objective"),
    "certifications": ("certifications", "licenses"),
    "projects": ("projects", "personal projects"),
}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?[\d\s().-]{10,}")
LINKEDIN_RE = re.compile(r"linkedin\.com/in/[\w-]+", re.I)
GITHUB_RE = re.compile(r"github\.com/[\w-]+", re.I)


def _normalize_header(line: str) -> str:
    return re.sub(r"[^a-z\s]", "", line.lower()).strip()


def _match_section(header: str) -> str | None:
    h = _normalize_header(header)
    for section, keys in SECTION_HEADERS.items():
        if any(k == h or h.startswith(k) for k in keys):
            return section
    return None


def _parse_bullets(lines: list[str]) -> list[str]:
    bullets: list[str] = []
    for line in lines:
        cleaned = re.sub(r"^[\s•\-\*●]+\s*", "", line).strip()
        if cleaned:
            bullets.append(cleaned)
    return bullets


def parse_resume_structure(raw_text: str) -> dict[str, Any]:
    """
    Lightweight heuristic parser (no AI).
    Splits resume text into sections for structured JSON output.
    """
    lines = [ln.rstrip() for ln in raw_text.splitlines()]
    non_empty = [ln for ln in lines if ln.strip()]

    contact: dict[str, str] = {
        "name": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": "",
    }

    if non_empty:
        contact["name"] = non_empty[0].strip()

    full = "\n".join(non_empty)
    if m := EMAIL_RE.search(full):
        contact["email"] = m.group(0)
    if m := PHONE_RE.search(full):
        contact["phone"] = m.group(0).strip()
    if m := LINKEDIN_RE.search(full):
        contact["linkedin"] = m.group(0)
    if m := GITHUB_RE.search(full):
        contact["github"] = m.group(0)

    sections: dict[str, list[str]] = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "certifications": [],
        "projects": [],
        "other": [],
    }
    current = "other"

    for line in non_empty[1:]:
        section = _match_section(line)
        if section:
            current = section
            continue
        sections[current].append(line)

    experience: list[dict[str, Any]] = []
    exp_block: list[str] = []
    for line in sections["experience"]:
        if line and line == line.upper() and len(line) < 80 and not line.startswith(("-", "•", "*")):
            if exp_block:
                experience.append(
                    {
                        "company": exp_block[0] if exp_block else "",
                        "title": "",
                        "location": "",
                        "start_date": "",
                        "end_date": "",
                        "bullets": _parse_bullets(exp_block[1:]),
                    }
                )
                exp_block = []
            exp_block = [line]
        else:
            exp_block.append(line)
    if exp_block:
        experience.append(
            {
                "company": exp_block[0] if exp_block else "",
                "title": exp_block[1] if len(exp_block) > 1 else "",
                "location": "",
                "start_date": "",
                "end_date": "",
                "bullets": _parse_bullets(exp_block[2:]),
            }
        )

    education: list[dict[str, Any]] = [
        {
            "institution": line,
            "degree": "",
            "graduation_date": "",
            "details": [],
        }
        for line in sections["education"][:10]
    ]

    skills_text = " ".join(sections["skills"])
    technical = []
    if skills_text:
        parts = re.split(r"[,;|•\n]", skills_text)
        technical = [p.strip() for p in parts if p.strip() and len(p.strip()) < 60][:30]

    return {
        "contact": contact,
        "summary": " ".join(sections["summary"]).strip(),
        "experience": experience,
        "education": education,
        "skills": {"technical": technical, "soft": []},
        "certifications": _parse_bullets(sections["certifications"]),
        "projects": [{"name": ln, "description": "", "technologies": []} for ln in sections["projects"][:10]],
    }
