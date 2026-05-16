from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.auth import require_superadmin
from app.models.user import User
from app.services.chroma_ingestion_service import chroma_health, ingest_all_datasets


router = APIRouter(prefix="/api/superadmin/datasets", tags=["datasets"])


def dataset_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "datasets"


@router.get("")
def list_dataset_files(_: User = Depends(require_superadmin)) -> list[dict]:
    files = []
    for file_path in sorted(dataset_dir().glob("*.csv")):
        stat = file_path.stat()
        files.append({"file_name": file_path.name, "size_bytes": stat.st_size, "updated_at": stat.st_mtime})
    return files


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...), _: User = Depends(require_superadmin)) -> dict:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files are allowed")

    safe_name = Path(file.filename).name.replace("\\", "_").replace("/", "_")
    target_dir = dataset_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / safe_name
    content = await file.read()
    target_path.write_bytes(content)
    return {"status": "uploaded", "file_name": safe_name, "size_bytes": len(content)}


@router.post("/ingest")
def ingest(_: User = Depends(require_superadmin)) -> dict:
    return {"status": "ok", "counts": ingest_all_datasets()}


@router.get("/chroma-health")
def health(_: User = Depends(require_superadmin)) -> dict:
    return chroma_health()
