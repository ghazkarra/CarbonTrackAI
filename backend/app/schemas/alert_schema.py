from datetime import datetime

from pydantic import BaseModel


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
