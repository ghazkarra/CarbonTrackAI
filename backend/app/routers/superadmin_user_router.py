from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_superadmin
from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.superadmin_user_schema import (
    CompanyOptionResponse,
    SuperadminUserCreateRequest,
    SuperadminUserResponse,
    SuperadminUserUpdateRequest,
)
from app.services.superadmin_user_service import create_user, deactivate_user, get_user, list_users, update_user


router = APIRouter(prefix="/api/superadmin", tags=["superadmin users"])


@router.get("/companies", response_model=list[CompanyOptionResponse])
def list_companies(_: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> list[Company]:
    return db.query(Company).order_by(Company.company_name.asc()).all()


@router.get("/users", response_model=list[SuperadminUserResponse])
def users(_: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> list[SuperadminUserResponse]:
    return list_users(db)


@router.post("/users", response_model=SuperadminUserResponse, status_code=status.HTTP_201_CREATED)
def create(payload: SuperadminUserCreateRequest, _: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> SuperadminUserResponse:
    return create_user(db, payload)


@router.get("/users/{user_id}", response_model=SuperadminUserResponse)
def detail(user_id: int, _: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> SuperadminUserResponse:
    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pengguna tidak ditemukan")
    return user


@router.patch("/users/{user_id}", response_model=SuperadminUserResponse)
def update(user_id: int, payload: SuperadminUserUpdateRequest, _: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> SuperadminUserResponse:
    user = update_user(db, user_id, payload)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pengguna tidak ditemukan")
    return user


@router.delete("/users/{user_id}", response_model=SuperadminUserResponse)
def delete(user_id: int, _: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> SuperadminUserResponse:
    user = deactivate_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pengguna tidak ditemukan")
    return user
