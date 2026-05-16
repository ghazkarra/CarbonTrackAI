from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import get_settings
from app.models.company import Company
from app.models.system_config import SystemConfig
from app.models.user import User


def normalize_user_role(role: str | None) -> str:
    normalized = (role or "").strip().lower()

    if normalized == "superadmin" or normalized == "admin":
        return "superadmin"

    return "operator"


def normalize_existing_user_roles(db: Session) -> None:
    users = db.query(User).all()

    for user in users:
        next_role = normalize_user_role(user.role)
        if user.role != next_role:
            user.role = next_role


def seed_database(db: Session) -> None:
    settings = get_settings()
    company = db.query(Company).filter(Company.company_name == "PT HERBATECH INNOPHARMA INDUSTRY").first()
    if company is None:
        company = Company(company_name="PT HERBATECH INNOPHARMA INDUSTRY", industry="Manufacturing", address="Indonesia")
        db.add(company)
        db.flush()

    operator = db.query(User).filter(User.email == "operator@carboncore.ai").first()
    if operator is None:
        db.add(User(company_id=company.id, name="Demo Operator", email="operator@carboncore.ai", password_hash=hash_password("password"), role="operator"))

    superadmin = db.query(User).filter(User.email == "admin@carboncore.ai").first()
    if superadmin is None:
        db.add(User(name="CarbonCore Admin", email="admin@carboncore.ai", password_hash=hash_password("password"), role="superadmin"))

    normalize_existing_user_roles(db)

    ef_config = db.query(SystemConfig).filter(SystemConfig.config_key == "DEFAULT_ELECTRICITY_EF_KGCO2E_PER_KWH").first()
    if ef_config is None:
        db.add(SystemConfig(config_key="DEFAULT_ELECTRICITY_EF_KGCO2E_PER_KWH", config_value=str(settings.default_electricity_ef_kgco2e_per_kwh), description="Default electricity emission factor for MVP calculations."))
    db.commit()
