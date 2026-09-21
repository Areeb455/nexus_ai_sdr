"""
SSE (Server-Sent Events) streaming pipeline endpoint.
Emits JSON events as each agent step completes so the frontend
can render results progressively without waiting for the full pipeline.
"""
import asyncio
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.models import User, Lead, ResearchResult, QualificationResult, EmailOutput, ActivityLog, LeadStatus
from app.agents.state import AgentWorkflowState
from app.agents.research_agent import research_agent
from app.agents.qualification_agent import qualification_agent
from app.agents.email_agent import email_agent
from app.api.auth import get_current_user

router = APIRouter(prefix="/leads", tags=["Streaming Pipeline"])
logger = logging.getLogger(__name__)


def _sse_event(event_type: str, data: dict) -> str:
    """Format a single SSE message."""
    payload = json.dumps({"event": event_type, "data": data})
    return f"data: {payload}\n\n"


@router.post("/{lead_id}/pipeline-stream")
async def stream_pipeline(
    lead_id: int,
    current_user: User = Depends(get_current_user),
):
    """
    SSE streaming pipeline: emits events as each agent finishes.
    Events: started → research_done → [qual_done + email_done in parallel] → complete
    """
    async def event_generator():
        gen_db = SessionLocal()
        try:
            lead = gen_db.query(Lead).filter(Lead.id == lead_id).first()
            if not lead:
                yield _sse_event("error", {"message": "Lead not found"})
                return

            yield _sse_event("started", {"message": "Pipeline initiated", "lead_id": lead_id})

            # ── Step 1: Research ──────────────────────────────────────────────────
            state = AgentWorkflowState(
                lead_id=lead.id,
                company_name=lead.company_name,
                contact_name=lead.contact_name,
                contact_email=lead.contact_email,
                role=lead.role,
                website=lead.website,
                industry=lead.industry,
                company_size=lead.company_size,
                location=lead.location,
                notes=lead.notes,
            )

            research_out = await research_agent.run(state)
            state.research = research_out

            # Persist research
            db_research = ResearchResult(
                lead_id=lead.id,
                summary=research_out.summary,
                company_overview=research_out.company_overview,
                target_pain_points=research_out.target_pain_points,
                key_decision_makers=research_out.key_decision_makers,
                technology_stack=research_out.technology_stack,
                growth_signals=research_out.growth_signals,
                sources=research_out.sources,
                confidence_score=research_out.confidence_score,
                raw_data=research_out.model_dump(),
            )
            gen_db.add(db_research)
            if lead.status == LeadStatus.NEW.value:
                lead.status = LeadStatus.RESEARCHED.value
            gen_db.commit()

            # Emit research immediately
            yield _sse_event("research_done", {
                "summary": research_out.summary,
                "company_overview": research_out.company_overview,
                "target_pain_points": research_out.target_pain_points,
                "key_decision_makers": research_out.key_decision_makers,
                "technology_stack": research_out.technology_stack,
                "growth_signals": research_out.growth_signals,
                "sources": research_out.sources,
                "confidence_score": research_out.confidence_score,
            })

            # ── Step 2 & 3: Qualification + Email in PARALLEL ────────────────────
            qual_state = AgentWorkflowState(
                lead_id=lead.id, company_name=lead.company_name, contact_name=lead.contact_name,
                contact_email=lead.contact_email, role=lead.role, website=lead.website,
                industry=lead.industry, company_size=lead.company_size, location=lead.location, notes=lead.notes,
            )
            qual_state.research = research_out

            email_state = AgentWorkflowState(
                lead_id=lead.id, company_name=lead.company_name, contact_name=lead.contact_name,
                contact_email=lead.contact_email, role=lead.role, website=lead.website,
                industry=lead.industry, company_size=lead.company_size, location=lead.location, notes=lead.notes,
            )
            email_state.research = research_out

            qual_out, email_out = await asyncio.gather(
                qualification_agent.run(qual_state),
                email_agent.run(email_state),
            )

            # Persist qualification
            db_qual = QualificationResult(
                lead_id=lead.id,
                score=qual_out.score,
                fit_category=qual_out.fit_category,
                reasoning=qual_out.reasoning,
                positive_signals=qual_out.positive_signals,
                negative_signals=qual_out.negative_signals,
                icp_fit_breakdown=qual_out.icp_fit_breakdown,
            )
            gen_db.add(db_qual)

            # Persist email
            db_email = EmailOutput(
                lead_id=lead.id,
                subject=email_out.subject,
                body=email_out.body,
                follow_up_subject=email_out.follow_up_subject,
                follow_up_body=email_out.follow_up_body,
                personalization_rationale=email_out.personalization_rationale,
                tone=email_out.tone,
            )
            gen_db.add(db_email)

            # Update lead status
            if qual_out.score >= 50:
                lead.status = LeadStatus.QUALIFIED.value
            else:
                lead.status = LeadStatus.DISQUALIFIED.value

            # Audit log
            gen_db.add(ActivityLog(
                lead_id=lead.id,
                user_id=current_user.id,
                action="FULL_PIPELINE_EXECUTED",
                agent_name="MULTI_AGENT_ORCHESTRATOR",
                details={
                    "steps_completed": ["RESEARCH", "QUALIFICATION (parallel)", "EMAIL (parallel)"],
                    "qualification_score": qual_out.score,
                    "fit_category": qual_out.fit_category,
                    "email_subject": email_out.subject,
                },
            ))
            gen_db.commit()

            # Emit qual + email together
            yield _sse_event("qual_done", {
                "score": qual_out.score,
                "fit_category": qual_out.fit_category,
                "reasoning": qual_out.reasoning,
                "positive_signals": qual_out.positive_signals,
                "negative_signals": qual_out.negative_signals,
                "icp_fit_breakdown": qual_out.icp_fit_breakdown,
                "recommendation": qual_out.recommendation,
            })
            yield _sse_event("email_done", {
                "subject": email_out.subject,
                "body": email_out.body,
                "follow_up_subject": email_out.follow_up_subject,
                "follow_up_body": email_out.follow_up_body,
                "personalization_rationale": email_out.personalization_rationale,
                "tone": email_out.tone,
            })
            yield _sse_event("complete", {
                "status": lead.status,
                "message": "Pipeline complete",
            })

        except Exception as e:
            logger.error(f"[StreamPipeline] Error: {e}")
            yield _sse_event("error", {"message": str(e)})
        finally:
            gen_db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disables Nginx buffering on Render
        },
    )
