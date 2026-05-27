# ResumeBoost API (Phase 2)

FastAPI backend with in-memory storage. Extracts text from PDF (PyMuPDF) and DOCX (python-docx).

## Prerequisites

- Python 3.11 or 3.12
- pip

## Step-by-step: run locally

### 1. Open a terminal in this folder

```bash
cd apps/api
```

### 2. Create and activate a virtual environment

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. (Optional) Configure environment

```bash
copy .env.example .env
```

Defaults work for local dev (`CORS_ORIGINS=http://localhost:3000`).

### 5. Start the API server

Important: This MVP uses **in-memory storage**, so any server restart clears uploaded resumes.

To prevent `--reload` from watching `.venv/` (which can cause frequent reloads on Windows),
run reload **only** for the `app/` directory:

```bash
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

If you want the most stable behavior (no restarts), run without reload:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API base URL: **http://localhost:8000**  
Interactive docs: **http://localhost:8000/api/v1/docs**

### 6. Start the frontend (separate terminal)

```bash
cd apps/web
npm install
npm run dev
```

Ensure `apps/web/.env.local` contains:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Open **http://localhost:3000**, upload a resume, paste a JD, and click **Generate resume**.

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Liveness check |
| POST | `/api/v1/resumes/upload` | Upload PDF/DOCX, extract & parse text |
| GET | `/api/v1/resumes/{id}` | Get stored resume |
| POST | `/api/v1/job-descriptions` | Submit job description JSON |
| GET | `/api/v1/job-descriptions/{id}` | Get stored JD |
| POST | `/api/v1/sessions` | Link resume + JD, return combined JSON |
| GET | `/api/v1/sessions/{id}` | Get session with full payload |
| POST | `/api/v1/analyze-session/{session_id}` | Gemini ATS analysis (Phase 3A) |

### Example: upload resume

```bash
curl -X POST "http://localhost:8000/api/v1/resumes/upload" ^
  -F "file=@C:\path\to\resume.pdf"
```

### Example: submit job description

```bash
curl -X POST "http://localhost:8000/api/v1/job-descriptions" ^
  -H "Content-Type: application/json" ^
  -d "{\"raw_text\": \"Your full job description here...\", \"resume_id\": \"<resume-uuid>\"}"
```

### Example: create session

```bash
curl -X POST "http://localhost:8000/api/v1/sessions" ^
  -H "Content-Type: application/json" ^
  -d "{\"resume_id\": \"<resume-uuid>\", \"job_description_id\": \"<jd-uuid>\"}"
```

### Example: analyze session (Phase 3A)

Requires `GEMINI_API_KEY` in `.env`.

```bash
curl -X POST "http://localhost:8000/api/v1/analyze-session/<session-uuid>"
```

---

## Phase 3A — Gemini analysis

Set in `.env`:

```
GEMINI_API_KEY=AIzaSyDfuA-...
GEMINI_MODEL=gemini-2.5-flash
```

**Swagger test flow**

1. Open http://localhost:8000/api/v1/docs
2. `POST /api/v1/resumes/upload` — upload a PDF/DOCX, copy `id`
3. `POST /api/v1/job-descriptions` — paste JD (50+ chars), set `resume_id`
4. `POST /api/v1/sessions` — body: `{ "resume_id": "...", "job_description_id": "..." }`, copy session `id`
5. `POST /api/v1/analyze-session/{session_id}` — execute with that session id
6. Response: `match_percentage`, `matched_skills`, `missing_skills`, `ats_keywords`, `strengths`, `improvement_suggestions`

Analysis only — no resume rewrite or PDF generation.

---

## Notes

- **In-memory storage** — data is lost when the server restarts.
- **No auth, database, Redis, or workers** in this phase.
