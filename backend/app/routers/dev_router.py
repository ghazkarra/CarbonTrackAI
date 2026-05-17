from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_superadmin
from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.services.demo_reset_service import reset_demo_data


router = APIRouter(prefix="/api/dev", tags=["dev"])


@router.post("/reset-demo-data")
def reset_demo(_: User = Depends(require_superadmin), db: Session = Depends(get_db)) -> dict:
    if get_settings().app_env != "development":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo reset is only available in development")
    return {"status": "ok", "deleted": reset_demo_data(db)}
