from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.company import Company
from app.models.user import User
from app.schemas.superadmin_user_schema import SuperadminUserCreateRequest, SuperadminUserResponse, SuperadminUserUpdateRequest


def to_user_response(user: User) -> SuperadminUserResponse:
    return SuperadminUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        company_id=user.company_id,
        company_name=user.company.company_name if user.company else None,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def list_users(db: Session) -> list[SuperadminUserResponse]:
    users = db.query(User).order_by(User.is_active.desc(), User.created_at.desc()).all()
    return [to_user_response(user) for user in users]


def get_user(db: Session, user_id: int) -> SuperadminUserResponse | None:
    user = db.get(User, user_id)
    return to_user_response(user) if user else None


def _ensure_unique_email(db: Session, email: str, user_id: int | None = None) -> None:
    query = db.query(User).filter(User.email == email)
    if user_id is not None:
        query = query.filter(User.id != user_id)
    if query.first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already used")


def _ensure_company_exists(db: Session, company_id: int | None) -> None:
    if company_id is not None and db.get(Company, company_id) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company not found")


def create_user(db: Session, payload: SuperadminUserCreateRequest) -> SuperadminUserResponse:
    email = str(payload.email).lower()
    _ensure_unique_email(db, email)
    _ensure_company_exists(db, payload.company_id)

    user = User(
        name=payload.name.strip(),
        email=email,
        role=payload.role,
        company_id=payload.company_id,
        password_hash=hash_password(payload.password),
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return to_user_response(user)


def update_user(db: Session, user_id: int, payload: SuperadminUserUpdateRequest) -> SuperadminUserResponse | None:
    user = db.get(User, user_id)
    if user is None:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] is not None:
        next_email = str(update_data["email"]).lower()
        _ensure_unique_email(db, next_email, user_id)
        user.email = next_email
    if "company_id" in update_data:
        _ensure_company_exists(db, update_data["company_id"])
        user.company_id = update_data["company_id"]
    if "name" in update_data and update_data["name"] is not None:
        user.name = update_data["name"].strip()
    if "role" in update_data and update_data["role"] is not None:
        user.role = update_data["role"]
    if "is_active" in update_data and update_data["is_active"] is not None:
        user.is_active = update_data["is_active"]
    if "password" in update_data and update_data["password"]:
        user.password_hash = hash_password(update_data["password"])

    db.commit()
    db.refresh(user)
    return to_user_response(user)


def deactivate_user(db: Session, user_id: int) -> SuperadminUserResponse | None:
    user = db.get(User, user_id)
    if user is None:
        return None
    user.is_active = False
    db.commit()
    db.refresh(user)
    return to_user_response(user)
