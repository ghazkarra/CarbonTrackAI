from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_operator
from app.database import get_db
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.recommendation_schema import RecommendationCompleteRequest, RecommendationGenerateRequest, RecommendationResponse
from app.services.recommendation_service import complete_recommendation, dismiss_recommendation, generate_recommendations


router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=list[RecommendationResponse])
def generate(payload: RecommendationGenerateRequest, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[Recommendation]:
    return generate_recommendations(db, current_user, payload.report_month, payload.machine_usage_id)


@router.get("", response_model=list[RecommendationResponse])
def list_recommendations(status_filter: str | None = None, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> list[Recommendation]:
    query = db.query(Recommendation).filter(Recommendation.company_id == current_user.company_id)
    if status_filter:
        query = query.filter(Recommendation.status == status_filter)
    return query.order_by(Recommendation.created_at.desc()).all()


@router.patch("/{recommendation_id}/complete", response_model=RecommendationResponse)
def complete(recommendation_id: int, payload: RecommendationCompleteRequest, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Recommendation:
    recommendation = complete_recommendation(db, recommendation_id, current_user, payload.completion_note if payload.is_completed else None)
    if recommendation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    return recommendation


@router.patch("/{recommendation_id}/dismiss", response_model=RecommendationResponse)
def dismiss(recommendation_id: int, current_user: User = Depends(require_operator), db: Session = Depends(get_db)) -> Recommendation:
    recommendation = dismiss_recommendation(db, recommendation_id, current_user)
    if recommendation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recommendation not found")
    return recommendation
