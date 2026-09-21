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

            from app.agents.unified_pipeline import unified_pipeline
            synth = await unified_pipeline.run_unified_synthesis(
                company_query=lead.company_name,
                website_hint=lead.website,
                contact_name_hint=lead.contact_name,
                role_hint=lead.role,
                notes_hint=lead.notes,
            )

            res_data = synth.get("research", {})
            qual_data = synth.get("qualification", {})
            email_data = synth.get("email", {})
            lead_update = synth.get("lead", {})

            # Update contact info if unified pipeline identified a real named executive
            if lead_update.get("contact_name") and any(phr in (lead.contact_name or "") for phr in ["Not available", "None", "", "Key Decision Maker", "Executive Leader"]):
                lead.contact_name = lead_update["contact_name"]
            if lead_update.get("role") and (not lead.role or "Unknown" in lead.role):
                lead.role = lead_update["role"]
            if lead_update.get("contact_email") and (not lead.contact_email or "contact@" in (lead.contact_email or "")):
                lead.contact_email = lead_update["contact_email"]

            # Persist research
            db_research = ResearchResult(
                lead_id=lead.id,
                summary=res_data.get("summary", ""),
                company_overview=res_data.get("company_overview", ""),
                target_pain_points=res_data.get("target_pain_points", []),
                key_decision_makers=res_data.get("key_decision_makers", []),
                technology_stack=res_data.get("technology_stack", []),
                growth_signals=res_data.get("growth_signals", []),
                sources=res_data.get("sources", [lead.website]),
                confidence_score=float(res_data.get("confidence_score", 0.88)),
                raw_data=res_data,
            )
            gen_db.add(db_research)

            score = int(qual_data.get("score", 70))
            fit_category = qual_data.get("fit_category", "HIGH_FIT" if score >= 75 else "MEDIUM_FIT")
            lead.status = LeadStatus.QUALIFIED.value if score >= 50 else LeadStatus.DISQUALIFIED.value

            db_qual = QualificationResult(
                lead_id=lead.id,
                score=score,
                fit_category=fit_category,
                reasoning=qual_data.get("reasoning", ""),
                positive_signals=qual_data.get("positive_signals", []),
                negative_signals=qual_data.get("negative_signals", []),
                icp_fit_breakdown=qual_data.get("icp_fit_breakdown", {}),
            )
            gen_db.add(db_qual)

            db_email = EmailOutput(
                lead_id=lead.id,
                subject=email_data.get("subject", ""),
                body=email_data.get("body", ""),
                follow_up_subject=email_data.get("follow_up_subject", ""),
                follow_up_body=email_data.get("follow_up_body", ""),
                personalization_rationale=email_data.get("personalization_rationale", ""),
                tone=email_data.get("tone", "professional_concise"),
            )
            gen_db.add(db_email)

            gen_db.add(ActivityLog(
                lead_id=lead.id,
                user_id=current_user.id,
                action="FULL_PIPELINE_EXECUTED",
                agent_name="MULTI_AGENT_ORCHESTRATOR",
                details={
                    "steps_completed": ["RESEARCH", "QUALIFICATION", "EMAIL"],
                    "score": score,
                    "fit_category": fit_category,
                    "subject": email_data.get("subject"),
                },
            ))
            gen_db.commit()

            # Emit events
            yield _sse_event("research_done", res_data)
            yield _sse_event("qual_done", qual_data)
            yield _sse_event("email_done", email_data)
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
