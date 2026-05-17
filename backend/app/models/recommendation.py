from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    alert_id: Mapped[int | None] = mapped_column(ForeignKey("alerts.id"), nullable=True, index=True)
    machine_usage_id: Mapped[int | None] = mapped_column(ForeignKey("machine_usage_records.id"), nullable=True)
    recommendation_title: Mapped[str] = mapped_column(String(255), nullable=False)
    recommendation_description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="operation")
    priority: Mapped[str] = mapped_column(String(50), default="medium")
    estimated_impact: Mapped[str] = mapped_column(String(50), default="medium")
    related_machine_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    estimated_saving_kwh: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0"))
    estimated_saving_idr: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0"))
    estimated_co2_reduction_kg: Mapped[Decimal] = mapped_column(Numeric(15, 4), default=Decimal("0"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    completion_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_context_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    alert = relationship("Alert", back_populates="recommendations")
    machine_usage = relationship("MachineUsageRecord")
