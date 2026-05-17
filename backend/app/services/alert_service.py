from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.machine_usage import MachineUsageRecord
from app.models.user import User
from app.services.llm_service import explain_alert_with_llm
from app.services.rag_retrieval_service import retrieve_machine_context


HIGH_ENERGY_THRESHOLD_KWH = Decimal("250")
HIGH_POWER_IDLE_THRESHOLD_WATT = Decimal("500")


def generate_alerts_for_usage(db: Session, usage: MachineUsageRecord) -> list[Alert]:
    alerts: list[Alert] = []

    if usage.energy_kwh >= HIGH_ENERGY_THRESHOLD_KWH:
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="Pemakaian Energi Tinggi",
                severity="high",
                message=f"{usage.machine_name} memiliki konsumsi energi tinggi pada periode ini.",
                triggered_value=f"{usage.energy_kwh} kWh",
                threshold_value=f">= {HIGH_ENERGY_THRESHOLD_KWH} kWh",
                recommended_action="Tinjau jadwal operasi dan kurangi waktu mesin menyala tanpa produksi.",
            )
        )

    if usage.usage_hours == 0 and usage.machine_power_watt >= HIGH_POWER_IDLE_THRESHOLD_WATT:
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="Data Pemakaian Tidak Lengkap",
                severity="warning",
                message=f"{usage.machine_name} memiliki data daya, tetapi jam pemakaian tercatat nol.",
                triggered_value="0 jam pemakaian",
                threshold_value="Daya > 500 watt dengan pemakaian nol",
                recommended_action="Pastikan mesin benar-benar idle atau data jam pemakaian belum lengkap.",
            )
        )

    if usage.validation_status == "warning":
        alerts.append(
            create_alert_if_missing(
                db,
                usage,
                alert_type="Ketidaksesuaian Daya/Energi",
                severity="warning",
                message=usage.validation_message or "Terdeteksi selisih antara input dan hasil perhitungan rumus.",
                triggered_value="Nilai manual berbeda dari rumus",
                threshold_value="Toleransi rumus 2%",
                recommended_action="Validasi input watt, kW, jam pemakaian, dan energi kWh.",
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

    source_context = {"source": "rule_based_mvp"}
    try:
        retrieved_context = retrieve_machine_context(usage)
        explanation = explain_alert_with_llm(
            {
                "alert_type": alert_type,
                "severity": severity,
                "machine_name": usage.machine_name,
                "triggered_value": triggered_value,
                "threshold_value": threshold_value,
                "message": message,
                "recommended_action": recommended_action,
            },
            retrieved_context,
        )
        if explanation:
            message = str(explanation.get("message") or message)
            recommended_action = str(explanation.get("recommended_action") or recommended_action)
            source_context = {"source": "llm_with_rag", "severity_reason": explanation.get("severity_reason"), "retrieved_context": retrieved_context}
    except Exception:
        source_context = {"source": "rule_based_mvp"}

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
        source_context_json=source_context,
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
