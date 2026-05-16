from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import require_operator
from app.database import get_db
from app.models.machine_usage import MachineUsageRecord
from app.models.user import User
from app.schemas.machine_usage_schema import ImportCsvResponse, MachineUsageCreate, MachineUsageDetailResponse, MachineUsageResponse
from app.services.machine_usage_service import create_machine_usage, import_machine_usage_csv


router = APIRouter(prefix="/api/machine-usage", tags=["machine usage"])


@router.post("", response_model=MachineUsageResponse)
def create_usage(payload: MachineUsageCreate, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> MachineUsageRecord:
    return create_machine_usage(db, payload, current_user)


@router.post("/import-csv", response_model=ImportCsvResponse)
async def import_csv(file: UploadFile = File(...), current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> ImportCsvResponse:
    return await import_machine_usage_csv(db, file, current_user)


@router.get("", response_model=list[MachineUsageResponse])
def list_usage(report_month: str | None = None, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[MachineUsageRecord]:
    query = db.query(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id)
    if report_month:
        query = query.filter(MachineUsageRecord.report_month == report_month)
    return query.order_by(MachineUsageRecord.created_at.desc()).all()


@router.get("/{usage_id}", response_model=MachineUsageDetailResponse)
def get_usage_detail(usage_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> MachineUsageRecord:
    record = db.get(MachineUsageRecord, usage_id)
    if record is None or record.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Machine usage record not found")
    return record
