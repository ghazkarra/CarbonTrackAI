from datetime import datetime

from sqlalchemy.orm import Session

from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User
from app.services.llm_service import generate_recommendations_with_llm
from app.services.rag_retrieval_service import retrieve_machine_context


def generate_recommendations(db: Session, current_user: User, report_month: str | None = None, machine_usage_id: int | None = None) -> list[Recommendation]:
    query = db.query(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id)
    if report_month:
        query = query.filter(MachineUsageRecord.report_month == report_month)
    if machine_usage_id:
        query = query.filter(MachineUsageRecord.id == machine_usage_id)

    records = query.order_by(MachineUsageRecord.energy_kwh.desc()).all()
    recommendations: list[Recommendation] = []

    for index, record in enumerate(records[:10]):
        source_context = {"source": "rule_based_mvp"}
        title, description, category, priority, impact = build_recommendation(record, index)
        try:
            retrieved_context = retrieve_machine_context(record)
            llm_recommendations = generate_recommendations_with_llm(machine_usage_to_dict(record), calculation_to_dict(record), retrieved_context)
            if llm_recommendations:
                first = llm_recommendations[0]
                title = str(first.get("recommendation_title") or title)
                description = str(first.get("recommendation_description") or description)
                category = normalize_choice(str(first.get("category") or category), {"energy_efficiency", "maintenance", "operation", "equipment_upgrade", "safety", "reporting"}, category)
                priority = normalize_choice(str(first.get("priority") or priority), {"low", "medium", "high", "critical"}, priority)
                impact = normalize_choice(str(first.get("estimated_impact") or impact), {"low", "medium", "high"}, impact)
                source_context = {"source": "llm_with_rag", "retrieved_context": retrieved_context}
        except Exception:
            source_context = {"source": "rule_based_mvp"}
        existing = (
            db.query(Recommendation)
            .filter(
                Recommendation.company_id == current_user.company_id,
                Recommendation.machine_usage_id == record.id,
                Recommendation.recommendation_title == title,
            )
            .first()
        )
        if existing:
            recommendations.append(existing)
            continue

        recommendation = Recommendation(
            company_id=current_user.company_id,
            machine_usage_id=record.id,
            recommendation_title=title,
            recommendation_description=description,
            category=category,
            priority=priority,
            estimated_impact=impact,
            related_machine_name=record.machine_name,
            status="active",
            is_completed=False,
            source_context_json=source_context,
        )
        db.add(recommendation)
        db.flush()
        recommendations.append(recommendation)

    db.commit()
    return recommendations


def normalize_choice(value: str, allowed: set[str], fallback: str) -> str:
    normalized = value.strip().lower()
    return normalized if normalized in allowed else fallback


def machine_usage_to_dict(record: MachineUsageRecord) -> dict:
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


def calculation_to_dict(record: MachineUsageRecord) -> dict | None:
    if not record.calculation:
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


def build_recommendation(record: MachineUsageRecord, rank_index: int) -> tuple[str, str, str, str, str]:
    machine_name = record.machine_name.lower()
    if "genset" in machine_name:
        return (
            "Reduce low-load genset operation",
            "Prioritize efficient electricity sources and avoid running genset during low-load periods to reduce emissions.",
            "operation",
            "high",
            "high",
        )
    if "kompresor" in machine_name or "compressor" in machine_name:
        return (
            "Inspect compressor air leaks",
            "Check for compressed air leaks and schedule preventive maintenance to reduce unnecessary energy consumption.",
            "maintenance",
            "medium",
            "medium",
        )
    if record.energy_kwh == 0 and record.machine_power_watt > 0:
        return (
            "Validate zero usage record",
            "Confirm whether this machine was idle or if usage data is incomplete before report generation.",
            "reporting",
            "low",
            "low",
        )
    if rank_index < 3:
        return (
            "Optimize high-energy machine schedule",
            "Review operating hours and shut down this high-consuming machine during idle windows.",
            "energy_efficiency",
            "high",
            "high",
        )
    return (
        "Improve machine usage tracking",
        "Keep usage hours and power data updated to improve emission calculation accuracy.",
        "reporting",
        "medium",
        "medium",
    )


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
