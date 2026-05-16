from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    config_key: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    config_value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
