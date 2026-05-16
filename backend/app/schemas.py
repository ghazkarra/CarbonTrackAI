# schemas.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from decimal import Decimal

# Company Schemas


class CompanyBase(BaseModel):
    name: str
    industry_type: Optional[str] = None
    location: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# User Schemas


class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "admin"


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Industrial Activity Schemas


class IndustrialActivityBase(BaseModel):
    company_id: int
    activity_name: str
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Decimal = Field(max_digits=15, decimal_places=4)
    unit: str
    activity_date: Optional[datetime] = None
    location: Optional[str] = None
    calculated_emission: Optional[Decimal] = Field(
        default=0, max_digits=15, decimal_places=4)
    status: Optional[str] = "pending"


class IndustrialActivityCreate(IndustrialActivityBase):
    pass


class IndustrialActivityUpdate(BaseModel):
    activity_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = Field(None, max_digits=15, decimal_places=4)
    unit: Optional[str] = None
    activity_date: Optional[datetime] = None
    location: Optional[str] = None
    calculated_emission: Optional[Decimal] = Field(
        None, max_digits=15, decimal_places=4)
    status: Optional[str] = None


class IndustrialActivityResponse(IndustrialActivityBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Emission Factor Schemas


class EmissionFactorBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    factor_value: Decimal = Field(max_digits=15, decimal_places=6)
    factor_unit: str
    source: Optional[str] = None
    embedding_json: Optional[str] = None


class EmissionFactorCreate(EmissionFactorBase):
    pass


class EmissionFactorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    factor_value: Optional[Decimal] = Field(
        None, max_digits=15, decimal_places=6)
    factor_unit: Optional[str] = None
    source: Optional[str] = None
    embedding_json: Optional[str] = None


class EmissionFactorResponse(EmissionFactorBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# AI Recommendation Schemas


class AIRecommendationBase(BaseModel):
    activity_id: int
    emission_factor_id: Optional[int] = None
    plain_description: Optional[str] = None
    similarity_score: Optional[Decimal] = Field(
        None, max_digits=10, decimal_places=6)
    confidence_score: Optional[Decimal] = Field(
        None, max_digits=10, decimal_places=6)
    justification: Optional[str] = None
    match_status: Optional[str] = None
    calculated_emission: Optional[Decimal] = Field(
        None, max_digits=15, decimal_places=4)


class AIRecommendationCreate(AIRecommendationBase):
    pass


class AIRecommendationResponse(AIRecommendationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Review Log Schemas


class ReviewLogBase(BaseModel):
    activity_id: int
    user_id: Optional[int] = None
    action: str
    selected_emission_factor_id: Optional[int] = None
    note: Optional[str] = None


class ReviewLogCreate(ReviewLogBase):
    pass


class ReviewLogResponse(ReviewLogBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
