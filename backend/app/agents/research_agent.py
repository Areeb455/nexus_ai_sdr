import logging
import httpx
from typing import Dict, Any, List
from app.agents.state import AgentWorkflowState
from app.schemas.agent_schemas import ResearchAgentOutput
from app.agents.llm_engine import llm_engine

logger = logging.getLogger(__name__)

class ResearchAgent:
    """
    Research Agent:
    Researches a lead/company from supplied information and public signals.
    Extracts company context, industry, size/role signals, website data,
    pain points, business signals, and useful sales context.
    """

    def __init__(self):
        self.name = "RESEARCH_AGENT"

    async def run(self, state: AgentWorkflowState) -> ResearchAgentOutput:
        state.add_log(f"[{self.name}] Initiating deep research on company '{state.company_name}' and contact '{state.contact_name}'")
        
        # 1. Gather web signals if website is provided
        website_snippet = ""
        hunter_intel = None
        if state.website:
            website_snippet = await self._fetch_website_text(state.website)
            if website_snippet:
                state.add_log(f"[{self.name}] Successfully inspected public metadata from {state.website}")
            else:
                state.add_log(f"[{self.name}] Website {state.website} unreachable or timed out; falling back to knowledge synthesis")

            # Hunter.io verified contact enrichment
            try:
                from app.services.hunter_service import hunter_service
                hunter_intel = await hunter_service.search_domain(state.website)
                if hunter_intel and hunter_intel.get("all_contacts"):
                    state.add_log(f"[{self.name}] Enriched with {hunter_intel.get('total_emails_found')} Hunter.io verified executives (Pattern: {hunter_intel.get('email_pattern')})")
            except Exception as e:
                logger.warning(f"[{self.name}] Hunter enrichment failed: {e}")

        # 2. Formulate Prompt for Structured Research
        system_prompt = """You are the Nexus Research Agent, an expert AI Sales Intelligence Researcher.
Your mission is to analyze a company and prospect to generate rich, structured sales intelligence for an outbound sales campaign.
You must extract:
1. summary: High-level executive overview of what the company does.
2. company_overview: Deep dive into operations, business model, and target customer profile.
3. target_pain_points: List of 3-4 specific operational, revenue, or SDR bottlenecks they likely face.
4. key_decision_makers: List of objects with {name, role, relevance}.
5. technology_stack: List of likely sales/marketing/data stack tools (e.g. Salesforce, HubSpot, Outreach, Segment, AWS).
6. growth_signals: List of 2-3 recent growth signals (hiring, expansion, funding).
7. sources: List of source URLs or domain references.
8. confidence_score: Float between 0.0 and 1.0."""

        hunter_context = ""
        if hunter_intel and hunter_intel.get("all_contacts"):
            contacts_list = ", ".join([f"{c['name']} ({c['position']})" for c in hunter_intel["all_contacts"]])
            hunter_context = f"Hunter.io Verified Directory: {contacts_list}. Email Pattern: {hunter_intel.get('email_pattern')}"

        user_prompt = f"""
Company: {state.company_name}
Contact: {state.contact_name}
Role: {state.role or 'Unknown'}
Industry: {state.industry or 'Technology'}
Size: {state.company_size or '50-200'}
Website: {state.website or 'N/A'}
Location: {state.location or 'N/A'}
Supplied Notes: {state.notes or 'None'}
Scraped Website Snippet: {website_snippet or 'None'}
Hunter Verified Contacts: {hunter_context or 'None'}
"""

        try:
            raw_output = await llm_engine.generate_json(system_prompt, user_prompt, schema_class=ResearchAgentOutput)
            
            # Validate output using Pydantic
            research_output = ResearchAgentOutput(
                summary=raw_output.get("summary", f"{state.company_name} is an active enterprise in {state.industry}."),
                company_overview=raw_output.get("company_overview", f"Company operates in {state.industry} specializing in modern software and service delivery."),
                target_pain_points=raw_output.get("target_pain_points", [
                    "Manual lead research delays sales outreach cycles",
                    "Difficulty scaling outbound pipeline with lean SDR team"
                ]),
                key_decision_makers=raw_output.get("key_decision_makers", [
                    {"name": state.contact_name, "role": state.role or "Key Executive", "relevance": "Primary buyer"}
                ]),
                technology_stack=raw_output.get("technology_stack", ["Salesforce", "Outreach", "HubSpot"]),
                growth_signals=raw_output.get("growth_signals", [
                    f"{state.company_name} actively scaling revenue operations and market reach"
                ]),
                sources=raw_output.get("sources", [state.website or "public web index"]),
                confidence_score=float(raw_output.get("confidence_score", 0.88))
            )
            
            state.research = research_output
            state.current_step = "RESEARCHED"
            state.add_log(f"[{self.name}] Research completed with confidence {research_output.confidence_score}")
            return research_output

        except Exception as e:
            logger.error(f"[{self.name}] Failed during research execution: {e}")
            state.add_error(f"Research agent encountered an error: {str(e)}")
            # Return safe fallback structure
            fallback = ResearchAgentOutput(
                summary=f"{state.company_name} operating in {state.industry or 'B2B sector'}.",
                company_overview=f"Commercial enterprise with estimated size of {state.company_size or 'mid-market'}.",
                target_pain_points=["Outbound sales efficiency", "Lead enrichment automation"],
                key_decision_makers=[{"name": state.contact_name, "role": state.role or "Executive", "relevance": "Primary point of contact"}],
                technology_stack=["CRM", "Email Automation"],
                growth_signals=["Active market presence"],
                sources=[state.website or "direct input"],
                confidence_score=0.70
            )
            state.research = fallback
            state.current_step = "RESEARCHED"
            return fallback

    async def _fetch_website_text(self, url: str) -> str:
        """Lightweight non-blocking web scrape with timeout and safety"""
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        try:
            async with httpx.AsyncClient(timeout=4.0, follow_redirects=True, verify=False) as client:
                res = await client.get(url, headers={"User-Agent": "NexusAI-SDR-Researcher/1.0"})
                if res.status_code == 200:
                    text = res.text[:2000]  # Take first 2000 chars
                    return " ".join(text.split())
        except Exception:
            return ""
        return ""

research_agent = ResearchAgent()
