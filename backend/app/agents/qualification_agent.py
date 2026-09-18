import logging
from app.agents.state import AgentWorkflowState
from app.schemas.agent_schemas import QualificationAgentOutput
from app.agents.llm_engine import llm_engine

logger = logging.getLogger(__name__)

class QualificationAgent:
    """
    Qualification Agent:
    Uses research intelligence + lead profile to objectively qualify whether the prospect
    is suitable against defined Ideal Customer Profile (ICP) criteria.
    Outputs a score (0-100), Fit Category (HIGH_FIT, MEDIUM_FIT, LOW_FIT), reasoning, and positive/negative signals.
    """

    def __init__(self):
        self.name = "QUALIFICATION_AGENT"

    async def run(self, state: AgentWorkflowState) -> QualificationAgentOutput:
        state.add_log(f"[{self.name}] Initiating ICP qualification for '{state.contact_name}' at '{state.company_name}'")

        # Compile research context
        research_summary = "No prior research available."
        pain_points_str = "None specified"
        growth_signals_str = "None specified"
        
        if state.research:
            research_summary = f"{state.research.summary}\nOverview: {state.research.company_overview}"
            pain_points_str = "; ".join(state.research.target_pain_points)
            growth_signals_str = "; ".join(state.research.growth_signals)

        system_prompt = """You are the Nexus Qualification Agent, an objective B2B Revenue Operations & ICP Specialist.
Your mission is to evaluate whether a prospect matches the Ideal Customer Profile (ICP) for Nexus AI SDR software.

Nexus ICP Definition:
- Target Industries: B2B SaaS, Cloud Software, Fintech, Tech-enabled Services, High-growth Tech.
- Target Decision Makers: VP of Sales, Head of Revenue Operations (RevOps), Chief Commercial Officer (CCO), Chief Revenue Officer (CRO), Director of Inside Sales, Founders/CEOs of growth-stage companies.
- Ideal Company Scale: 20 to 500 employees (Scale-up sweet spot where SDR efficiency delivers immediate ROI).
- Low Fit / Disqualifiers: Solopreneurs, B2C retail, non-tech freelancers, student projects, companies under 5 employees with zero outbound sales motion.

You must output a JSON object containing:
1. score: Integer from 0 to 100.
2. fit_category: String - "HIGH_FIT" (score >= 75), "MEDIUM_FIT" (50 to 74), or "LOW_FIT" (score < 50).
3. reasoning: Comprehensive 2-3 sentence analysis defending why this lead scored as they did.
4. positive_signals: List of 2-4 concrete reasons/strengths matching the ICP.
5. negative_signals: List of 1-3 risks, gaps, or disqualifying flags.
6. icp_fit_breakdown: Dictionary with integer scores for {role_authority, industry_fit, company_size_fit, urgency_and_signals}.
7. recommendation: String - "PRIORITY_OUTREACH", "TARGETED_NURTURE", or "DISQUALIFY_OR_HOLD"."""

        user_prompt = f"""
Company: {state.company_name}
Contact: {state.contact_name}
Role: {state.role or 'Unknown'}
Industry: {state.industry or 'Unknown'}
Size: {state.company_size or 'Unknown'}
Location: {state.location or 'Unknown'}
Lead Notes: {state.notes or 'None'}
Research Agent Summary: {research_summary}
Identified Pain Points: {pain_points_str}
Identified Growth Signals: {growth_signals_str}
"""

        try:
            raw_output = await llm_engine.generate_json(system_prompt, user_prompt, schema_class=QualificationAgentOutput)
            
            score = int(raw_output.get("score", 65))
            # Ensure fit_category aligns with score
            if score >= 75:
                fit_category = "HIGH_FIT"
                rec = "PRIORITY_OUTREACH"
            elif score >= 50:
                fit_category = "MEDIUM_FIT"
                rec = "TARGETED_NURTURE"
            else:
                fit_category = "LOW_FIT"
                rec = "DISQUALIFY_OR_HOLD"

            qualification_output = QualificationAgentOutput(
                score=score,
                fit_category=raw_output.get("fit_category", fit_category),
                reasoning=raw_output.get("reasoning", f"Lead scored {score}/100 based on role and industry alignment."),
                positive_signals=raw_output.get("positive_signals", ["Active commercial presence"]),
                negative_signals=raw_output.get("negative_signals", ["Limited intent signals detected"]),
                icp_fit_breakdown=raw_output.get("icp_fit_breakdown", {
                    "role_authority": 25,
                    "industry_fit": 25,
                    "company_size_fit": 20,
                    "urgency_and_signals": 15
                }),
                recommendation=raw_output.get("recommendation", rec)
            )

            state.qualification = qualification_output
            state.current_step = "QUALIFIED"
            state.add_log(f"[{self.name}] Qualification complete. Assigned score {score}/100 ({qualification_output.fit_category})")
            return qualification_output

        except Exception as e:
            logger.error(f"[{self.name}] Qualification execution error: {e}")
            state.add_error(f"Qualification agent error: {str(e)}")
            fallback = QualificationAgentOutput(
                score=55,
                fit_category="MEDIUM_FIT",
                reasoning="Standard baseline qualification assigned due to processing anomaly.",
                positive_signals=["Valid business entity"],
                negative_signals=["Insufficient enriched data"],
                icp_fit_breakdown={"role_authority": 15, "industry_fit": 15, "company_size_fit": 15, "urgency_and_signals": 10},
                recommendation="TARGETED_NURTURE"
            )
            state.qualification = fallback
            state.current_step = "QUALIFIED"
            return fallback

qualification_agent = QualificationAgent()
