from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.schemas.alert_schema import AlertResponse
from app.schemas.recommendation_schema import RecommendationResponse


class MachineUsageCreate(BaseModel):
    report_month: str = Field(pattern=r"^\d{4}-\d{2}$")
    row_no: int | None = None
    machine_name: str = Field(min_length=1)
    machine_location: str = Field(min_length=1)
    machine_quantity: int = Field(gt=0)
    machine_power_watt: Decimal = Field(ge=0)
    machine_power_kw: Decimal | None = Field(default=None, ge=0)
    usage_hours: Decimal = Field(ge=0)
    energy_kwh: Decimal | None = Field(default=None, ge=0)

    @field_validator("machine_name", "machine_location")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class MachineUsageUpdate(BaseModel):
    report_month: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}$")
    row_no: int | None = None
    machine_name: str | None = Field(default=None, min_length=1)
    machine_location: str | None = Field(default=None, min_length=1)
    machine_quantity: int | None = Field(default=None, gt=0)
    machine_power_watt: Decimal | None = Field(default=None, ge=0)
    machine_power_kw: Decimal | None = Field(default=None, ge=0)
    usage_hours: Decimal | None = Field(default=None, ge=0)
    energy_kwh: Decimal | None = Field(default=None, ge=0)

    @field_validator("machine_name", "machine_location")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None


class MachineUsageResponse(BaseModel):
    id: int
    batch_id: int | None
    company_id: int
    report_month: str
    row_no: int | None
    machine_name: str
    machine_location: str
    machine_quantity: int
    machine_power_watt: Decimal
    machine_power_kw: Decimal
    usage_hours: Decimal
    energy_kwh: Decimal
    data_source: str
    validation_status: str
    validation_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class EmissionCalculationResponse(BaseModel):
    id: int
    calculation_method: str
    emission_factor_value: Decimal
    emission_factor_unit: str
    estimated_co2e_kg: Decimal
    estimated_co2e_ton: Decimal
    confidence_label: str

    model_config = {"from_attributes": True}


class MachineUsageStatisticsResponse(BaseModel):
    total_energy_kwh: Decimal
    estimated_co2e_kg: Decimal
    estimated_co2e_ton: Decimal
    total_potential_saving_idr: Decimal
    total_saving_kwh: Decimal
    total_co2_reduction_kg: Decimal
    tariff_code: str
    tariff_per_kwh_idr: Decimal


class MachineUsageDetailResponse(MachineUsageResponse):
    calculation: EmissionCalculationResponse | None = None
    statistics: MachineUsageStatisticsResponse
    alerts: list[AlertResponse] = []
    recommendations: list[RecommendationResponse] = []


class ImportRowResult(BaseModel):
    row_no: int | None
    machine_name: str | None
    status: str
    validation_message: str | None
    energy_kwh: Decimal | None


class ImportCsvResponse(BaseModel):
    batch_id: int | None
    total_rows: int
    valid_rows: int
    warning_rows: int
    error_rows: int
    rows: list[ImportRowResult]
