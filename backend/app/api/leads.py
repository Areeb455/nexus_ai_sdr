import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Lead, ResearchResult, QualificationResult, EmailOutput, ActivityLog, LeadStatus
from app.api.auth import get_current_user
from app.schemas.lead import (
    LeadCreate, LeadUpdate, LeadResponse, LeadListResponse,
    DashboardMetrics, ResearchResultResponse, QualificationResultResponse, EmailOutputResponse
)
from app.services import lead_service

from pydantic import BaseModel

logger = logging.getLogger(__name__)

class CompanyExtractRequest(BaseModel):
    query: str

class AutonomousHuntRequest(BaseModel):
    query: str
    auto_run_pipeline: bool = True

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.post("/autonomous-hunt", response_model=LeadResponse)
async def autonomous_hunt(
    req: AutonomousHuntRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Autonomous AI SDR Prospecting Engine:
    1. Inspects live company web presence.
    2. Synthesizes ideal B2B executive buyer persona.
    3. Persists lead in database.
    4. Automatically coordinates Research -> Qualification -> Email agents.
    5. Returns fully enriched lead ready for sales review.
    """
    from app.agents.llm_engine import llm_engine
    from app.agents.orchestrator import orchestrator
    from app.services.hunter_service import hunter_service
    from app.services.web_search_service import web_search_service

    query = req.query.strip()
    words = query.split()
    if len(words) > 4 and "." not in query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{query[:40]}...' does not appear to be a company name or website domain. Please enter a real company (e.g. Stripe, Linear, Figma, Datadog) or website URL (e.g. stripe.com)."
        )

    try:
        # 1. Multi-source live web search & verified metric extraction
        web_intel = await web_search_service.search_company_intel(query)
        live_facts = "\n".join(web_intel.get("real_facts", []))
        verified_metrics = web_intel.get("verified_metrics", {})
        metrics_str = ", ".join([f"{k.capitalize()}: {v}" for k, v in verified_metrics.items()]) if verified_metrics else "Undisclosed"

        # 2. Query Hunter.io for real verified executive intelligence
        hunter_intel = await hunter_service.search_domain(query)
        hunter_context = ""
        if hunter_intel and hunter_intel.get("best_contact"):
            bc = hunter_intel["best_contact"]
            hunter_context = f"""
HUNTER.IO VERIFIED CORPORATE INTELLIGENCE:
- Company: {hunter_intel.get('company_name')}
- Verified Email Pattern: {hunter_intel.get('email_pattern')}
- Total Verified Emails Found: {hunter_intel.get('total_emails_found')}
- Verified Executive Buyer: {bc['name']}
- Verified Executive Position: {bc['position']}
- Verified Corporate Email: {bc['email']} (Confidence: {bc['confidence']}%, Status: {bc['verification_status']})
- LinkedIn: {bc.get('linkedin') or 'N/A'}
NOTE: Use this real verified executive and company profile as your primary target persona.
"""

        prompt = f"""You are the Nexus Autonomous Lead Prospecting Agent.
Target Company/Domain: {query}

LIVE WEB RESEARCH & REAL FACTUAL SIGNALS:
{live_facts if live_facts else 'Direct domain scrape only.'}

VERIFIED FINANCIAL & SCALE METRICS:
{metrics_str}

{hunter_context}

Extract real company intelligence and identify the single most relevant B2B buyer persona to prospect with Nexus AI SDR.
If Hunter.io verified executive intelligence is provided above, utilize that real verified person and email format.
CRITICAL: Do NOT invent fake numbers. Ground all fields in the real web signals.

Respond ONLY with a valid JSON object matching:
{{
  "company_name": "Official company name",
  "website": "Canonical URL (e.g. https://domain.com)",
  "industry": "Specific B2B segment (e.g. B2B SaaS / Developer Infrastructure / Fintech)",
  "company_size": "Estimated employee count (prefer verified headcount if present, e.g. 118 employees)",
  "location": "Headquarters city and state/country (e.g. San Francisco, CA)",
  "contact_name": "Full name of executive buyer (prefer Hunter.io verified executive if present)",
  "role": "Executive title (e.g. Head of Engineering, VP of Sales, Head of RevOps)",
  "contact_email": "Professional email (prefer Hunter.io verified email)",
  "notes": "Strategic 2-sentence summary of why they need Nexus AI SDR automation, citing real products and verified scale."
}}"""

        extracted = await llm_engine.generate_json("You are an autonomous AI SDR prospecting agent.", prompt)

        # Resilient parsing if LLM nested keys under company_profile or company
        comp_profile = extracted.get("company_profile") if isinstance(extracted.get("company_profile"), dict) else {}
        if not comp_profile and isinstance(extracted.get("company"), dict):
            comp_profile = extracted.get("company")

        extracted_comp_name = comp_profile.get("company_name") or extracted.get("company_name")
        extracted_website = comp_profile.get("website") or extracted.get("website")
        extracted_industry = comp_profile.get("industry") or extracted.get("industry")
        extracted_size = comp_profile.get("estimated_size") or comp_profile.get("company_size") or extracted.get("company_size")

        domain_part = web_intel.get("domain") or (query.replace("https://", "").replace("http://", "").split("/")[0] if "." in query else f"{query.lower().replace(' ', '')}.com")
        clean_website = extracted_website or (f"https://{domain_part}")
        clean_company = web_intel.get("company_name") or domain_part.split(".")[0].capitalize()
        
        # Priority: Hunter.io verified contact > Gemini extracted
        if hunter_intel and hunter_intel.get("best_contact"):
            bc = hunter_intel["best_contact"]
            contact_name = bc["name"]
            role = bc["position"]
            contact_email = bc["email"]
            company_name = hunter_intel.get("company_name") or extracted_comp_name or clean_company

            # If Hunter gave generic fallback but LLM/Web found specific named executive/founder:
            if (not contact_name or contact_name in ["Key Decision Maker", "Executive Leader"]) and extracted.get("contact_name") and extracted.get("contact_name") not in ["Key Decision Maker", "Executive Leader"]:
                contact_name = extracted.get("contact_name")
                if extracted.get("role"):
                    role = extracted.get("role")

            notes = extracted.get("notes", "") + f" [Verified via Hunter.io: {bc['confidence']}% confidence]"
        else:
            contact_name = extracted.get("contact_name") or f"Head of Operations ({clean_company})"
            role = extracted.get("role") or "VP of Revenue Operations"
            email_user = contact_name.lower().replace(" ", ".").replace("(", "").replace(")", "")
            contact_email = extracted.get("contact_email") or f"{email_user}@{domain_part}"
            company_name = extracted_comp_name or clean_company
            notes = extracted.get("notes", f"Autonomous lead discovered for {clean_company} based on live web presence.")

        lead = Lead(
            user_id=current_user.id,
            company_name=company_name,
            contact_name=contact_name,
            contact_email=contact_email,
            role=role,
            website=clean_website,
            industry=extracted_industry or "B2B Technology",
            company_size=extracted_size or verified_metrics.get("headcount", "100-500 employees"),
            location=extracted.get("location") or verified_metrics.get("headquarters", "San Francisco, CA"),
            notes=notes,
            status=LeadStatus.NEW.value
        )
        db.add(lead)
        db.commit()
        db.refresh(lead)

        if req.auto_run_pipeline:
            await orchestrator.run_full_pipeline(lead, db, user_id=current_user.id)
            db.refresh(lead)

        return _build_lead_response(lead)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        logger.error(f"[AutonomousHunt] Execution error: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Autonomous hunt error: {str(e)}"
        )

@router.delete("/dev/clear-all")
def clear_all_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Clear all leads and agent history to provide a fresh clean slate for testing.
    """
    db.query(ActivityLog).delete()
    db.query(EmailOutput).delete()
    db.query(QualificationResult).delete()
    db.query(ResearchResult).delete()
    db.query(Lead).delete()
    db.commit()
    return {"message": "Clean slate activated: all leads and agent history cleared."}

@router.post("/extract-company")
async def extract_company_from_web(
    req: CompanyExtractRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Auto-extracts company intelligence directly from public URL or company name
    to auto-fill new prospect forms using Gemini 3.7 Flash.
    """
    from app.agents.llm_engine import llm_engine
    from app.agents.research_agent import research_agent

    query = req.query.strip()
    website_text = ""
    if "." in query or query.startswith("http"):
        website_text = await research_agent._fetch_website_text(query)

    prompt = f"""You are an expert AI sales researcher.
A user wants to add a company to Nexus AI SDR.
Input Query: {query}
Fetched Website Snippet: {website_text[:1500] if website_text else 'None'}

Extract or infer the company's profile. Respond ONLY with a valid JSON object matching:
{{
  "company_name": "Official company name",
  "website": "Clean URL (e.g. https://www.example.com)",
  "industry": "Specific B2B vertical (e.g. B2B SaaS / Cybersecurity / Cloud Infrastructure)",
  "company_size": "Estimated size (e.g. 50-200 employees, 250-500 employees, 1000+ employees)",
  "suggested_role": "Ideal SDR target buyer role at this company (e.g. VP of Sales, Head of RevOps)",
  "notes": "Brief 1-2 sentence strategic note about their core business model and target market"
}}"""

    result = await llm_engine.generate_json("You are an autonomous AI company intelligence extractor.", prompt)
    return result

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
