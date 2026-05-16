from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.machine_usage import MachineUsageRecord
from app.models.user import User


HIGH_ENERGY_THRESHOLD_KWH = Decimal("250")
HIGH_POWER_IDLE_THRESHOLD_WATT = Decimal("500")


def generate_alerts_for_usage(db: Session, usage: MachineUsageRecord) -> list[Alert]:
    alerts: list[Alert] = []

    if usage.energy_kwh >= HIGH_ENERGY_THRESHOLD_KWH:
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="High Energy Usage",
                severity="high",
                message=f"{usage.machine_name} has high energy consumption for this period.",
                triggered_value=f"{usage.energy_kwh} kWh",
                threshold_value=f">= {HIGH_ENERGY_THRESHOLD_KWH} kWh",
                recommended_action="Review operating schedule and reduce idle runtime.",
            )
        )

    if usage.usage_hours == 0 and usage.machine_power_watt >= HIGH_POWER_IDLE_THRESHOLD_WATT:
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="Missing Data",
                severity="warning",
                message=f"{usage.machine_name} has power data but zero usage hours.",
                triggered_value="0 usage hours",
                threshold_value="Power > 500 watt with zero usage",
                recommended_action="Confirm whether the machine was idle or usage data is incomplete.",
            )
        )

    if usage.validation_status == "warning":
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="Power Mismatch",
                severity="warning",
                message=usage.validation_message or "Formula mismatch detected.",
                triggered_value="Manual value differs from formula",
                threshold_value="2% formula tolerance",
                recommended_action="Validate watt, kW, usage hours, and energy kWh input.",
            )
        )

    return [alert for alert in alerts if alert is not None]


def create_alert_if_missing(
    db: Session,
    usage: MachineUsageRecord,
    alert_type: str,
    severity: str,
    message: str,
    triggered_value: str,
    threshold_value: str,
    recommended_action: str,
) -> Alert | None:
    existing = (
        db.query(Alert)
        .filter(Alert.company_id == usage.company_id, Alert.machine_usage_id == usage.id, Alert.alert_type == alert_type)
        .first()
    )
    if existing:
        return existing

    alert = Alert(
        company_id=usage.company_id,
        machine_usage_id=usage.id,
        alert_type=alert_type,
        severity=severity,
        message=message,
        triggered_value=triggered_value,
        threshold_value=threshold_value,
        recommended_action=recommended_action,
        status="active",
        source_context_json={"source": "rule_based_mvp"},
    )
    db.add(alert)
    db.flush()
    return alert


def acknowledge_alert(db: Session, alert_id: int, current_user: User) -> Alert | None:
    alert = db.get(Alert, alert_id)
    if alert is None or alert.company_id != current_user.company_id:
        return None
    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert
