from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.report_file import ReportFile
from app.models.user import User
from app.services.llm_service import generate_report_summary_with_llm


REPORT_TYPES_WITH_COMPLETED = {"monthly", "annual"}
REPORT_TYPE_LABELS = {"daily": "Harian", "weekly": "Mingguan", "monthly": "Bulanan", "annual": "Tahunan"}
SEVERITY_LABELS = {"critical": "Kritis", "high": "Tinggi", "warning": "Peringatan", "info": "Info"}
PRIORITY_LABELS = {"critical": "Kritis", "high": "Tinggi", "medium": "Sedang", "low": "Rendah"}


def generate_pdf_report(db: Session, current_user: User, report_type: str, period_start, period_end) -> ReportFile:
    normalized_type = report_type.lower()
    include_completed = normalized_type in REPORT_TYPES_WITH_COMPLETED
    report = ReportFile(
        company_id=current_user.company_id,
        report_type=normalized_type,
        period_start=period_start,
        period_end=period_end,
        file_path=None,
        generated_by=current_user.id,
        include_completed_recommendations=include_completed,
        status="generated",
    )
    db.add(report)
    db.flush()

    report.preview_data_json = build_report_payload(db, current_user, normalized_type, period_start, period_end, report.id)
    db.commit()
    db.refresh(report)
    return report


