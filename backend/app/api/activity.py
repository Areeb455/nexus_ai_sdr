from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Lead, ActivityLog
from app.api.auth import get_current_user
from app.schemas.activity import ActivityResponse
from app.services import activity_service

router = APIRouter(tags=["Activity & Audit Trail"])

@router.get("/leads/{lead_id}/activity", response_model=List[ActivityResponse])
def get_lead_activity(
    lead_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return activity_service.get_activities_for_lead(db, lead_id, limit=limit)

@router.get("/activities", response_model=List[ActivityResponse])
def get_recent_activities(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return activity_service.get_recent_activities(db, limit=limit)
