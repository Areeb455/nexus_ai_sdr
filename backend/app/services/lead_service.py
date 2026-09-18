from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from app.db.models import Lead, ResearchResult, QualificationResult, EmailOutput, ActivityLog, LeadStatus
from app.schemas.lead import LeadCreate, LeadUpdate, DashboardMetrics

def create_lead(db: Session, lead_in: LeadCreate, user_id: Optional[int] = None) -> Lead:
    lead = Lead(
        user_id=user_id,
        company_name=lead_in.company_name,
        contact_name=lead_in.contact_name,
        contact_email=lead_in.contact_email,
        role=lead_in.role,
        website=lead_in.website,
        industry=lead_in.industry,
        company_size=lead_in.company_size,
        location=lead_in.location,
        notes=lead_in.notes,
        status=LeadStatus.NEW.value
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Log creation activity
    activity = ActivityLog(
        lead_id=lead.id,
        user_id=user_id,
        action="LEAD_CREATED",
        agent_name="HUMAN",
        details={"company": lead.company_name, "contact": lead.contact_name, "role": lead.role}
    )
    db.add(activity)
    db.commit()
    return lead

def get_lead_by_id(db: Session, lead_id: int) -> Optional[Lead]:
    return db.query(Lead).filter(Lead.id == lead_id).first()

def update_lead(db: Session, lead: Lead, lead_in: LeadUpdate, user_id: Optional[int] = None) -> Lead:
    update_data = lead_in.model_dump(exclude_unset=True)
    old_status = lead.status
    
    for field, val in update_data.items():
        setattr(lead, field, val)

    if "status" in update_data and update_data["status"] != old_status:
        activity = ActivityLog(
            lead_id=lead.id,
            user_id=user_id,
            action="STATUS_CHANGED",
            agent_name="HUMAN",
            details={"previous_status": old_status, "new_status": lead.status}
        )
        db.add(activity)

    db.commit()
    db.refresh(lead)
    return lead

def delete_lead(db: Session, lead: Lead):
    db.delete(lead)
    db.commit()

def list_leads(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    fit_category: Optional[str] = None,
    industry: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Dict[str, Any]], int]:
    query = db.query(Lead)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Lead.company_name.ilike(search_fmt),
                Lead.contact_name.ilike(search_fmt),
                Lead.role.ilike(search_fmt),
                Lead.industry.ilike(search_fmt),
            )
        )

    if status and status != "ALL":
        query = query.filter(Lead.status == status)

    if industry and industry != "ALL":
        query = query.filter(Lead.industry == industry)

    total = query.count()
    leads = query.order_by(desc(Lead.created_at)).offset(skip).limit(limit).all()

    items = []
    for l in leads:
        # Get latest score and fit category
        qual = l.qualification_results[0] if l.qualification_results else None
        
        # Filter by fit_category if specified
        if fit_category and fit_category != "ALL":
            if not qual or qual.fit_category != fit_category:
                continue

        last_act = l.activities[0].action if l.activities else "CREATED"

        items.append({
            "id": l.id,
            "company_name": l.company_name,
            "contact_name": l.contact_name,
            "contact_email": l.contact_email,
            "role": l.role,
            "website": l.website,
            "industry": l.industry,
            "company_size": l.company_size,
            "location": l.location,
            "notes": l.notes,
            "status": l.status,
            "created_at": l.created_at,
            "qualification_score": qual.score if qual else None,
            "fit_category": qual.fit_category if qual else None,
            "last_activity": last_act
        })

    return items, total

def get_dashboard_metrics(db: Session) -> DashboardMetrics:
    total = db.query(Lead).count()
    researched = db.query(Lead).filter(Lead.status != LeadStatus.NEW.value).count()
    qualified = db.query(Lead).filter(Lead.status == LeadStatus.QUALIFIED.value).count()
    disqualified = db.query(Lead).filter(Lead.status == LeadStatus.DISQUALIFIED.value).count()
    contacted = db.query(Lead).filter(
        Lead.status.in_([LeadStatus.CONTACTED.value, LeadStatus.FOLLOW_UP.value, LeadStatus.MEETING_BOOKED.value, LeadStatus.CONVERTED.value])
    ).count()

    high_fit = db.query(QualificationResult).filter(QualificationResult.fit_category == "HIGH_FIT").count()
    med_fit = db.query(QualificationResult).filter(QualificationResult.fit_category == "MEDIUM_FIT").count()
    low_fit = db.query(QualificationResult).filter(QualificationResult.fit_category == "LOW_FIT").count()

    conversion_rate = (contacted / total * 100.0) if total > 0 else 0.0

    return DashboardMetrics(
        total_leads=total,
        researched_leads=researched,
        qualified_leads=qualified,
        disqualified_leads=disqualified,
        contacted_leads=contacted,
        high_fit_leads=high_fit,
        medium_fit_leads=med_fit,
        low_fit_leads=low_fit,
        conversion_rate_percentage=round(conversion_rate, 1)
    )
