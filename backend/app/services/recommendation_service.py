from datetime import datetime

from sqlalchemy.orm import Session, selectinload

from app.models.alert import Alert
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User
from app.services.llm_service import generate_recommendations_with_llm
from app.services.rag_retrieval_service import retrieve_machine_context
from app.services.savings_service import apply_savings_estimate


PRIORITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}


def generate_recommendations(db: Session, current_user: User, report_month: str | None = None, machine_usage_id: int | None = None) -> list[Recommendation]:
    query = (
        db.query(Alert)
        .options(selectinload(Alert.machine_usage), selectinload(Alert.recommendations))
        .filter(Alert.company_id == current_user.company_id)
    )
    if machine_usage_id:
        query = query.filter(Alert.machine_usage_id == machine_usage_id)
    if report_month:
        query = query.join(MachineUsageRecord, MachineUsageRecord.id == Alert.machine_usage_id).filter(MachineUsageRecord.report_month == report_month)

    alerts = query.all()
    alerts.sort(key=lambda alert: (PRIORITY_ORDER.get(alert.severity, 0), alert.created_at), reverse=True)

    recommendations: list[Recommendation] = []
    for alert in alerts:
        record = alert.machine_usage
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
            existing = (
                db.query(Recommendation)
                .filter(
                    Recommendation.company_id == current_user.company_id,
                    Recommendation.alert_id == alert.id,
                    Recommendation.recommendation_title == title,
                )
                .first()
            )
            if existing:
                apply_savings_estimate(existing, record)
                recommendations.append(existing)
                continue

            recommendation = Recommendation(
                company_id=current_user.company_id,
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

    db.commit()
    return recommendations


def normalize_llm_recommendation(item: dict, alert: Alert, record: MachineUsageRecord | None, fallback_index: int) -> tuple[str, str, str, str, str]:
    fallback = build_recommendations_for_alert(alert, record)[min(fallback_index, len(build_recommendations_for_alert(alert, record)) - 1)]
    title, description, category, priority, impact = fallback
    return (
        str(item.get("recommendation_title") or title),
        str(item.get("recommendation_description") or description),
        normalize_choice(str(item.get("category") or category), {"energy_efficiency", "maintenance", "operation", "equipment_upgrade", "safety", "reporting"}, category),
        normalize_choice(str(item.get("priority") or priority), {"low", "medium", "high", "critical"}, priority),
        normalize_choice(str(item.get("estimated_impact") or impact), {"low", "medium", "high"}, impact),
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

    if "high energy" in alert_type:
        return [
            (
                f"Optimize operating schedule for {machine}",
                f"Review idle windows and shift non-critical operation for {machine} to reduce avoidable kWh consumption.",
                "energy_efficiency",
                severity_priority,
                severity_impact,
            ),
            (
                f"Audit load profile for {machine}",
                "Compare actual load, rated power, and operator schedule so abnormal consumption can be isolated before the next reporting period.",
                "operation",
                "medium",
                "medium",
            ),
        ]
    if "missing data" in alert_type:
        return [
            (
                f"Validate usage hours for {machine}",
                "Confirm whether usage hours are genuinely zero or missing from the source log before using this record for reporting.",
                "reporting",
                "low",
                "low",
            ),
            (
                f"Attach evidence for idle status of {machine}",
                "Add meter, shift, or maintenance evidence so zero-hour records can be distinguished from incomplete input.",
                "reporting",
                "medium",
                "medium",
            ),
        ]
    if "power mismatch" in alert_type:
        return [
            (
                f"Reconcile power and kWh formula for {machine}",
                "Check watt, kW, quantity, usage hours, and energy kWh so the calculated value matches the submitted record.",
                "reporting",
                "medium",
                "medium",
            ),
            (
                f"Standardize input template for {machine}",
                "Use the CSV formula fields consistently to reduce manual differences between power and energy values.",
                "operation",
                "low",
                "low",
            ),
        ]
    return [
        (
            alert.recommended_action or f"Review alert action for {machine}",
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