def build_report_payload(db: Session, current_user: User, report_type: str, period_start, period_end, report_id: int | None = None) -> dict:
    include_completed = report_type in REPORT_TYPES_WITH_COMPLETED
    start_month = period_start.strftime("%Y-%m")
    end_month = period_end.strftime("%Y-%m")
    records = (
        db.query(MachineUsageRecord)
        .filter(
            MachineUsageRecord.company_id == current_user.company_id,
            MachineUsageRecord.report_month >= start_month,
            MachineUsageRecord.report_month <= end_month,
        )
        .order_by(MachineUsageRecord.energy_kwh.desc())
        .all()
    )
    usage_ids = [record.id for record in records]
    calculations = db.query(EmissionCalculation).filter(EmissionCalculation.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    co2e_by_usage_id = {calc.machine_usage_id: float(calc.estimated_co2e_kg) for calc in calculations}
    total_energy = sum(float(record.energy_kwh) for record in records)
    total_co2e = sum(co2e_by_usage_id.values())
    alerts = db.query(Alert).filter(Alert.company_id == current_user.company_id, Alert.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    active_recommendations = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "active", Recommendation.machine_usage_id.in_(usage_ids)).all() if usage_ids else []
    completed_recommendations = []
    if include_completed and usage_ids:
        completed_recommendations = (
            db.query(Recommendation)
            .filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "completed", Recommendation.machine_usage_id.in_(usage_ids))
            .all()
        )

    included_recommendations = active_recommendations + completed_recommendations
    source_context_ids = sorted({context_id for calc in calculations for context_id in (calc.context_ids_json or [])})
    validation_status_counts = count_by(records, lambda record: record.validation_status or "unknown")
    data_source_counts = count_by(records, lambda record: record.data_source or "unknown")
    alert_severity_counts = count_by(alerts, lambda alert: alert.severity or "unknown")
    alert_type_counts = count_by(alerts, lambda alert: alert.alert_type or "unknown")
    alert_status_counts = count_by(alerts, lambda alert: alert.status or "unknown")
    recommendation_priority_counts = count_by(included_recommendations, lambda recommendation: recommendation.priority or "unknown")
    recommendation_category_counts = count_by(included_recommendations, lambda recommendation: recommendation.category or "unknown")
    recommendation_status_counts = count_by(included_recommendations, lambda recommendation: recommendation.status or "unknown")
    saving_kwh_by_priority = sum_by(included_recommendations, lambda recommendation: recommendation.priority or "unknown", lambda recommendation: recommendation.estimated_saving_kwh)
    saving_idr_by_priority = sum_by(included_recommendations, lambda recommendation: recommendation.priority or "unknown", lambda recommendation: recommendation.estimated_saving_idr)
    energy_by_source = sum_by(records, lambda record: record.data_source or "unknown", lambda record: record.energy_kwh)
    records_by_source = count_by(records, lambda record: record.data_source or "unknown")
    report_data = {
        "company_name": current_user.company.company_name if current_user.company else "Company",
        "report_type": report_type,
        "period_start": str(period_start),
        "period_end": str(period_end),
        "total_energy_kwh": total_energy,
        "estimated_co2e_kg": total_co2e,
        "estimated_co2e_ton": total_co2e / 1000,
        "records_count": len(records),
        "active_alerts_count": len(alerts),
        "active_recommendations_count": len(active_recommendations),
        "completed_recommendations_count": len(completed_recommendations),
        "total_usage_hours": sum(float(record.usage_hours) for record in records),
        "total_power_kw": sum(float(record.machine_power_kw) for record in records),
        "validation_status_counts": validation_status_counts,
        "data_source_counts": data_source_counts,
        "alert_severity_counts": alert_severity_counts,
        "alert_type_counts": alert_type_counts,
        "alert_status_counts": alert_status_counts,
        "recommendation_priority_counts": recommendation_priority_counts,
        "recommendation_category_counts": recommendation_category_counts,
        "recommendation_status_counts": recommendation_status_counts,
        "total_estimated_saving_kwh": sum(float(recommendation.estimated_saving_kwh or 0) for recommendation in included_recommendations),
        "total_estimated_saving_idr": sum(float(recommendation.estimated_saving_idr or 0) for recommendation in included_recommendations),
        "total_estimated_co2_reduction_kg": sum(float(recommendation.estimated_co2_reduction_kg or 0) for recommendation in included_recommendations),
        "source_context_ids": source_context_ids,
    }
    summary = normalize_summary(generate_report_summary_with_llm(report_type, report_data) or fallback_summary(report_data))
    top_records = records[:10]

    return {
        "metadata": {
            "id": report_id,
            "company_name": report_data["company_name"],
            "report_type": report_type,
            "period_start": str(period_start),
            "period_end": str(period_end),
            "period_label": f"{period_start} sampai {period_end}",
            "include_completed_recommendations": include_completed,
        },
        "metrics": report_data,
        "highlights": [
            {"label": "Total Energy", "value": round(total_energy, 2), "unit": "kWh", "description": "Konsumsi energi dalam periode laporan"},
            {"label": "Estimated CO2e", "value": round(total_co2e, 2), "unit": "kg", "description": "Estimasi emisi karbon"},
            {"label": "Usage Records", "value": len(records), "unit": "record", "description": "Data operasional dianalisis"},
            {"label": "Active Alerts", "value": len(alerts), "unit": "alert", "description": "Isu aktif yang perlu ditindaklanjuti"},
            {"label": "Active Recommendations", "value": len(active_recommendations), "unit": "rekomendasi", "description": "Peluang penghematan aktif"},
            {"label": "Completed Recommendations", "value": len(completed_recommendations), "unit": "rekomendasi", "description": "Rekomendasi selesai dalam laporan"},
        ],
        "charts": {
            "emission_trend": monthly_trend(records, co2e_by_usage_id),
            "top_machines": [
                {"label": record.machine_name, "value": round(float(record.energy_kwh), 2), "secondary_value": round(co2e_by_usage_id.get(record.id, 0), 2)}
                for record in top_records[:6]
            ],
            "machine_energy_by_source": [
                {"label": format_label(label), "value": round(value, 2), "secondary_value": float(records_by_source.get(label, 0))}
                for label, value in sorted(energy_by_source.items(), key=lambda item: item[1], reverse=True)
            ],
            "machine_validation_status": chart_points_from_counts(validation_status_counts),
            "alert_severity_breakdown": chart_points_from_counts(alert_severity_counts),
            "alert_type_breakdown": chart_points_from_counts(alert_type_counts),
            "recommendation_status_breakdown": chart_points_from_counts(recommendation_status_counts),
            "recommendation_savings_by_priority": [
                {"label": format_label(label), "value": round(value, 2), "secondary_value": round(saving_idr_by_priority.get(label, 0), 2)}
                for label, value in sorted(saving_kwh_by_priority.items(), key=lambda item: item[1], reverse=True)
            ],
        },
        "summary": summary,
        "tables": {
            "machine_usage": [machine_usage_row(record, co2e_by_usage_id.get(record.id, 0)) for record in top_records],
            "alerts": [alert_row(alert) for alert in alerts[:10]],
            "active_recommendations": [recommendation_row(recommendation) for recommendation in active_recommendations[:10]],
            "completed_recommendations": [recommendation_row(recommendation) for recommendation in completed_recommendations[:10]],
            "source_context_ids": source_context_ids[:12],
        },
    }


