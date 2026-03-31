# File: backend/src/routes/health.py
"""Health check endpoints."""
from fastapi import APIRouter
from src.core.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/", tags=["Health"])
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/api/docs"}
