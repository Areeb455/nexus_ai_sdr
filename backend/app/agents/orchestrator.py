import asyncio
import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Lead, ResearchResult, QualificationResult, EmailOutput, ActivityLog, LeadStatus
from app.agents.state import AgentWorkflowState
from app.agents.research_agent import research_agent
from app.agents.qualification_agent import qualification_agent
from app.agents.email_agent import email_agent
from app.schemas.agent_schemas import AgentPipelineResponse

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Multi-Agent Orchestrator:
    Coordinates execution of Research, Qualification, and Email agents.
    Maintains workflow state, persists outputs to the database, logs audit trails,
    and updates lead status transitions.
    """

    def _init_state_from_lead(self, lead: Lead) -> AgentWorkflowState:
        return AgentWorkflowState(
            lead_id=lead.id,
            company_name=lead.company_name,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            role=lead.role,
            website=lead.website,
            industry=lead.industry,
            company_size=lead.company_size,
            location=lead.location,
            notes=lead.notes
        )

    def _load_existing_agent_data(self, lead: Lead, state: AgentWorkflowState):
        if lead.research_results:
            latest_res = lead.research_results[0]
            from app.schemas.agent_schemas import ResearchAgentOutput
            state.research = ResearchAgentOutput(
                summary=latest_res.summary or "",
                company_overview=latest_res.company_overview or "",
                target_pain_points=latest_res.target_pain_points or [],
                key_decision_makers=latest_res.key_decision_makers or [],
                technology_stack=latest_res.technology_stack or [],
                growth_signals=latest_res.growth_signals or [],
                sources=latest_res.sources or [],
                confidence_score=latest_res.confidence_score or 0.85
            )

        if lead.qualification_results:
            latest_qual = lead.qualification_results[0]
            from app.schemas.agent_schemas import QualificationAgentOutput
            state.qualification = QualificationAgentOutput(
                score=latest_qual.score,
                fit_category=latest_qual.fit_category,
                reasoning=latest_qual.reasoning,
                positive_signals=latest_qual.positive_signals or [],
                negative_signals=latest_qual.negative_signals or [],
                icp_fit_breakdown=latest_qual.icp_fit_breakdown or {}
            )

    async def run_research_step(self, lead: Lead, db: Session, user_id: Optional[int] = None) -> ResearchResult:
        state = self._init_state_from_lead(lead)
        self._load_existing_agent_data(lead, state)
        
        output = await research_agent.run(state)

        # Persist research result
        db_research = ResearchResult(
            lead_id=lead.id,
            summary=output.summary,
            company_overview=output.company_overview,
            target_pain_points=output.target_pain_points,
            key_decision_makers=output.key_decision_makers,
            technology_stack=output.technology_stack,
            growth_signals=output.growth_signals,
            sources=output.sources,
            confidence_score=output.confidence_score,
            raw_data=output.model_dump()
        )
        db.add(db_research)

        # Update lead status if currently NEW
        if lead.status == LeadStatus.NEW.value:
            lead.status = LeadStatus.RESEARCHED.value

        # Log Activity
        activity = ActivityLog(
            lead_id=lead.id,
            user_id=user_id,
            action="RESEARCH_COMPLETED",
            agent_name="RESEARCH_AGENT",
            details={
                "summary": output.summary[:150] + "..." if len(output.summary) > 150 else output.summary,
                "pain_points_count": len(output.target_pain_points),
                "confidence": output.confidence_score
            }
        )
        db.add(activity)
        db.commit()
        db.refresh(db_research)
        return db_research

    async def run_qualification_step(self, lead: Lead, db: Session, user_id: Optional[int] = None) -> QualificationResult:
        state = self._init_state_from_lead(lead)
        self._load_existing_agent_data(lead, state)

        # If research is not in state yet, run it on the fly
        if not state.research:
            await self.run_research_step(lead, db, user_id)
            self._load_existing_agent_data(lead, state)

        output = await qualification_agent.run(state)

        db_qual = QualificationResult(
            lead_id=lead.id,
            score=output.score,
            fit_category=output.fit_category,
            reasoning=output.reasoning,
            positive_signals=output.positive_signals,
            negative_signals=output.negative_signals,
            icp_fit_breakdown=output.icp_fit_breakdown
        )
        db.add(db_qual)

        # Update lead status
        if output.score >= 50:
            lead.status = LeadStatus.QUALIFIED.value
        else:
            lead.status = LeadStatus.DISQUALIFIED.value

        activity = ActivityLog(
            lead_id=lead.id,
            user_id=user_id,
            action=f"QUALIFICATION_{output.fit_category}",
            agent_name="QUALIFICATION_AGENT",
            details={
                "score": output.score,
                "fit_category": output.fit_category,
                "reasoning": output.reasoning[:150] + "..." if len(output.reasoning) > 150 else output.reasoning,
                "recommendation": output.recommendation
            }
        )
        db.add(activity)
        db.commit()
        db.refresh(db_qual)
        return db_qual

    async def run_email_step(self, lead: Lead, db: Session, user_id: Optional[int] = None) -> EmailOutput:
        state = self._init_state_from_lead(lead)
        self._load_existing_agent_data(lead, state)

        # Ensure research and qualification exist
        if not state.research:
            await self.run_research_step(lead, db, user_id)
            self._load_existing_agent_data(lead, state)
        if not state.qualification:
            await self.run_qualification_step(lead, db, user_id)
            self._load_existing_agent_data(lead, state)

        output = await email_agent.run(state)

        db_email = EmailOutput(
            lead_id=lead.id,
            subject=output.subject,
            body=output.body,
            follow_up_subject=output.follow_up_subject,
            follow_up_body=output.follow_up_body,
            personalization_rationale=output.personalization_rationale,
            tone=output.tone
        )
        db.add(db_email)

        activity = ActivityLog(
            lead_id=lead.id,
            user_id=user_id,
            action="EMAIL_CAMPAIGN_GENERATED",
            agent_name="EMAIL_AGENT",
            details={
                "subject": output.subject,
                "has_follow_up": bool(output.follow_up_body),
                "tone": output.tone
            }
        )
        db.add(activity)
        db.commit()
        db.refresh(db_email)
        return db_email

    async def run_full_pipeline(self, lead: Lead, db: Session, user_id: Optional[int] = None) -> AgentPipelineResponse:
        """
        Execute full end-to-end pipeline:
        Lead -> Research Agent -> [Qualification Agent || Email Agent] -> Human Ready

        Optimization: Qualification and Email run in parallel after Research completes.
        """
        # ── Step 1: Research (must complete first — qual & email depend on it) ──
        state = self._init_state_from_lead(lead)
        research_out = await research_agent.run(state)
        state.research = research_out  # Pre-load research into state

        # ── Step 2: Qualification + Email in PARALLEL ──
        # Give each agent its own state copy so they don't share mutable references
        qual_state = self._init_state_from_lead(lead)
        qual_state.research = research_out

        email_state = self._init_state_from_lead(lead)
        email_state.research = research_out

        qual_out, email_out = await asyncio.gather(
            qualification_agent.run(qual_state),
            email_agent.run(email_state),
        )

        # ── Persist all results ──
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
            raw_data=research_out.model_dump()
        )
        db.add(db_research)

        db_qual = QualificationResult(
            lead_id=lead.id,
            score=qual_out.score,
            fit_category=qual_out.fit_category,
            reasoning=qual_out.reasoning,
            positive_signals=qual_out.positive_signals,
            negative_signals=qual_out.negative_signals,
            icp_fit_breakdown=qual_out.icp_fit_breakdown
        )
        db.add(db_qual)

        db_email = EmailOutput(
            lead_id=lead.id,
            subject=email_out.subject,
            body=email_out.body,
            follow_up_subject=email_out.follow_up_subject,
            follow_up_body=email_out.follow_up_body,
            personalization_rationale=email_out.personalization_rationale,
            tone=email_out.tone
        )
        db.add(db_email)

        # ── Update lead status ──
        if qual_out.score >= 50:
            lead.status = LeadStatus.QUALIFIED.value
        else:
            lead.status = LeadStatus.DISQUALIFIED.value

        # ── Audit log ──
        activity = ActivityLog(
            lead_id=lead.id,
            user_id=user_id,
            action="FULL_PIPELINE_EXECUTED",
            agent_name="MULTI_AGENT_ORCHESTRATOR",
            details={
                "steps_completed": ["RESEARCH", "QUALIFICATION (parallel)", "EMAIL (parallel)"],
                "qualification_score": qual_out.score,
                "fit_category": qual_out.fit_category,
                "email_subject": email_out.subject
            }
        )
        db.add(activity)
        db.commit()

        return AgentPipelineResponse(
            lead_id=lead.id,
            status=lead.status,
            message="Multi-agent pipeline completed successfully",
            research=research_out,
            qualification=qual_out,
            email=email_out
        )

orchestrator = AgentOrchestrator()

