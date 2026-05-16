# models.py
from sqlalchemy import Column, Integer, String, Float, DECIMAL, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    industry_type = Column(String(100))
    location = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)

    industrial_activities = relationship(
        "IndustrialActivity", back_populates="company", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    role = Column(String(50), default="admin")
    created_at = Column(DateTime, default=datetime.now)

    review_logs = relationship("ReviewLog", back_populates="user")


class IndustrialActivity(Base):
    __tablename__ = "industrial_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_id = Column(Integer, ForeignKey(
        "companies.id", ondelete="CASCADE"))
    activity_name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    amount = Column(DECIMAL(15, 4), nullable=False)
    unit = Column(String(50), nullable=False)
    activity_date = Column(DateTime)
    location = Column(String(255))
    calculated_emission = Column(DECIMAL(15, 4), default=0)
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.now)

    company = relationship("Company", back_populates="industrial_activities")
    ai_recommendations = relationship(
        "AIRecommendation", back_populates="activity", cascade="all, delete-orphan")
    review_logs = relationship(
        "ReviewLog", back_populates="activity", cascade="all, delete-orphan")


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
    created_at = Column(DateTime, default=datetime.now)

    ai_recommendations = relationship(
        "AIRecommendation", back_populates="emission_factor")
    review_logs = relationship(
        "ReviewLog", back_populates="selected_emission_factor")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_id = Column(Integer, ForeignKey(
        "industrial_activities.id", ondelete="CASCADE"), nullable=False)
    emission_factor_id = Column(Integer, ForeignKey("emission_factors.id"))
    plain_description = Column(Text)
    similarity_score = Column(DECIMAL(10, 6))
    confidence_score = Column(DECIMAL(10, 6))
    justification = Column(Text)
    match_status = Column(String(50))
    calculated_emission = Column(DECIMAL(15, 4))
    created_at = Column(DateTime, default=datetime.now)

    activity = relationship("IndustrialActivity",
                            back_populates="ai_recommendations")
    emission_factor = relationship(
        "EmissionFactor", back_populates="ai_recommendations")


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_id = Column(Integer, ForeignKey(
        "industrial_activities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    selected_emission_factor_id = Column(
        Integer, ForeignKey("emission_factors.id"))
    note = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    activity = relationship("IndustrialActivity", back_populates="review_logs")
    user = relationship("User", back_populates="review_logs")
    selected_emission_factor = relationship(
        "EmissionFactor", back_populates="review_logs")
