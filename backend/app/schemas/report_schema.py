from datetime import date, datetime

from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    report_type: str
    period_start: date
    period_end: date


class ReportFileResponse(BaseModel):
    id: int
    company_id: int
    report_type: str
    period_start: date
    period_end: date
    file_path: str | None
    generated_by: int | None
    generated_at: datetime
    include_completed_recommendations: bool
    status: str
    error_message: str | None

    model_config = {"from_attributes": True}
