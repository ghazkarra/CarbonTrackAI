from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import require_operator
from app.database import get_db
from app.models.alert import Alert
from app.models.emission_calculation import EmissionCalculation
from app.models.machine_usage import MachineUsageRecord
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.dashboard_schema import DashboardSummary, EmissionTrendPoint, TopMachine


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(period_month: str | None = None, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> DashboardSummary:
    usage_query = db.query(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id)
    if period_month:
        usage_query = usage_query.filter(MachineUsageRecord.report_month == period_month)
    usage_ids = [row.id for row in usage_query.all()]

    total_energy = usage_query.with_entities(func.coalesce(func.sum(MachineUsageRecord.energy_kwh), 0)).scalar() or Decimal("0")
    calc_query = db.query(EmissionCalculation).join(MachineUsageRecord).filter(MachineUsageRecord.company_id == current_user.company_id)
    if period_month:
        calc_query = calc_query.filter(MachineUsageRecord.report_month == period_month)
    total_co2e_kg = calc_query.with_entities(func.coalesce(func.sum(EmissionCalculation.estimated_co2e_kg), 0)).scalar() or Decimal("0")
    total_co2e_ton = Decimal(total_co2e_kg) / Decimal("1000")

    top_rows = (
        db.query(
            MachineUsageRecord.machine_name,
            MachineUsageRecord.machine_location,
            func.sum(MachineUsageRecord.energy_kwh).label("energy_kwh"),
            func.coalesce(func.sum(EmissionCalculation.estimated_co2e_kg), 0).label("estimated_co2e_kg"),
        )
        .outerjoin(EmissionCalculation, EmissionCalculation.machine_usage_id == MachineUsageRecord.id)
        .filter(MachineUsageRecord.company_id == current_user.company_id)
    )
    if period_month:
        top_rows = top_rows.filter(MachineUsageRecord.report_month == period_month)
    top_rows = top_rows.group_by(MachineUsageRecord.machine_name, MachineUsageRecord.machine_location).order_by(func.sum(MachineUsageRecord.energy_kwh).desc()).limit(10).all()

    actual_trend_rows = (
        db.query(
            MachineUsageRecord.report_month,
            func.coalesce(func.sum(EmissionCalculation.estimated_co2e_kg), 0).label("estimated_co2e_kg"),
        )
        .outerjoin(EmissionCalculation, EmissionCalculation.machine_usage_id == MachineUsageRecord.id)
        .filter(MachineUsageRecord.company_id == current_user.company_id)
        .group_by(MachineUsageRecord.report_month)
        .order_by(MachineUsageRecord.report_month.desc())
        .limit(12)
        .all()
    )
    trend_months = [row.report_month for row in actual_trend_rows]
    reduction_by_month = {}
    if trend_months:
        reduction_rows = (
            db.query(
                MachineUsageRecord.report_month,
                func.coalesce(func.sum(Recommendation.estimated_co2_reduction_kg), 0).label("completed_reduction_kg"),
            )
            .join(MachineUsageRecord, MachineUsageRecord.id == Recommendation.machine_usage_id)
            .filter(
                Recommendation.company_id == current_user.company_id,
                Recommendation.status == "completed",
                MachineUsageRecord.report_month.in_(trend_months),
            )
            .group_by(MachineUsageRecord.report_month)
            .all()
        )
        reduction_by_month = {row.report_month: Decimal(row.completed_reduction_kg or 0) for row in reduction_rows}

    active_alerts_count = db.query(Alert).filter(Alert.company_id == current_user.company_id, Alert.status == "active").count()
    completed_query = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "completed")
    if period_month:
        completed_query = completed_query.filter(Recommendation.machine_usage_id.in_(usage_ids) if usage_ids else False)
    completed_count = completed_query.count()
    active_recommendations = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id, Recommendation.status == "active").count()

    return DashboardSummary(
        total_energy_kwh=Decimal(total_energy),
        estimated_co2e_kg=Decimal(total_co2e_kg),
        estimated_co2e_ton=total_co2e_ton,
        active_alerts_count=active_alerts_count,
        completed_recommendations_this_month=completed_count,
        top_machines=[TopMachine(machine_name=row.machine_name, machine_location=row.machine_location, energy_kwh=row.energy_kwh, estimated_co2e_kg=row.estimated_co2e_kg) for row in top_rows],
        emission_trend=[
            EmissionTrendPoint(
                month=row.report_month,
                actual_co2e_kg=Decimal(row.estimated_co2e_kg or 0),
                completed_reduction_kg=reduction_by_month.get(row.report_month, Decimal("0")),
                net_co2e_kg=max(Decimal(row.estimated_co2e_kg or 0) - reduction_by_month.get(row.report_month, Decimal("0")), Decimal("0")),
            )
            for row in reversed(actual_trend_rows)
        ],
        recommendation_progress={"active": active_recommendations, "completed": completed_count, "dismissed": 0},
    )
