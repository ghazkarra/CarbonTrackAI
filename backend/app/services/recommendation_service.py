from datetime import datetime

from sqlalchemy.orm import Session

from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User


def generate_recommendations(db: Session, current_user: User, report_month: str | None = None, machine_usage_id: int | None = None) -> list[Recommendation]:
    query = db.query(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id)
    if report_month:
        query = query.filter(MachineUsageRecord.report_month == report_month)
    if machine_usage_id:
        query = query.filter(MachineUsageRecord.id == machine_usage_id)

    records = query.order_by(MachineUsageRecord.energy_kwh.desc()).all()
    recommendations: list[Recommendation] = []

    for index, record in enumerate(records[:10]):
        title, description, category, priority, impact = build_recommendation(record, index)
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
            source_context_json={"source": "rule_based_mvp"},
        )
        db.add(recommendation)
        db.flush()
        recommendations.append(recommendation)

    db.commit()
    return recommendations


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
