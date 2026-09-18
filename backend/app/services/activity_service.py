from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import ActivityLog

def log_activity(
    db: Session,
    action: str,
    lead_id: Optional[int] = None,
    user_id: Optional[int] = None,
    agent_name: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> ActivityLog:
    activity = ActivityLog(
        lead_id=lead_id,
        user_id=user_id,
        action=action,
        agent_name=agent_name,
        details=details
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity

def get_activities_for_lead(db: Session, lead_id: int, limit: int = 50) -> List[ActivityLog]:
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.lead_id == lead_id)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )

def get_recent_activities(db: Session, limit: int = 50) -> List[ActivityLog]:
    return (
        db.query(ActivityLog)
        .order_by(ActivityLog.timestamp.desc())
        .limit(limit)
        .all()
    )
