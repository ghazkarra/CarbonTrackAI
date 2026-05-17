from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.recommendation_schema import RecommendationResponse


class AlertResponse(BaseModel):
    id: int
    company_id: int
    machine_usage_id: int | None
    alert_type: str
    severity: str
    message: str
    triggered_value: str | None
    threshold_value: str | None
    recommended_action: str | None
    status: str
    acknowledged_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertMachineUsageResponse(BaseModel):
    id: int
    report_month: str
    machine_name: str
    machine_location: str
    energy_kwh: Decimal

    model_config = {"from_attributes": True}


class SavingsSummaryResponse(BaseModel):
    total_potential_saving_idr: Decimal
    total_saving_kwh: Decimal
    total_co2_reduction_kg: Decimal
    tariff_code: str
    tariff_per_kwh_idr: Decimal


class AlertWithRecommendationsResponse(AlertResponse):
    machine_usage: AlertMachineUsageResponse | None = None
    recommendations: list[RecommendationResponse] = []

    model_config = {"from_attributes": True}


class AlertsOverviewResponse(BaseModel):
    summary: SavingsSummaryResponse
    alerts: list[AlertWithRecommendationsResponse]
