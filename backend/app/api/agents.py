from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Lead
from app.api.auth import get_current_user
from app.agents.orchestrator import orchestrator
from app.schemas.lead import ResearchResultResponse, QualificationResultResponse, EmailOutputResponse
from app.schemas.agent_schemas import AgentPipelineResponse

router = APIRouter(prefix="/leads", tags=["Agents Execution"])

@router.post("/{lead_id}/research", response_model=ResearchResultResponse)
async def run_research(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    
    res = await orchestrator.run_research_step(lead, db, user_id=current_user.id)
    return ResearchResultResponse(
        id=res.id,
        lead_id=res.lead_id,
        summary=res.summary or "",
        company_overview=res.company_overview or "",
        target_pain_points=res.target_pain_points or [],
        key_decision_makers=res.key_decision_makers or [],
        technology_stack=res.technology_stack or [],
        growth_signals=res.growth_signals or [],
        sources=res.sources or [],
        confidence_score=res.confidence_score or 0.85,
        created_at=res.created_at
    )

@router.post("/{lead_id}/qualify", response_model=QualificationResultResponse)
async def run_qualify(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    
    qual = await orchestrator.run_qualification_step(lead, db, user_id=current_user.id)
    return QualificationResultResponse(
        id=qual.id,
        lead_id=qual.lead_id,
        score=qual.score,
        fit_category=qual.fit_category,
        reasoning=qual.reasoning,
        positive_signals=qual.positive_signals or [],
        negative_signals=qual.negative_signals or [],
        icp_fit_breakdown=qual.icp_fit_breakdown or {},
        created_at=qual.created_at
    )

@router.post("/{lead_id}/email", response_model=EmailOutputResponse)
async def run_email(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    
    email_out = await orchestrator.run_email_step(lead, db, user_id=current_user.id)
    return EmailOutputResponse(
        id=email_out.id,
        lead_id=email_out.lead_id,
        subject=email_out.subject,
        body=email_out.body,
        follow_up_subject=email_out.follow_up_subject,
        follow_up_body=email_out.follow_up_body,
        personalization_rationale=email_out.personalization_rationale,
        tone=email_out.tone or "professional_concise",
        created_at=email_out.created_at
    )

@router.post("/{lead_id}/pipeline", response_model=AgentPipelineResponse)
async def run_pipeline(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
    
    result = await orchestrator.run_full_pipeline(lead, db, user_id=current_user.id)
    return result