def count_by(items, key_fn) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        key = str(key_fn(item) or "unknown")
        counts[key] = counts.get(key, 0) + 1
    return counts


def sum_by(items, key_fn, value_fn) -> dict[str, float]:
    totals: dict[str, float] = {}
    for item in items:
        key = str(key_fn(item) or "unknown")
        totals[key] = totals.get(key, 0) + float(value_fn(item) or 0)
    return totals


def chart_points_from_counts(counts: dict[str, int]) -> list[dict]:
    return [{"label": format_label(label), "value": float(value), "secondary_value": None} for label, value in sorted(counts.items(), key=lambda item: item[1], reverse=True)]


def format_label(value: str) -> str:
    return value.replace("_", " ").title()


def monthly_trend(records, co2e_by_usage_id: dict[int, float]) -> list[dict]:
    by_month: dict[str, dict[str, float]] = {}
    for record in records:
        bucket = by_month.setdefault(record.report_month, {"value": 0, "secondary_value": 0})
        bucket["value"] += co2e_by_usage_id.get(record.id, 0)
        bucket["secondary_value"] += float(record.energy_kwh)
    return [
        {"label": month, "value": round(values["value"], 2), "secondary_value": round(values["secondary_value"], 2)}
        for month, values in sorted(by_month.items())
    ]


def machine_usage_row(record, co2e: float) -> dict:
    return {
        "machine": record.machine_name,
        "location": record.machine_location,
        "quantity": record.machine_quantity,
        "power_kw": float(record.machine_power_kw),
        "usage_hours": float(record.usage_hours),
        "energy_kwh": float(record.energy_kwh),
        "estimated_co2e_kg": round(co2e, 2),
        "validation_status": record.validation_status,
        "data_source": record.data_source,
    }


def alert_row(alert) -> dict:
    return {
        "severity": alert.severity,
        "type": alert.alert_type,
        "message": alert.message,
        "recommended_action": alert.recommended_action or "-",
        "status": alert.status,
        "triggered_value": alert.triggered_value,
        "threshold_value": alert.threshold_value,
    }


def recommendation_row(recommendation) -> dict:
    return {
        "priority": recommendation.priority,
        "category": recommendation.category,
        "title": recommendation.recommendation_title,
        "recommendation_description": recommendation.recommendation_description,
        "machine": recommendation.related_machine_name or "-",
        "status": recommendation.status,
        "completion_note": recommendation.completion_note or "-",
        "estimated_saving_kwh": float(recommendation.estimated_saving_kwh or 0),
        "estimated_saving_idr": float(recommendation.estimated_saving_idr or 0),
        "estimated_co2_reduction_kg": float(recommendation.estimated_co2_reduction_kg or 0),
    }


def normalize_summary(summary: dict) -> dict:
    return {
        "executive_summary": str(summary.get("executive_summary") or "No summary available."),
        "key_findings": [str(item) for item in (summary.get("key_findings") or [])],
        "management_notes": [str(item) for item in (summary.get("management_notes") or [])],
    }


def fallback_summary(report_data: dict) -> dict:
    return {
        "executive_summary": (
            f"Selama periode {report_data['period_start']} sampai {report_data['period_end']}, "
            f"total konsumsi energi mencapai {report_data['total_energy_kwh']:,.2f} kWh "
            f"dengan estimasi emisi {report_data['estimated_co2e_kg']:,.2f} kg CO2e."
        ),
        "key_findings": [
            f"{report_data['records_count']} data pemakaian mesin disertakan.",
            f"{report_data['active_alerts_count']} peringatan aktif teridentifikasi.",
            f"{report_data['active_recommendations_count']} rekomendasi aktif tersedia.",
        ],
        "management_notes": ["Prioritaskan mesin dengan konsumsi energi tinggi dan selesaikan rekomendasi sebelum periode pelaporan berikutnya."],
    }

