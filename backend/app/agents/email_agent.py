import logging
from app.agents.state import AgentWorkflowState
from app.schemas.agent_schemas import EmailAgentOutput
from app.agents.llm_engine import llm_engine

logger = logging.getLogger(__name__)

class EmailAgent:
    """
    Email Agent:
    Generates personalized initial outreach and follow-up emails using the research and qualification context.
    The email is hyper-tailored to the lead's role, company growth signals, and specific pain points.
    """

    def __init__(self):
        self.name = "EMAIL_AGENT"

    async def run(self, state: AgentWorkflowState) -> EmailAgentOutput:
        state.add_log(f"[{self.name}] Generating personalized sales outreach for '{state.contact_name}' at '{state.company_name}'")

        # Compile research and qualification context
        research_context = "No specific research intelligence provided."
        pain_points_str = "scaling outbound pipeline, manual lead enrichment"
        growth_signals_str = "scaling team and market presence"
        
        if state.research:
            research_context = f"Summary: {state.research.summary}\nOverview: {state.research.company_overview}"
            if state.research.target_pain_points:
                pain_points_str = "\n- " + "\n- ".join(state.research.target_pain_points)
            if state.research.growth_signals:
                growth_signals_str = "\n- " + "\n- ".join(state.research.growth_signals)

        qualification_context = "Lead has been evaluated as an active commercial target."
        fit_score = 70
        fit_category = "MEDIUM_FIT"
        if state.qualification:
            fit_score = state.qualification.score
            fit_category = state.qualification.fit_category
            qualification_context = f"ICP Fit Category: {state.qualification.fit_category} (Score {state.qualification.score}/100)\nReasoning: {state.qualification.reasoning}"

        system_prompt = """You are the Nexus Email Agent, a world-class B2B Sales Copywriter and Outbound Specialist.
Your goal is to write a compelling, hyper-personalized cold outreach email and a follow-up email from Nexus AI SDR.

Guidelines:
- Personalize based on the lead's role, company context, and detected pain points.
- Never use generic clichés like 'I hope this email finds you well' or 'Just checking in'.
- Focus on the prospect's world: their growth, their SDR productivity bottlenecks, and the impact of autonomous AI SDR agents.
- Keep the initial email under 125 words. Make the call-to-action (CTA) low-friction (e.g. 10-minute walkthrough).
- Write a 3-day follow-up bump email (under 75 words) that adds new value.
- Provide a clear 'personalization_rationale' explaining why you selected these specific hooks and angles.

Output JSON:
{
  "subject": "Compelling subject line",
  "body": "Formatted email body with paragraphs",
  "follow_up_subject": "Follow up subject line",
  "follow_up_body": "Formatted follow up body",
  "personalization_rationale": "Explanation of personalization strategy",
  "tone": "professional_concise"
}"""

        user_prompt = f"""
Prospect Contact: {state.contact_name}
Role: {state.role or 'Sales / RevOps Leader'}
Company: {state.company_name}
Industry: {state.industry or 'Software / Tech'}
Company Size: {state.company_size or 'Mid-Market'}
Website: {state.website or 'N/A'}

Research Intelligence:
{research_context}

Target Pain Points:
{pain_points_str}

Growth Signals:
{growth_signals_str}

Qualification Context:
{qualification_context}
"""

        try:
            raw_output = await llm_engine.generate_json(system_prompt, user_prompt, schema_class=EmailAgentOutput)

            first_name = state.contact_name.split()[0] if state.contact_name else "there"
            default_subj = f"Scaling {state.company_name}'s outbound pipeline without adding SDR headcount"
            default_body = f"""Hi {first_name},

Noticed {state.company_name}'s recent momentum in {state.industry or 'the market'} and was following your work leading {state.role or 'revenue growth'}.

Most revenue leaders mention that SDRs spend up to 65% of their day manually researching accounts and drafting emails—resulting in slow lead turnaround and inconsistent pipeline.

Nexus AI SDR solves this by deploying cooperating AI agents that autonomously conduct deep prospect research, ICP qualification, and personalized outreach before your reps even open their inbox.

Open to a brief 10-minute walkthrough this Thursday or Friday to see how it works on your target account list?

Best regards,
Alex Rivera
Nexus AI Growth Team"""

            email_output = EmailAgentOutput(
                subject=raw_output.get("subject", default_subj),
                body=raw_output.get("body", default_body),
                follow_up_subject=raw_output.get("follow_up_subject", f"Quick bump re: outbound productivity at {state.company_name}"),
                follow_up_body=raw_output.get("follow_up_body", f"Hi {first_name},\n\nWanted to quickly follow up on my note from earlier. If increasing outbound pipeline velocity is a priority for {state.company_name} this quarter, happy to share a brief 2-minute overview.\n\nBest,\nAlex"),
                personalization_rationale=raw_output.get("personalization_rationale", f"Tailored to {first_name}'s role as {state.role} at {state.company_name}, highlighting specific SDR bottlenecks."),
                tone=raw_output.get("tone", "professional_concise")
            )

            state.email = email_output
            state.current_step = "EMAIL_GENERATED"
            state.add_log(f"[{self.name}] Personalized outreach generated with subject: '{email_output.subject}'")
            return email_output

        except Exception as e:
            logger.error(f"[{self.name}] Email generation failed: {e}")
            state.add_error(f"Email agent error: {str(e)}")
            first_name = state.contact_name.split()[0] if state.contact_name else "there"
            fallback = EmailAgentOutput(
                subject=f"Accelerating outbound pipeline at {state.company_name}",
                body=f"Hi {first_name},\n\nReaching out because Nexus AI SDR helps companies like {state.company_name} automate prospect research and outreach.\n\nOpen to a quick 10-minute chat?\n\nBest,\nAlex",
                follow_up_subject=f"Following up re: {state.company_name}",
                follow_up_body=f"Hi {first_name},\n\nJust bumping this in case you had a moment to review.\n\nBest,\nAlex",
                personalization_rationale="Fallback email generated with baseline personalization.",
                tone="professional_concise"
            )
            state.email = fallback
            state.current_step = "EMAIL_GENERATED"
            return fallback

email_agent = EmailAgent()
