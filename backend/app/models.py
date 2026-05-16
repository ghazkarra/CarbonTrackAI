# models.py
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, Integer, String, DECIMAL, DateTime,
    Text, ForeignKey, Date, Boolean, Enum as SQLEnum
)
# Fixed: moved from ext.declarative
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


# ──────────────────────────────────────────
# Enums
# ──────────────────────────────────────────

class UserRole(PyEnum):
    ADMIN = "admin"
    USER = "user"
    EMPLOYEE = "employee"


class ReportType(PyEnum):
    """Enum for report period types"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

    @classmethod
    def get_display_names(cls):
        """Get display names for UI dropdowns"""
        return {
            cls.DAILY: "Daily Report",
            cls.WEEKLY: "Weekly Report",
            cls.MONTHLY: "Monthly Report",
            cls.YEARLY: "Yearly Report",
        }

    @classmethod
    def get_date_ranges(cls, reference_date=None):
        """Get date ranges for each report type"""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta

        if reference_date is None:
            reference_date = datetime.now().date()

        ranges = {}

        # Daily
        ranges[cls.DAILY] = {
            "start": reference_date,
            "end": reference_date,
            "label": f"Daily Report - {reference_date.strftime('%Y-%m-%d')}",
        }

        # Weekly (Monday to Sunday)
        start_of_week = reference_date - \
            timedelta(days=reference_date.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        ranges[cls.WEEKLY] = {
            "start": start_of_week,
            "end": end_of_week,
            "label": f"Weekly Report - {start_of_week.strftime('%Y-%m-%d')} to {end_of_week.strftime('%Y-%m-%d')}",
        }

        # Monthly
        start_of_month = reference_date.replace(day=1)
        end_of_month = (start_of_month + relativedelta(months=1)
                        ) - timedelta(days=1)
        ranges[cls.MONTHLY] = {
            "start": start_of_month,
            "end": end_of_month,
            "label": f"Monthly Report - {start_of_month.strftime('%B %Y')}",
        }

        # Yearly
        start_of_year = reference_date.replace(month=1, day=1)
        end_of_year = reference_date.replace(month=12, day=31)
        ranges[cls.YEARLY] = {
            "start": start_of_year,
            "end": end_of_year,
            "label": f"Yearly Report - {reference_date.year}",
        }

        return ranges


# ──────────────────────────────────────────
# Models
# ──────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    industry_type = Column(String(100))
    location = Column(String(255))
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    users = relationship("User", back_populates="company")
    industrial_activities = relationship(
        "IndustrialActivity", back_populates="company", cascade="all, delete-orphan"
    )
    generated_reports = relationship(
        "GeneratedReport", back_populates="company", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name!r})>"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey("companies.id"),
                        nullable=True)  # Fixed: added FK
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    # Fixed: added password field
    password_hash = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(
            UserRole,
            values_callable=lambda enum_class: [e.value for e in enum_class],
            name="user_role",
            native_enum=False,
        ),
        default=UserRole.USER,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    # Fixed: added back_populates
    company = relationship("Company", back_populates="users")
    review_logs = relationship("ReviewLog", back_populates="user")
    industrial_activities = relationship(
        "IndustrialActivity", back_populates="created_by_user"
    )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email!r}, role={self.role})>"


class EmissionFactor(Base):
    __tablename__ = "emission_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    factor_value = Column(DECIMAL(15, 6), nullable=False)
    factor_unit = Column(String(100), nullable=False)
    source = Column(String(255))
    embedding_json = Column(Text)
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    ai_recommendations = relationship(
        "AIRecommendation", back_populates="emission_factor")
    review_logs = relationship(
        "ReviewLog", back_populates="selected_emission_factor")

    def __repr__(self):
        return f"<EmissionFactor(id={self.id}, name={self.name!r}, category={self.category!r})>"


class IndustrialActivity(Base):
    __tablename__ = "industrial_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey(
        "companies.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"),
                        nullable=True)  # Fixed: added audit field
    activity_name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    amount = Column(DECIMAL(15, 4), nullable=False)
    unit = Column(String(50), nullable=False)
    activity_date = Column(DateTime)
    location = Column(String(255))
    calculated_emission = Column(DECIMAL(15, 4), default=0)
    status = Column(String(50), default="pending")
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    company = relationship("Company", back_populates="industrial_activities")
    created_by_user = relationship(
        "User", back_populates="industrial_activities")  # Fixed: added
    ai_recommendations = relationship(
        "AIRecommendation", back_populates="activity", cascade="all, delete-orphan"
    )
    review_logs = relationship(
        "ReviewLog", back_populates="activity", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<IndustrialActivity(id={self.id}, name={self.activity_name!r}, status={self.status!r})>"


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_id = Column(
        Integer, ForeignKey("industrial_activities.id", ondelete="CASCADE"), nullable=False
    )
    emission_factor_id = Column(Integer, ForeignKey(
        "emission_factors.id"), nullable=True)
    plain_description = Column(Text)
    similarity_score = Column(DECIMAL(10, 6))
    confidence_score = Column(DECIMAL(10, 6))
    justification = Column(Text)
    match_status = Column(String(50))
    calculated_emission = Column(DECIMAL(15, 4))
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    activity = relationship("IndustrialActivity",
                            back_populates="ai_recommendations")
    emission_factor = relationship(
        "EmissionFactor", back_populates="ai_recommendations")

    def __repr__(self):
        return f"<AIRecommendation(id={self.id}, activity_id={self.activity_id}, status={self.match_status!r})>"


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_id = Column(
        Integer, ForeignKey("industrial_activities.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)
    selected_emission_factor_id = Column(
        Integer, ForeignKey("emission_factors.id"), nullable=True)
    note = Column(Text)
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    activity = relationship("IndustrialActivity", back_populates="review_logs")
    user = relationship("User", back_populates="review_logs")
    selected_emission_factor = relationship(
        "EmissionFactor", back_populates="review_logs"
    )

    def __repr__(self):
        return f"<ReviewLog(id={self.id}, activity_id={self.activity_id}, action={self.action!r})>"


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(
        Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    report_type = Column(
        SQLEnum(
            ReportType,
            values_callable=lambda enum_class: [e.value for e in enum_class],
            name="report_type",
            native_enum=False,
        ),
        nullable=False,
    )
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    period_label = Column(String(100))
    total_emission = Column(DECIMAL(15, 4))
    include_completed_recommendations = Column(Boolean, default=False)
    pdf_file_path = Column(String(500))
    created_at = Column(
        DateTime, default=lambda: datetime.now())  # Fixed: lambda

    # Relationships
    company = relationship("Company", back_populates="generated_reports")

    def __repr__(self):
        return (
            f"<GeneratedReport(id={self.id}, company_id={self.company_id}, "
            f"type={self.report_type.value!r}, period={self.period_label!r})>"
        )

    @property
    def report_type_display(self):
        """Get human-readable report type"""
        return ReportType.get_display_names().get(self.report_type, self.report_type.value)

    @property
    def period_days(self):
        """Calculate number of days in the period"""
        return (self.period_end - self.period_start).days + 1

    @property
    def average_daily_emission(self):
        """Calculate average daily emission for the period"""
        if self.period_days > 0 and self.total_emission:
            return self.total_emission / self.period_days
        return None
