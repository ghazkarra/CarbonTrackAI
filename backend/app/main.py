from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine
from app.models import *  # noqa: F403 - ensure SQLAlchemy models are registered
from app.routers import alert_router, auth_router, dashboard_router, dataset_router, dev_router, machine_usage_router, recommendation_router, report_router
from app.services.seed_service import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="CarbonCore AI API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "CarbonCore AI backend is running"}


app.include_router(auth_router.router)
app.include_router(machine_usage_router.router)
app.include_router(dashboard_router.router)
app.include_router(recommendation_router.router)
app.include_router(alert_router.router)
app.include_router(report_router.router)
app.include_router(dataset_router.router)
app.include_router(dev_router.router)
