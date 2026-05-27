from fastapi import APIRouter

from app.routers import analysis, health, job_descriptions, resumes, sessions

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(resumes.router)
api_router.include_router(job_descriptions.router)
api_router.include_router(sessions.router)
api_router.include_router(analysis.router)
