from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class RecommendationGenerateRequest(BaseModel):
    report_month: str | None = None
    machine_usage_id: int | None = None


class RecommendationCompleteRequest(BaseModel):
    is_completed: bool = True
    completion_note: str | None = None


class RecommendationResponse(BaseModel):
    id: int
    company_id: int
    alert_id: int | None
    machine_usage_id: int | None
    recommendation_title: str
    recommendation_description: str
    category: str
    priority: str
    estimated_impact: str
    related_machine_name: str | None
    status: str
    is_completed: bool
    estimated_saving_kwh: Decimal
    estimated_saving_idr: Decimal
    estimated_co2_reduction_kg: Decimal
    completed_at: datetime | None
    completion_note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
