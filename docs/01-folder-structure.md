# Folder Structure

Monorepo using **npm workspaces** (frontend + shared) and a standalone **Python** API. Names use `resumeboost` as the product codename; rename in one place when branding is final.

```
resumeboost/
│
├── .github/
│   └── workflows/
│       ├── ci-web.yml                 # Lint, typecheck, build Next.js
│       ├── ci-api.yml                 # Ruff, mypy, pytest
│       └── deploy.yml                 # Staging / production (optional)
│
├── apps/
│   │
│   ├── web/                           # Next.js 15 (App Router)
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── og-image.png
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx                 # Landing
│   │   │   │   │   └── pricing/page.tsx
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── signup/page.tsx
│   │   │   │   │   └── callback/route.ts        # Supabase OAuth callback
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx               # Sidebar + auth guard
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── resumes/
│   │   │   │   │   │   ├── page.tsx             # List past optimizations
│   │   │   │   │   │   ├── new/page.tsx         # Upload + JD wizard
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx         # Result: score, preview, download
│   │   │   │   │   │       └── loading.tsx
│   │   │   │   │   └── settings/page.tsx
│   │   │   │   ├── api/                         # BFF routes (thin proxy only)
│   │   │   │   │   └── health/route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   │   ├── ui/                          # shadcn/ui primitives
│   │   │   │   ├── layout/
│   │   │   │   │   ├── header.tsx
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   └── footer.tsx
│   │   │   │   ├── resume/
│   │   │   │   │   ├── file-upload.tsx          # PDF/DOCX dropzone
│   │   │   │   │   ├── job-description-form.tsx
│   │   │   │   │   ├── ats-score-card.tsx
│   │   │   │   │   ├── resume-preview.tsx       # Side-by-side diff view
│   │   │   │   │   └── download-button.tsx
│   │   │   │   └── auth/
│   │   │   │       └── auth-form.tsx
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts                # Browser client
│   │   │   │   │   ├── server.ts                # Server Components / cookies
│   │   │   │   │   └── middleware.ts
│   │   │   │   ├── api-client.ts                # Typed fetch → FastAPI
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-optimization-job.ts      # Poll job status
│   │   │   │   └── use-upload.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts                     # Re-export from @resumeboost/shared
│   │   │   └── middleware.ts                    # Supabase session refresh
│   │   ├── components.json                      # shadcn config
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── api/                           # FastAPI backend
│       ├── app/
│       │   ├── main.py                          # App factory, CORS, lifespan
│       │   ├── config.py                        # Pydantic Settings
│       │   ├── dependencies.py                  # Auth, DB, storage clients
│       │   │
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── router.py
│       │   │       ├── uploads.py               # Presigned upload, parse trigger
│       │   │       ├── optimizations.py         # Create job, status, results
│       │   │       ├── resumes.py               # CRUD metadata
│       │   │       ├── exports.py               # PDF download URL
│       │   │       └── health.py
│       │   │
│       │   ├── core/
│       │   │   ├── security.py                # JWT verify (Supabase JWKS)
│       │   │   └── exceptions.py
│       │   │
│       │   ├── services/
│       │   │   ├── extraction/
│       │   │   │   ├── pdf_extractor.py       # pymupdf / pdfplumber
│       │   │   │   └── docx_extractor.py        # python-docx
│       │   │   ├── ai/
│       │   │   │   ├── claude_client.py
│       │   │   │   ├── jd_analyzer.py           # Structured JD parse
│       │   │   │   ├── resume_optimizer.py      # Tailor content to JD
│       │   │   │   └── ats_scorer.py              # Score + gap analysis
│       │   │   ├── latex/
│       │   │   │   ├── template_engine.py     # Jinja2 → .tex
│       │   │   │   ├── compiler.py              # subprocess tectonic/pdflatex
│       │   │   │   └── templates/
│       │   │   │       ├── ats_modern.tex.j2
│       │   │   │       └── ats_classic.tex.j2
│       │   │   └── storage/
│       │   │       └── supabase_storage.py
│       │   │
│       │   ├── workers/
│       │   │   ├── celery_app.py                # Or arq / dramatiq
│       │   │   └── tasks/
│       │   │       └── optimize_resume.py       # Full pipeline task
│       │   │
│       │   ├── models/                          # Pydantic request/response schemas
│       │   │   ├── upload.py
│       │   │   ├── optimization.py
│       │   │   └── resume.py
│       │   │
│       │   └── db/
│       │       ├── supabase.py                  # PostgREST / asyncpg pool
│       │       └── repositories/
│       │           ├── resume_repo.py
│       │           └── optimization_repo.py
│       │
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── fixtures/
│       │       ├── sample_resume.pdf
│       │       └── sample_jd.txt
│       │
│       ├── pyproject.toml
│       ├── Dockerfile
│       ├── Dockerfile.worker                    # Includes TeX Live / Tectonic
│       └── .env.example
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── types/
│       │   │   ├── optimization.ts
│       │   │   ├── resume.ts
│       │   │   └── ats.ts
│       │   └── constants/
│       │       └── job-status.ts
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 20250526000000_initial_schema.sql
│   └── seed.sql
│
├── infra/
│   ├── docker-compose.yml             # api, worker, redis, web (dev)
│   ├── docker-compose.prod.yml
│   └── latex/
│       └── Dockerfile                 # Minimal TeX image for workers
│
├── docs/
│   ├── 01-folder-structure.md         # (this file)
│   ├── 02-development-roadmap.md
│   ├── 03-database-schema.md
│   ├── 04-api-architecture.md
│   └── 05-system-architecture.md
│
├── .gitignore
├── .env.example                       # Root pointers only
├── package.json                       # Workspace root
├── turbo.json                         # Optional: Turborepo
└── README.md
```

## Conventions

| Area | Convention |
|------|------------|
| Frontend routes | App Router; `(group)` for layout segments |
| API versioning | `/api/v1/*` on FastAPI; no business logic in Next.js `api/` except health |
| Auth | Supabase Auth JWT; FastAPI validates `Authorization: Bearer` |
| IDs | UUID v4 everywhere; `optimization_jobs` as async unit of work |
| Env | Never commit secrets; `apps/web/.env.local`, `apps/api/.env` |
| Shared types | `@resumeboost/shared` imported by web; API mirrors in Pydantic |

## Storage Buckets (Supabase)

| Bucket | Purpose | Access |
|--------|---------|--------|
| `uploads` | Original PDF/DOCX | Private; user-scoped path `{user_id}/{resume_id}/original.*` |
| `generated` | Output PDF + intermediate `.tex` | Private; signed URLs for download |
| `temp` | LaTeX build artifacts | Private; TTL cleanup (7 days) |

## Key Environment Variables

**Web (`apps/web/.env.local`)**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**API (`apps/api/.env`)**

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
ANTHROPIC_API_KEY=
REDIS_URL=redis://localhost:6379
LATEX_COMPILER=tectonic
CORS_ORIGINS=http://localhost:3000
```
