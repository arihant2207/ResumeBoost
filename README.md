# ResumeBoost — AI Resume Generator SaaS

Production-ready SaaS that tailors resumes to job descriptions, scores ATS compatibility, and exports LaTeX-generated PDFs.

## Documentation

| Document | Description |
|----------|-------------|
| [Folder Structure](docs/01-folder-structure.md) | Monorepo layout, conventions, env files |
| [Development Roadmap](docs/02-development-roadmap.md) | Phased delivery plan with milestones |
| [Database Schema](docs/03-database-schema.md) | Supabase tables, RLS, storage buckets |
| [API Architecture](docs/04-api-architecture.md) | FastAPI routes, contracts, async jobs |
| [System Architecture](docs/05-system-architecture.md) | End-to-end flows, infra, security |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python) |
| Database & Auth | Supabase (Postgres + Auth) |
| File Storage | Supabase Storage |
| AI | Anthropic Claude API |
| PDF | LaTeX (pdflatex / tectonic in worker) |

## Quick Start

### Frontend (Phase 1+)

```bash
cd apps/web
npm install
copy .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (Phase 2+)

```bash
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --reload-dir app --port 8000
```

API docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

See [apps/api/README.md](apps/api/README.md) for full step-by-step instructions.

## Repository Layout (summary)

```
resumeboost/
├── apps/web/          # Next.js 15 frontend
├── apps/api/          # FastAPI backend
├── packages/shared/   # Shared types & constants
├── supabase/          # Migrations, seed, config
├── infra/             # Docker, CI, LaTeX worker image
└── docs/              # Architecture & planning
```

See [docs/01-folder-structure.md](docs/01-folder-structure.md) for the full tree.
