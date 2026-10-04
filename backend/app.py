from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import Base, engine

# These imports register the SQLAlchemy models with Base.metadata.
from backend.models.auth_models import (  # noqa: F401
    Appointment,
    Enrollment,
    Message,
    RiskSnapshot,
    Student,
    StudentRequest,
    TrainingRun,
    User,
)

from backend.routes.admin_routes import router as admin_router
from backend.routes.advisor_routes import router as advisor_router
from backend.routes.auth_routes import router as auth_router
from backend.routes.demo_routes import router as demo_router
from backend.routes.prediction_routes import router as prediction_router
from backend.routes.student_routes import router as student_router
from backend.routes.upload_routes import router as upload_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize application resources when the API starts.

    During development, missing database tables are created automatically.
    Production deployments should use database migrations.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for student risk prediction, academic monitoring, "
        "advisor intervention, and student support workflows."
    ),
    version=settings.app_version,
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(advisor_router)
app.include_router(student_router)
app.include_router(upload_router)
app.include_router(prediction_router)
app.include_router(admin_router)
app.include_router(demo_router)


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    """
    Return basic API information.
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "docs": "/docs",
    }


@app.get("/api/health", tags=["System"])
def health_check() -> dict[str, str]:
    """
    Return the current API health status.
    """
    return {
        "status": "healthy",
        "service": "gradglow-backend",
        "version": settings.app_version,
        "environment": settings.environment,
    }