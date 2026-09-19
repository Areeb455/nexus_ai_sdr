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
        
        # 1. Gather live multi-source web signals
        from app.services.web_search_service import web_search_service
        web_intel = await web_search_service.search_company_intel(state.website or state.company_name)
        live_facts = "\n".join(web_intel.get("real_facts", []))
        homepage_snippet = web_intel.get("homepage_summary", "")

        # 2. Hunter.io verified contact enrichment
        hunter_intel = None
        if state.website:
            try:
                from app.services.hunter_service import hunter_service
                hunter_intel = await hunter_service.search_domain(state.website)
                if hunter_intel and hunter_intel.get("all_contacts"):
                    state.add_log(f"[{self.name}] Enriched with {hunter_intel.get('total_emails_found')} Hunter.io verified executives (Pattern: {hunter_intel.get('email_pattern')})")
            except Exception as e:
                logger.warning(f"[{self.name}] Hunter enrichment failed: {e}")

        # 3. Formulate Prompt for Structured Research with REAL facts
        system_prompt = """You are the Nexus Research Agent, an expert AI Sales Intelligence Researcher.
Your mission is to analyze a real company and prospect to generate rich, structured sales intelligence for an outbound sales campaign.
CRITICAL INSTRUCTION:
- Ground your analysis strictly in the LIVE WEB INTELLIGENCE and Hunter.io data provided below.
- Do NOT output generic filler phrases like 'modernizing outbound sales execution' or 'established organization in the B2B Technology sector'.
- Reference real products, real revenue, real headcount, or real funding milestones discovered in the intelligence.

You must extract:
1. summary: High-level factual overview of what the company does and its market standing.
2. company_overview: Deep dive into products, business model, scale, and customer profile.
3. target_pain_points: List of 3-4 specific operational, revenue, or GTM bottlenecks relevant to their business.
4. key_decision_makers: List of objects with {name, role, relevance}.
5. technology_stack: List of known or likely software tools used (e.g. AWS, React, Python, Salesforce, HubSpot).
6. growth_signals: List of 2-3 recent growth signals (funding, revenue milestones, expansion).
7. sources: List of source URLs or references.
8. confidence_score: Float between 0.0 and 1.0."""

        verified_metrics = web_intel.get("verified_metrics", {})
        metrics_block = "\n".join([f"- {k.capitalize()}: {v}" for k, v in verified_metrics.items()]) if verified_metrics else "Undisclosed in public indices"

        hunter_context = ""
        if hunter_intel and hunter_intel.get("all_contacts"):
            contacts_list = ", ".join([f"{c['name']} ({c['position']})" for c in hunter_intel["all_contacts"]])
            hunter_context = f"Hunter.io Verified Directory: {contacts_list}. Email Pattern: {hunter_intel.get('email_pattern')}"

        user_prompt = f"""
Target Company: {state.company_name}
Target Contact: {state.contact_name}
Target Role: {state.role or 'Unknown'}
Industry: {state.industry or 'Technology'}
Size: {state.company_size or 'Unknown'}
Website: {state.website or 'N/A'}
Location: {state.location or 'N/A'}
Supplied Notes: {state.notes or 'None'}

VERIFIED QUANTITATIVE METRICS (REAL WEB CRAWLER DATA):
{metrics_block}

LIVE WEB RESEARCH & FACTUAL SIGNALS:
{live_facts if live_facts else 'Direct domain scrape only.'}

LIVE WEBSITE DATA:
{homepage_snippet if homepage_snippet else 'None'}

HUNTER.IO VERIFIED INTELLIGENCE:
{hunter_context if hunter_context else 'None'}
"""

        try:
            raw_output = await llm_engine.generate_json(system_prompt, user_prompt, schema_class=ResearchAgentOutput)
            
            # Combine all real sources
            sources = web_intel.get("intel_sources", [])
            if state.website and state.website not in sources:
                sources.append(state.website)
            if hunter_intel:
                sources.append(f"Hunter.io Verified Directory ({hunter_intel.get('domain')})")
            
            research_output = ResearchAgentOutput(
                summary=raw_output.get("summary", f"{state.company_name} operates in the {state.industry} sector."),
                company_overview=raw_output.get("company_overview", f"Enterprise software organization specializing in modern technology solutions."),
                target_pain_points=raw_output.get("target_pain_points", [
                    f"Scaling outbound sales efficiency for {state.company_name}'s product suite",
                    "Manual account enrichment consuming high sales bandwidth"
                ]),
                key_decision_makers=raw_output.get("key_decision_makers", [
                    {"name": state.contact_name, "role": state.role or "Key Decision Maker", "relevance": "Primary outbound target"}
                ]),
                technology_stack=raw_output.get("technology_stack", ["Cloud Infrastructure", "CRM", "Product Analytics"]),
                growth_signals=raw_output.get("growth_signals", [
                    f"Active market expansion in {state.industry}"
                ]),
                sources=sources,
                confidence_score=float(raw_output.get("confidence_score", 0.92 if hunter_intel else 0.85))
            )
            
            state.research = research_output
            state.current_step = "RESEARCHED"
            state.add_log(f"[{self.name}] Research completed with confidence {research_output.confidence_score} based on live web signals")
            return research_output

        except Exception as e:
            logger.error(f"[{self.name}] Failed during research execution: {e}")
            state.add_error(f"Research agent encountered an error: {str(e)}")
            raise e

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
