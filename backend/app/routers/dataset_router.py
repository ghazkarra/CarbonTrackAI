from fastapi import APIRouter, Depends

from app.auth import require_superadmin
from app.models.user import User
from app.services.chroma_ingestion_service import chroma_health, ingest_all_datasets


router = APIRouter(prefix="/api/superadmin/datasets", tags=["datasets"])


@router.post("/ingest")
def ingest(_: User = Depends(require_superadmin)) -> dict:
    return {"status": "ok", "counts": ingest_all_datasets()}


@router.get("/chroma-health")
def health(_: User = Depends(require_superadmin)) -> dict:
    return chroma_health()
