from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.auth import require_operator
from app.database import get_db
from app.models.alert import Alert
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.alert_schema import AlertResponse, AlertsOverviewResponse
from app.services.alert_service import acknowledge_alert
from app.services.savings_service import build_savings_summary


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/overview", response_model=AlertsOverviewResponse)
def alerts_overview(
    report_month: str | None = None,
    severity: str | None = None,
    status_filter: str | None = None,
    current_user: User = Depends(require_operator),
    db: Session = Depends(get_db),
) -> dict:
    query = (
        db.query(Alert)
        .options(selectinload(Alert.machine_usage), selectinload(Alert.recommendations))
        .filter(Alert.company_id == current_user.company_id)
    )
    if severity:
        query = query.filter(Alert.severity == severity)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if report_month:
        query = query.join(MachineUsageRecord, MachineUsageRecord.id == Alert.machine_usage_id).filter(MachineUsageRecord.report_month == report_month)

    alerts = query.all()
    for alert in alerts:
        alert.recommendations.sort(key=lambda item: (item.is_completed, -priority_score(item.priority), item.created_at))
    alerts.sort(key=lambda alert: (alert.status == "acknowledged", all(item.is_completed for item in alert.recommendations) if alert.recommendations else False, -severity_score(alert.severity), alert.created_at))

    recommendation_query = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id)
    if report_month:
        usage_ids = db.query(MachineUsageRecord.id).filter(MachineUsageRecord.company_id == current_user.company_id, MachineUsageRecord.report_month == report_month)
        recommendation_query = recommendation_query.filter(Recommendation.machine_usage_id.in_(usage_ids))

    return {"summary": build_savings_summary(recommendation_query.all()), "alerts": alerts}


@router.get("", response_model=list[AlertResponse])
def list_alerts(severity: str | None = None, status_filter: str | None = None, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[Alert]:
    query = db.query(Alert).filter(Alert.company_id == current_user.company_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.created_at.desc()).all()


def severity_score(severity: str) -> int:
    return {"critical": 4, "high": 3, "warning": 2, "info": 1}.get(severity, 0)


def priority_score(priority: str) -> int:
    return {"critical": 4, "high": 3, "medium": 2, "low": 1}.get(priority, 0)


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None or alert.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peringatan tidak ditemukan")
    return alert


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge(alert_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Alert:
    alert = acknowledge_alert(db, alert_id, current_user)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Peringatan tidak ditemukan")
    return alert
