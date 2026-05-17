from datetime import date, datetime

from pydantic import BaseModel


class ReportMetric(BaseModel):
    label: str
    value: float | int | str
    unit: str | None = None
    description: str | None = None


class ReportChartPoint(BaseModel):
    label: str
    value: float
    secondary_value: float | None = None


class ReportSummary(BaseModel):
    executive_summary: str
    key_findings: list[str]
    management_notes: list[str]


class ReportPreviewResponse(BaseModel):
    metadata: dict
    metrics: dict
    highlights: list[ReportMetric]
    charts: dict[str, list[ReportChartPoint]]
    summary: ReportSummary
    tables: dict


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
    preview_data_json: dict | None = None

    model_config = {"from_attributes": True}
