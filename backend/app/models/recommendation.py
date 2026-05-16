from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    machine_usage_id: Mapped[int | None] = mapped_column(ForeignKey("machine_usage_records.id"), nullable=True)
    recommendation_title: Mapped[str] = mapped_column(String(255), nullable=False)
    recommendation_description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), default="operation")
    priority: Mapped[str] = mapped_column(String(50), default="medium")
    estimated_impact: Mapped[str] = mapped_column(String(50), default="medium")
    related_machine_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    completion_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_context_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
