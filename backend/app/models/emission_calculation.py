from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EmissionCalculation(Base):
    __tablename__ = "emission_calculations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    machine_usage_id: Mapped[int] = mapped_column(ForeignKey("machine_usage_records.id"), unique=True)
    calculation_method: Mapped[str] = mapped_column(String(100), default="electric_machine")
    emission_factor_value: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    emission_factor_unit: Mapped[str] = mapped_column(String(100), default="kgCO2e/kWh")
    estimated_co2e_kg: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    estimated_co2e_ton: Mapped[Decimal] = mapped_column(Numeric(15, 6), nullable=False)
    pollutant_estimates_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    context_ids_json: Mapped[list | None] = mapped_column(JSON, nullable=True)
    confidence_label: Mapped[str] = mapped_column(String(50), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    machine_usage = relationship("MachineUsageRecord", back_populates="calculation")
