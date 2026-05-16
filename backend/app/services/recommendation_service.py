from datetime import datetime

from sqlalchemy.orm import Session, selectinload

from app.models.alert import Alert
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User
from app.services.alert_service import generate_alerts_for_usage
from app.services.llm_service import generate_recommendations_with_llm
from app.services.rag_retrieval_service import retrieve_machine_context
from app.services.savings_service import apply_savings_estimate


PRIORITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}
ALLOWED_CATEGORIES = {"energy_efficiency", "maintenance", "operation", "equipment_upgrade", "safety", "reporting"}
ALLOWED_PRIORITIES = {"low", "medium", "high", "critical"}
ALLOWED_IMPACTS = {"low", "medium", "high"}


def generate_recommendations(db: Session, current_user: User, report_month: str | None = None, machine_usage_id: int | None = None) -> list[Recommendation]:
    query = (
        db.query(MachineUsageRecord)
        .options(selectinload(MachineUsageRecord.calculation))
        .filter(MachineUsageRecord.company_id == current_user.company_id)
    )
    if machine_usage_id:
        query = query.filter(MachineUsageRecord.id == machine_usage_id)
    if report_month:
        query = query.filter(MachineUsageRecord.report_month == report_month)

    records = query.order_by(MachineUsageRecord.created_at.desc()).all()
    recommendations: list[Recommendation] = []
    for record in records:
        recommendations.extend(regenerate_usage_alerts_and_recommendations(db, record, delete_existing=True))

    db.commit()
    return recommendations


def regenerate_usage_alerts_and_recommendations(db: Session, record: MachineUsageRecord, delete_existing: bool = True) -> list[Recommendation]:
    if delete_existing:
        delete_usage_alerts_and_recommendations(db, record.id)

    alerts = generate_alerts_for_usage(db, record)
    alerts.sort(key=lambda alert: (PRIORITY_ORDER.get(alert.severity, 0), alert.created_at), reverse=True)

    recommendations: list[Recommendation] = []
    for alert in alerts:
        recommendations.extend(create_recommendations_for_alert(db, alert, record))
    return recommendations


def delete_usage_alerts_and_recommendations(db: Session, usage_id: int) -> None:
    alert_ids = [row.id for row in db.query(Alert.id).filter(Alert.machine_usage_id == usage_id).all()]
    if alert_ids:
        db.query(Recommendation).filter(Recommendation.alert_id.in_(alert_ids)).delete(synchronize_session=False)
    db.query(Recommendation).filter(Recommendation.machine_usage_id == usage_id).delete(synchronize_session=False)
    db.query(Alert).filter(Alert.machine_usage_id == usage_id).delete(synchronize_session=False)


def create_recommendations_for_alert(db: Session, alert: Alert, record: MachineUsageRecord | None) -> list[Recommendation]:
    recommendations: list[Recommendation] = []
    source_context = {"source": "rule_based_mvp", "alert_id": alert.id}
    candidates = build_recommendations_for_alert(alert, record)
    try:
        retrieved_context = retrieve_machine_context(record) if record is not None else {}
        llm_recommendations = generate_recommendations_with_llm(machine_usage_to_dict(record), calculation_to_dict(record), retrieved_context)
        if llm_recommendations:
            candidates = [
                normalize_llm_recommendation(item, alert, record, fallback_index=index)
                for index, item in enumerate(llm_recommendations[:3])
            ]
            source_context = {"source": "llm_with_rag", "alert_id": alert.id, "retrieved_context": retrieved_context}
    except Exception:
        source_context = {"source": "rule_based_mvp", "alert_id": alert.id}

    for title, description, category, priority, impact in candidates:
        recommendation = Recommendation(
            company_id=alert.company_id,
            alert_id=alert.id,
            machine_usage_id=alert.machine_usage_id,
            recommendation_title=title,
            recommendation_description=description,
            category=category,
            priority=priority,
            estimated_impact=impact,
            related_machine_name=record.machine_name if record is not None else None,
            status="active",
            is_completed=False,
            source_context_json=source_context,
        )
        apply_savings_estimate(recommendation, record)
        db.add(recommendation)
        db.flush()
        recommendations.append(recommendation)

    return recommendations


def normalize_llm_recommendation(item: dict, alert: Alert, record: MachineUsageRecord | None, fallback_index: int) -> tuple[str, str, str, str, str]:
    fallback = build_recommendations_for_alert(alert, record)[min(fallback_index, len(build_recommendations_for_alert(alert, record)) - 1)]
    title, description, category, priority, impact = fallback
    return (
        str(item.get("recommendation_title") or title),
        str(item.get("recommendation_description") or description),
        normalize_choice(str(item.get("category") or category), ALLOWED_CATEGORIES, category),
        normalize_choice(str(item.get("priority") or priority), ALLOWED_PRIORITIES, priority),
        normalize_choice(str(item.get("estimated_impact") or impact), ALLOWED_IMPACTS, impact),
    )


def normalize_choice(value: str, allowed: set[str], fallback: str) -> str:
    normalized = value.strip().lower()
    return normalized if normalized in allowed else fallback


