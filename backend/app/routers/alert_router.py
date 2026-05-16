from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_operator
from app.database import get_db
from app.models.alert import Alert
from app.models.user import User
from app.schemas.alert_schema import AlertResponse
from app.services.alert_service import acknowledge_alert


router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def list_alerts(severity: str | None = None, status_filter: str | None = None, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[Alert]:
    query = db.query(Alert).filter(Alert.company_id == current_user.company_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.created_at.desc()).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None or alert.company_id != current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge(alert_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Alert:
    alert = acknowledge_alert(db, alert_id, current_user)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert
