# File: backend/src/main.py
"""
ResistAI - Antibiotic Resistance Prediction Platform
Main FastAPI application entry point
"""
import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import Response

from src.core.config import settings
from src.core.database import engine, Base
from src.core.logging import setup_logging
from src.routes import prediction, analysis, health, auth, genes

# ─── Logging ──────────────────────────────────────────────────────────────────
setup_logging()
logger = structlog.get_logger()

# ─── Prometheus Metrics ────────────────────────────────────────────────────────
REQUEST_COUNT = Counter("resistai_requests_total", "Total requests", ["method", "endpoint", "status"])
REQUEST_LATENCY = Histogram("resistai_request_latency_seconds", "Request latency", ["endpoint"])

# ─── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown logic."""
    logger.info("resistai.startup", version=settings.APP_VERSION, env=settings.ENVIRONMENT)
    # Create DB tables (in prod use Alembic migrations)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("resistai.db_ready")
    yield
    logger.info("resistai.shutdown")


# ─── App Factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title="ResistAI - Antibiotic Resistance Prediction",
        description="""
        ## ResistAI API
        AI-driven antibiotic resistance prediction platform.
        Predicts resistance patterns from bacterial phenotypic/genetic data
        and provides evidence-based treatment recommendations.
        """,
        version=settings.APP_VERSION,
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )

    # ── Middleware ───────────────────────────────────────────────────────────
    origins = [
        "https://resist-ai-1.onrender.com",  # Production React Frontend
        "http://localhost:5173",             # Local Vite React dev server
        "http://localhost:3000",             # Alternative local dev port
    ]

    if isinstance(settings.ALLOWED_ORIGINS, list):
        origins.extend(settings.ALLOWED_ORIGINS)
    elif isinstance(settings.ALLOWED_ORIGINS, str):
        origins.append(settings.ALLOWED_ORIGINS)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,  
        allow_credentials=True,
        allow_methods=["*"],    
        allow_headers=["*"],
    )
    
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── Rate Limiting ────────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── Request Logging & Metrics Middleware ─────────────────────────────────
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        latency = time.perf_counter() - start
        endpoint = request.url.path
        REQUEST_COUNT.labels(request.method, endpoint, response.status_code).inc()
        REQUEST_LATENCY.labels(endpoint).observe(latency)
        logger.info(
            "http.request",
            method=request.method,
            path=endpoint,
            status=response.status_code,
            latency_ms=round(latency * 1000, 2),
        )
        return response

    # ── Routes ───────────────────────────────────────────────────────────────
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
    app.include_router(prediction.router, prefix="/api/v1/predict", tags=["Prediction"])
    app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
    app.include_router(genes.router, prefix="/api/v1/genes", tags=["Genes"])

    # ── Prometheus Metrics Endpoint ──────────────────────────────────────────
    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    # ── Global Exception Handler ─────────────────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "type": "UnhandledError"},
        )

    return app


app = create_app()
