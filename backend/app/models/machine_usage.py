from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class MachineUsageBatch(Base):
    __tablename__ = "machine_usage_batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    report_month: Mapped[str] = mapped_column(String(7), nullable=False)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    total_rows: Mapped[int] = mapped_column(default=0)
    valid_rows: Mapped[int] = mapped_column(default=0)
    warning_rows: Mapped[int] = mapped_column(default=0)
    error_rows: Mapped[int] = mapped_column(default=0)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    records = relationship("MachineUsageRecord", back_populates="batch")


class MachineUsageRecord(Base):
    __tablename__ = "machine_usage_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    batch_id: Mapped[int | None] = mapped_column(ForeignKey("machine_usage_batches.id"), nullable=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    report_month: Mapped[str] = mapped_column(String(7), index=True, nullable=False)
    report_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    row_no: Mapped[int | None] = mapped_column(nullable=True)
    machine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    machine_location: Mapped[str] = mapped_column(String(255), nullable=False)
    machine_quantity: Mapped[int] = mapped_column(nullable=False)
    machine_power_watt: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    machine_power_kw: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    usage_hours: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    energy_kwh: Mapped[Decimal] = mapped_column(Numeric(15, 4), nullable=False)
    data_source: Mapped[str] = mapped_column(String(50), default="form")
    validation_status: Mapped[str] = mapped_column(String(50), default="valid")
    validation_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    batch = relationship("MachineUsageBatch", back_populates="records")
    calculation = relationship("EmissionCalculation", back_populates="machine_usage", uselist=False)
