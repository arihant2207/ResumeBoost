# Development Roadmap

Phased plan from zero to production. Each phase ends with a **demoable milestone** and clear exit criteria.

---

## Phase 0 — Foundation (Week 1)

**Goal:** Runnable monorepo skeleton, Supabase project, CI green.

| Task | Deliverable |
|------|-------------|
| Init monorepo (`apps/web`, `apps/api`, `packages/shared`) | `npm install`, `poetry install` work |
| Supabase project + local CLI | Migrations apply cleanly |
| Docker Compose (API, Redis, worker stub) | `docker compose up` |
| GitHub Actions: lint + typecheck | PR checks pass |
| `.env.example` files documented | Onboarding < 15 min |

**Exit criteria:** Empty dashboard loads; health endpoints return 200; user can sign up via Supabase Auth.

---

## Phase 1 — Upload & Extraction (Week 2)

**Goal:** User uploads PDF/DOCX; text stored in database.

| Task | Deliverable |
|------|-------------|
| Storage buckets + RLS policies | Upload only to own prefix |
| Frontend: file dropzone (shadcn) | 10MB limit, PDF/DOCX validation |
| API: presigned upload URL | `POST /v1/uploads/init` |
| PDF extractor (PyMuPDF) | Plain text + basic sections |
| DOCX extractor (python-docx) | Same output shape as PDF |
| `resumes` + `resume_versions` tables | Original file path + `raw_text` |

**Exit criteria:** Upload completes; extracted text visible on resume detail page (read-only).

---

## Phase 2 — Job Description & AI Analysis (Week 3)

**Goal:** Paste JD; Claude returns structured analysis.

| Task | Deliverable |
|------|-------------|
| JD input form (textarea + optional URL later) | Character limit, sanitization |
| `jd_analyzer` service + prompt templates | JSON: skills, keywords, seniority, must-haves |
| Store `job_descriptions` + link to optimization | Versioned per run |
| Rate limiting + token budgeting | Per-user daily cap (config) |
| Error handling for Claude timeouts | Retry with backoff |

**Exit criteria:** After paste, UI shows parsed skills/keywords and role summary within ~30s.

---

## Phase 3 — Resume Optimization Pipeline (Week 4–5)

**Goal:** Async job tailors resume content to JD.

| Task | Deliverable |
|------|-------------|
| Redis + Celery (or ARQ) worker | `optimize_resume` task |
| `optimization_jobs` state machine | pending → extracting → analyzing → optimizing → scoring → rendering → completed / failed |
| `resume_optimizer` prompts | Section-aware output (summary, experience, skills) |
| Structured resume JSON schema | Single source for LaTeX + ATS |
| Frontend job polling / SSE | Progress stepper UI |
| Idempotency key on create | Safe retries |

**Exit criteria:** Full run produces optimized JSON stored in DB; user sees before/after diff in UI.

---

## Phase 4 — ATS Scoring (Week 5)

**Goal:** Transparent ATS compatibility score with actionable gaps.

| Task | Deliverable |
|------|-------------|
| `ats_scorer` (rules + Claude assist) | Score 0–100 + breakdown |
| Keyword coverage matrix | Matched / missing / partial |
| Formatting checks | Headers, bullets, length, forbidden elements |
| `ats_scores` persistence | Historical per optimization |
| UI: score ring + checklist | shadcn Progress, Badge, Accordion |

**Exit criteria:** Score updates after optimization; user sees top 5 improvement suggestions.

---

## Phase 5 — LaTeX PDF Generation (Week 6–7)

**Goal:** ATS-friendly PDF generated and downloadable.

| Task | Deliverable |
|------|-------------|
| Jinja2 LaTeX templates (2 themes) | No graphics-heavy layout; standard sections |
| Worker Docker image with Tectonic | Reproducible builds |
| `latex/compiler` with timeout + sandbox | Max 60s compile; temp dir cleanup |
| Upload PDF to `generated` bucket | Signed download URL |
| `GET /v1/exports/{job_id}/download` | Content-Disposition attachment |
| Frontend download button | Works on mobile |

**Exit criteria:** User downloads generated PDF; file opens in standard PDF viewers; text is selectable (ATS-safe).

---

## Phase 6 — Product Polish & SaaS Basics (Week 8)

**Goal:** Production UX and operational readiness.

| Task | Deliverable |
|------|-------------|
| Responsive layouts (mobile-first) | Wizard usable on phone |
| Loading / empty / error states | shadcn Skeleton, Alert |
| Usage limits (free tier) | `profiles.plan`, `usage_logs` |
| Stripe integration (optional v1.1) | Checkout + webhook stub |
| Audit logging for AI calls | `ai_usage_logs` |
| Sentry + structured logging | API + worker |
| E2E tests (Playwright) | Happy path: upload → download |

**Exit criteria:** Lighthouse performance ≥ 85 on dashboard; E2E passes in CI.

---

## Phase 7 — Production Deploy (Week 9–10)

**Goal:** Staging and production environments.

| Task | Deliverable |
|------|-------------|
| Vercel (web) + Fly.io/Railway (API + worker) | Environment separation |
| Supabase production project | Migrations via CI |
| Secrets in platform vaults | No keys in repo |
| CDN for static assets | Vercel default |
| Database backups + PITR | Supabase Pro |
| Runbook + monitoring alerts | Queue depth, error rate, latency |

**Exit criteria:** Public URL; SSL; auth works; 99% uptime target documented.

---

## Post-MVP Backlog (Prioritized)

| Priority | Feature |
|----------|---------|
| P1 | Multiple resume templates + custom accent color |
| P1 | Cover letter generation from same JD |
| P2 | Browser extension: JD scrape from LinkedIn |
| P2 | Team / recruiter seats |
| P3 | Resume parsing improvements (tables, columns) |
| P3 | A/B compare two optimization strategies |
| P3 | Webhook API for integrations |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| LaTeX compile failures on edge-case content | Escape special chars; fallback template; validate JSON schema |
| Claude cost at scale | Cache JD analysis hash; truncate resume; tier limits |
| Poor PDF/DOCX extraction | Manual text edit step (Phase 6); show confidence score |
| Long job latency | Progress UI; email notification (post-MVP) |
| ATS score perceived as inaccurate | Explain scoring rubric; show keyword evidence |

---

## Team Sizing Estimate

| Role | Phases |
|------|--------|
| 1 full-stack engineer | 0–6 |
| + part-time designer | 6 (UI polish) |
| + DevOps (fractional) | 7 |

**MVP timeline:** ~10 weeks solo; ~6–7 weeks with two engineers parallelizing frontend/backend.
