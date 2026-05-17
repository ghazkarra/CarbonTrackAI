from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class CompanyOptionResponse(BaseModel):
    id: int
    company_name: str

    model_config = {"from_attributes": True}


class SuperadminUserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    company_id: int | None
    company_name: str | None
    is_active: bool
    created_at: datetime


class SuperadminUserCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    role: str = Field(default="operator", pattern="^(operator|superadmin)$")
    company_id: int | None = None
    password: str = Field(min_length=6, max_length=128)
    is_active: bool = True


class SuperadminUserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    role: str | None = Field(default=None, pattern="^(operator|superadmin)$")
    company_id: int | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)
    is_active: bool | None = None
