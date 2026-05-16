from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import require_operator
from app.database import get_db
from app.models.report_file import ReportFile
from app.models.user import User
from app.schemas.report_schema import ReportFileResponse, ReportGenerateRequest
from app.services.pdf_report_service import generate_pdf_report


router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/generate", response_model=ReportFileResponse)
def generate(payload: ReportGenerateRequest, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> ReportFile:
    if payload.report_type not in {"daily", "weekly", "monthly", "annual"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid report_type")
    return generate_pdf_report(db, current_user, payload.report_type, payload.period_start, payload.period_end)


@router.get("", response_model=list[ReportFileResponse])
def list_reports(current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[ReportFile]:
    return db.query(ReportFile).filter(ReportFile.company_id == current_user.company_id).order_by(ReportFile.generated_at.desc()).all()


@router.get("/{report_id}/download")
def download(report_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> FileResponse:
    report = db.get(ReportFile, report_id)
    if report is None or report.company_id != current_user.company_id or not report.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return FileResponse(report.file_path, media_type="application/pdf", filename=report.file_path.split("/")[-1])


@router.get("/{report_id}/preview")
def preview(report_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> FileResponse:
    return download(report_id, current_user, db)