def machine_usage_to_dict(record: MachineUsageRecord | None) -> dict:
    if record is None:
        return {}
    return {
        "id": record.id,
        "report_month": record.report_month,
        "machine_name": record.machine_name,
        "machine_location": record.machine_location,
        "machine_quantity": record.machine_quantity,
        "machine_power_watt": str(record.machine_power_watt),
        "machine_power_kw": str(record.machine_power_kw),
        "usage_hours": str(record.usage_hours),
        "energy_kwh": str(record.energy_kwh),
        "validation_status": record.validation_status,
    }


def calculation_to_dict(record: MachineUsageRecord | None) -> dict | None:
    if record is None or not record.calculation:
        return None
    return {
        "calculation_method": record.calculation.calculation_method,
        "emission_factor_value": str(record.calculation.emission_factor_value),
        "emission_factor_unit": record.calculation.emission_factor_unit,
        "estimated_co2e_kg": str(record.calculation.estimated_co2e_kg),
        "estimated_co2e_ton": str(record.calculation.estimated_co2e_ton),
        "confidence_label": record.calculation.confidence_label,
        "context_ids": record.calculation.context_ids_json,
    }


def build_recommendations_for_alert(alert: Alert, record: MachineUsageRecord | None) -> list[tuple[str, str, str, str, str]]:
    machine = record.machine_name if record is not None else "mesin terkait"
    alert_type = alert.alert_type.lower()
    severity_priority = "high" if alert.severity in {"critical", "high"} else "medium" if alert.severity == "warning" else "low"
    severity_impact = "high" if alert.severity in {"critical", "high"} else "medium" if alert.severity == "warning" else "low"

    if "pemakaian energi" in alert_type or "high energy" in alert_type:
        return [
            (
                f"Optimalkan jadwal operasi {machine}",
                f"Tinjau jam idle dan geser operasi non-kritis {machine} agar konsumsi kWh yang tidak perlu bisa dikurangi.",
                "energy_efficiency",
                severity_priority,
                severity_impact,
            ),
            (
                f"Audit pola beban {machine}",
                "Bandingkan beban aktual, daya terpasang, dan jadwal operator agar konsumsi tidak normal dapat diisolasi sebelum periode pelaporan berikutnya.",
                "operation",
                "medium",
                "medium",
            ),
        ]
    if "data pemakaian" in alert_type or "missing data" in alert_type:
        return [
            (
                f"Validasi jam pemakaian {machine}",
                "Pastikan jam pemakaian benar-benar nol atau belum tercatat di log sumber sebelum data ini digunakan untuk pelaporan.",
                "reporting",
                "low",
                "low",
            ),
            (
                f"Lampirkan bukti status idle {machine}",
                "Tambahkan bukti meter, jadwal shift, atau catatan perawatan agar data nol jam dapat dibedakan dari input yang belum lengkap.",
                "reporting",
                "medium",
                "medium",
            ),
        ]
    if "ketidaksesuaian daya" in alert_type or "power mismatch" in alert_type:
        return [
            (
                f"Cocokkan rumus daya dan kWh untuk {machine}",
                "Periksa watt, kW, jumlah mesin, jam pemakaian, dan energi kWh agar nilai perhitungan sesuai dengan data yang dikirim.",
                "reporting",
                "medium",
                "medium",
            ),
            (
                f"Standarkan template input {machine}",
                "Gunakan field rumus CSV secara konsisten untuk mengurangi selisih manual antara nilai daya dan energi.",
                "operation",
                "low",
                "low",
            ),
        ]
    return [
        (
            alert.recommended_action or f"Tinjau tindakan awal untuk {machine}",
            alert.message,
            "operation",
            severity_priority,
            severity_impact,
        )
    ]


def complete_recommendation(db: Session, recommendation_id: int, current_user: User, completion_note: str | None) -> Recommendation | None:
    recommendation = db.get(Recommendation, recommendation_id)
    if recommendation is None or recommendation.company_id != current_user.company_id:
        return None
    recommendation.is_completed = True
    recommendation.status = "completed"
    recommendation.completed_at = datetime.utcnow()
    recommendation.completed_by = current_user.id
    recommendation.completion_note = completion_note
    db.commit()
    db.refresh(recommendation)
    return recommendation


def dismiss_recommendation(db: Session, recommendation_id: int, current_user: User) -> Recommendation | None:
    recommendation = db.get(Recommendation, recommendation_id)
    if recommendation is None or recommendation.company_id != current_user.company_id:
        return None
    recommendation.status = "dismissed"
    db.commit()
    db.refresh(recommendation)
    return recommendation


def backfill_recommendation_links_and_savings(db: Session) -> None:
    recommendations = db.query(Recommendation).options(selectinload(Recommendation.machine_usage)).all()
    for recommendation in recommendations:
        usage = recommendation.machine_usage
        if recommendation.alert_id is None and recommendation.machine_usage_id is not None:
            alert = (
                db.query(Alert)
                .filter(Alert.company_id == recommendation.company_id, Alert.machine_usage_id == recommendation.machine_usage_id)
                .all()
            )
            alert.sort(key=lambda item: (PRIORITY_ORDER.get(item.severity, 0), item.created_at), reverse=True)
            if alert:
                recommendation.alert_id = alert[0].id
        apply_savings_estimate(recommendation, usage)
    db.commit()
