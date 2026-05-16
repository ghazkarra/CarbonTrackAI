from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth_schema import LoginRequest, LoginResponse, UserProfile


router = APIRouter(prefix="/api/auth", tags=["auth"])


def to_profile(user: User) -> UserProfile:
    return UserProfile(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        company_id=user.company_id,
        company_name=user.company.company_name if user.company else None,
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return LoginResponse(access_token=create_access_token(str(user.id)), user=to_profile(user))


@router.get("/me", response_model=UserProfile)
def me(current_user: User = Depends(get_current_user)) -> UserProfile:
    return to_profile(current_user)
