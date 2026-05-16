# app/routes/test_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import (
    Company, User, IndustrialActivity, EmissionFactor,
    AIRecommendation, ReviewLog, GeneratedReport
)

router = APIRouter(prefix="/test", tags=["Testing"])


@router.get("/")
def get_all_models(db: Session = Depends(get_db)):
    """
    Get all data from all models for testing purposes
    """
    # Get all records from each table
    companies = db.query(Company).all()
    users = db.query(User).all()
    activities = db.query(IndustrialActivity).all()
    emission_factors = db.query(EmissionFactor).all()
    recommendations = db.query(AIRecommendation).all()
    review_logs = db.query(ReviewLog).all()
    reports = db.query(GeneratedReport).all()

    # Convert to dictionaries for JSON serialization
    return {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "companies_count": len(companies),
            "users_count": len(users),
            "industrial_activities_count": len(activities),
            "emission_factors_count": len(emission_factors),
            "ai_recommendations_count": len(recommendations),
            "review_logs_count": len(review_logs),
            "generated_reports_count": len(reports),
            "total_records": len(companies) + len(users) + len(activities) +
            len(emission_factors) + len(recommendations) +
            len(review_logs) + len(reports)
        },
        "data": {
            "companies": [
                {
                    "id": c.id,
                    "name": c.name,
                    "industry_type": c.industry_type,
                    "location": c.location,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in companies
            ],
            "users": [
                {
                    "id": u.id,
                    "company_id": u.company_id,
                    "name": u.name,
                    "email": u.email,
                    "role": u.role.value if hasattr(u.role, 'value') else u.role,
                    "is_active": u.is_active,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                }
                for u in users
            ],
            "industrial_activities": [
                {
                    "id": a.id,
                    "company_id": a.company_id,
                    "created_by": a.created_by,
                    "activity_name": a.activity_name,
                    "description": a.description,
                    "category": a.category,
                    "amount": float(a.amount) if a.amount else None,
                    "unit": a.unit,
                    "activity_date": a.activity_date.isoformat() if a.activity_date else None,
                    "location": a.location,
                    "calculated_emission": float(a.calculated_emission) if a.calculated_emission else None,
                    "status": a.status,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in activities
            ],
            "emission_factors": [
                {
                    "id": e.id,
                    "name": e.name,
                    "description": e.description,
                    "category": e.category,
                    "factor_value": float(e.factor_value) if e.factor_value else None,
                    "factor_unit": e.factor_unit,
                    "source": e.source,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in emission_factors
            ],
            "ai_recommendations": [
                {
                    "id": r.id,
                    "activity_id": r.activity_id,
                    "emission_factor_id": r.emission_factor_id,
                    "plain_description": r.plain_description,
                    "similarity_score": float(r.similarity_score) if r.similarity_score else None,
                    "confidence_score": float(r.confidence_score) if r.confidence_score else None,
                    "justification": r.justification,
                    "match_status": r.match_status,
                    "calculated_emission": float(r.calculated_emission) if r.calculated_emission else None,
                    "created_at": r.created_at.isoformat() if r.created_at else None
                }
                for r in recommendations
            ],
            "review_logs": [
                {
                    "id": log.id,
                    "activity_id": log.activity_id,
                    "user_id": log.user_id,
                    "action": log.action,
                    "selected_emission_factor_id": log.selected_emission_factor_id,
                    "note": log.note,
                    "created_at": log.created_at.isoformat() if log.created_at else None
                }
                for log in review_logs
            ],
            "generated_reports": [
                {
                    "id": rep.id,
                    "company_id": rep.company_id,
                    "report_type": rep.report_type.value if hasattr(rep.report_type, 'value') else rep.report_type,
                    "period_start": rep.period_start.isoformat() if rep.period_start else None,
                    "period_end": rep.period_end.isoformat() if rep.period_end else None,
                    "period_label": rep.period_label,
                    "total_emission": float(rep.total_emission) if rep.total_emission else None,
                    "include_completed_recommendations": rep.include_completed_recommendations,
                    "pdf_file_path": rep.pdf_file_path,
                    "created_at": rep.created_at.isoformat() if rep.created_at else None
                }
                for rep in reports
            ]
        }
    }
