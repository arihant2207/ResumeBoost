from fastapi import APIRouter

from app.routers import analysis, dashboard, generate_pdf, health, job_descriptions, optimization, resumes, sessions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(resumes.router)
api_router.include_router(job_descriptions.router)
api_router.include_router(sessions.router)
api_router.include_router(analysis.router)
api_router.include_router(optimization.router)
api_router.include_router(generate_pdf.router)
api_router.include_router(dashboard.router)