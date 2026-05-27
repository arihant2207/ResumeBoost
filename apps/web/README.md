# ResumeBoost Web (Phase 1)

Next.js 15 frontend — landing page + resume generator UI. No backend yet.

## Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (Radix primitives)

## Getting started

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features (Phase 1)

- Marketing landing page (hero, features, how it works)
- Resume upload (PDF/DOCX, drag & drop, validation)
- Job description textarea with character count
- Generate button with simulated loading
- ATS score card (placeholder data after generate)
- Download PDF button (disabled until generate; alert placeholder)
- Fully responsive layout

## Environment

Copy `.env.local.example` to `.env.local` when connecting the API:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
