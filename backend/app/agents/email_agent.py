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
- CRITICAL: ZERO AI SLOP. Do NOT hallucinate fabricated statistics like 'SDRs spend 65% of their day' or '3.4x lift in meetings' or '42% reduction in CAC'.
- NEVER use placeholder brackets like 'Hi [Prospect Name]' or 'Hi [Name]'. Always greet with the contact's real first name (e.g. 'Hi Pranjal' or 'Hi Eileen'). If contact name is unavailable or generic, use 'Hi {Company} Team' or 'Hi there'.
- NEVER guess or hallucinate fake services like 'branding and web design agency'. Ground the pitch strictly in their real products (e.g. sign language AI, developer tooling, payments, observability).
- Reference ONLY verified company facts, real products, and genuine operational scale found in the research context.
- Personalize based on the lead's role, company context, and detected pain points.
- Never use generic clichés like 'I hope this email finds you well' or 'Just checking in'.
- Focus on the prospect's world: their growth, their SDR productivity bottlenecks, and the impact of autonomous AI SDR agents.
- Keep the initial email under 125 words. Make the call-to-action (CTA) low-friction (e.g. 10-minute walkthrough).
- Write a 3-day follow-up bump email (under 75 words) that adds new value.
- Provide a clear 'personalization_rationale' explaining why you selected these specific hooks and angles.
- Sign off professionally as 'Nexus AI Growth Team' or 'Nexus SDR Operations'. NEVER use placeholder personas like 'Alex Rivera'.

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
            subject = raw_output.get("subject") or f"Partnership re: {state.company_name} outbound operations"
            body = raw_output.get("body")
            if not body:
                heur = llm_engine._heuristic_email(user_prompt)
                body = heur.get("body", f"Hi {first_name},\n\nNoticed {state.company_name}'s recent momentum in {state.industry or 'B2B technology'}.\n\nScaling outbound pipeline often creates a bandwidth bottleneck for leadership. Nexus deploys autonomous AI SDRs that research and qualify accounts so your team can focus on closing deals.\n\nOpen to a 10-minute walkthrough this week?\n\nBest,\nNexus SDR Operations")
                raw_output["body"] = body
                if not raw_output.get("follow_up_body"):
                    raw_output["follow_up_body"] = heur.get("follow_up_body")
                if not raw_output.get("personalization_rationale"):
                    raw_output["personalization_rationale"] = heur.get("personalization_rationale")

            email_output = EmailAgentOutput(
                subject=subject,
                body=body,
                follow_up_subject=raw_output.get("follow_up_subject", f"Following up: {subject}"),
                follow_up_body=raw_output.get("follow_up_body", f"Hi {first_name},\n\nJust bumping my earlier note regarding {state.company_name}'s outbound pipeline motion. Would love to share a brief walkthrough if this is top of mind this quarter.\n\nBest,\nNexus Growth Team"),
                personalization_rationale=raw_output.get("personalization_rationale", f"Directly tailored to {first_name} as {state.role} at {state.company_name} based on verified company signals."),
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
            heur = llm_engine._heuristic_email(user_prompt)
            fallback = EmailAgentOutput(
                subject=heur.get("subject", f"Partnership re: {state.company_name} outbound operations"),
                body=heur.get("body", f"Hi {first_name},\n\nFollowing up on {state.company_name}'s outbound growth initiatives. Nexus deploys autonomous AI SDR agents to accelerate pipeline.\n\nOpen to a 10-minute walkthrough?\n\nBest,\nNexus Growth Team"),
                follow_up_subject=heur.get("follow_up_subject", f"Quick follow-up regarding outbound operations at {state.company_name}"),
                follow_up_body=heur.get("follow_up_body", f"Hi {first_name},\n\nJust bumping my note to see if automating account qualification and outbound is relevant for {state.company_name} this quarter.\n\nBest,\nNexus Growth Team"),
                personalization_rationale=heur.get("personalization_rationale", f"Tailored to {first_name} at {state.company_name}."),
                tone="professional_concise"
            )
            state.email = fallback
            state.current_step = "EMAIL_GENERATED"
            return fallback

email_agent = EmailAgent()
