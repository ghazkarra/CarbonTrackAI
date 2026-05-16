from decimal import Decimal

from pydantic import BaseModel


class TopMachine(BaseModel):
    machine_name: str
    machine_location: str
    energy_kwh: Decimal
    estimated_co2e_kg: Decimal


class DashboardSummary(BaseModel):
    total_energy_kwh: Decimal
    estimated_co2e_kg: Decimal
    estimated_co2e_ton: Decimal
    active_alerts_count: int
    completed_recommendations_this_month: int
    top_machines: list[TopMachine]
    recommendation_progress: dict[str, int]
