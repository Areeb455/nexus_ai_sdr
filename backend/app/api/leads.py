from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Lead, ResearchResult, QualificationResult, EmailOutput
from app.api.auth import get_current_user
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse, LeadListResponse,
    DashboardMetrics, ResearchResultResponse, QualificationResultResponse, EmailOutputResponse
)
from app.services import lead_service

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return lead_service.get_dashboard_metrics(db)

@router.get("", response_model=LeadListResponse)
def list_leads(
    search: Optional[str] = None,
    status: Optional[str] = None,
    fit_category: Optional[str] = None,
    industry: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items, total = lead_service.list_leads(
        db=db,
        search=search,
        status=status,
        fit_category=fit_category,
        industry=industry,
        skip=skip,
        limit=limit
    )
    return LeadListResponse(total=total, items=items)

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = lead_service.create_lead(db, lead_in, user_id=current_user.id)
    return _build_lead_response(lead)

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    return _build_lead_response(lead)

@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    updated = lead_service.update_lead(db, lead, lead_in, user_id=current_user.id)
    return _build_lead_response(updated)

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = lead_service.get_lead_by_id(db, lead_id)
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    lead_service.delete_lead(db, lead)
    return None

def _build_lead_response(lead: Lead) -> LeadResponse:
    latest_research = None
    if lead.research_results:
        r = lead.research_results[0]
        latest_research = ResearchResultResponse(
            id=r.id,
            lead_id=r.lead_id,
            summary=r.summary or "",
            company_overview=r.company_overview or "",
            target_pain_points=r.target_pain_points or [],
            key_decision_makers=r.key_decision_makers or [],
            technology_stack=r.technology_stack or [],
            growth_signals=r.growth_signals or [],
            sources=r.sources or [],
            confidence_score=r.confidence_score or 0.85,
            created_at=r.created_at
        )

    latest_qualification = None
    if lead.qualification_results:
        q = lead.qualification_results[0]
        latest_qualification = QualificationResultResponse(
            id=q.id,
            lead_id=q.lead_id,
            score=q.score,
            fit_category=q.fit_category,
            reasoning=q.reasoning,
            positive_signals=q.positive_signals or [],
            negative_signals=q.negative_signals or [],
            icp_fit_breakdown=q.icp_fit_breakdown or {},
            created_at=q.created_at
        )

    latest_email = None
    if lead.email_outputs:
        e = lead.email_outputs[0]
        latest_email = EmailOutputResponse(
            id=e.id,
            lead_id=e.lead_id,
            subject=e.subject,
            body=e.body,
            follow_up_subject=e.follow_up_subject,
            follow_up_body=e.follow_up_body,
            personalization_rationale=e.personalization_rationale,
            tone=e.tone or "professional_concise",
            created_at=e.created_at
        )

    return LeadResponse(
        id=lead.id,
        user_id=lead.user_id,
        company_name=lead.company_name,
        contact_name=lead.contact_name,
        contact_email=lead.contact_email,
        role=lead.role,
        website=lead.website,
        industry=lead.industry,
        company_size=lead.company_size,
        location=lead.location,
        notes=lead.notes,
        status=lead.status,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
        latest_research=latest_research,
        latest_qualification=latest_qualification,
        latest_email=latest_email
    )
