from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict, field_validator

class ResearchAgentOutput(BaseModel):
    summary: str = Field(..., description="High-level executive summary of company and business model")
    company_overview: str = Field(..., description="Detailed breakdown of operations, market positioning, target audience")
    target_pain_points: List[str] = Field(default_factory=list, description="Specific operational, technical, or revenue bottlenecks")
    key_decision_makers: List[Dict[str, Any]] = Field(default_factory=list, description="Profiles and priorities of relevant leaders")
    technology_stack: List[str] = Field(default_factory=list, description="Detected CRM, sales tools, cloud infrastructure, or platforms")
    growth_signals: List[str] = Field(default_factory=list, description="Recent funding, hiring surges, product launches, expansions")
    sources: List[str] = Field(default_factory=list, description="Web domains and information sources researched")
    confidence_score: float = Field(0.85, description="Confidence score from 0.0 to 1.0")
    model_config = ConfigDict(from_attributes=True)

    @field_validator("company_overview", "summary", mode="before")
    @classmethod
    def coerce_to_str(cls, v):
        if isinstance(v, dict):
            return " ".join(f"{k.capitalize()}: {val}" for k, val in v.items())
        elif isinstance(v, list):
            return " ".join(str(item) for item in v)
        return str(v) if v is not None else ""

    @field_validator("technology_stack", "target_pain_points", "growth_signals", "sources", mode="before")
    @classmethod
    def coerce_to_list_of_str(cls, v):
        if isinstance(v, list):
            return [str(item).strip() for item in v if item]
        if isinstance(v, str):
            clean = v.strip()
            if not clean:
                return []
            if "\n" in clean:
                return [line.strip("- •* ") for line in clean.split("\n") if line.strip()]
            if "," in clean:
                return [item.strip() for item in clean.split(",") if item.strip()]
            return [clean]
        if isinstance(v, dict):
            return [f"{k}: {val}" for k, val in v.items()]
        return []

    @field_validator("key_decision_makers", mode="before")
    @classmethod
    def coerce_decision_makers(cls, v):
        if isinstance(v, list):
            res = []
            for item in v:
                if isinstance(item, dict):
                    res.append(item)
                elif isinstance(item, str):
                    res.append({"name": item, "role": "Key Decision Maker", "relevance": "Outbound prospect"})
            return res
        if isinstance(v, str) and v.strip():
            return [{"name": v.strip(), "role": "Key Decision Maker", "relevance": "Outbound prospect"}]
        return []

class QualificationAgentOutput(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Overall ICP fit score between 0 and 100")
    fit_category: str = Field(..., description="HIGH_FIT, MEDIUM_FIT, or LOW_FIT")
    reasoning: str = Field(..., description="Detailed justification behind the score and evaluation")
    positive_signals: List[str] = Field(default_factory=list, description="Signals supporting qualification")
    negative_signals: List[str] = Field(default_factory=list, description="Disqualifying factors, gaps, or risks")
    icp_fit_breakdown: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed breakdown of role, industry, company size, and budget potential"
    )
    recommendation: Optional[str] = Field(None, description="Recommended next action (e.g. PRIORITY_OUTREACH, NURTURE, DISQUALIFY)")
    model_config = ConfigDict(from_attributes=True)

    @field_validator("reasoning", mode="before")
    @classmethod
    def coerce_reasoning(cls, v):
        if isinstance(v, dict):
            return " ".join(f"{k.capitalize()}: {val}" for k, val in v.items())
        return str(v) if v is not None else ""

    @field_validator("positive_signals", "negative_signals", mode="before")
    @classmethod
    def coerce_signals(cls, v):
        if isinstance(v, list):
            return [str(item).strip() for item in v if item]
        if isinstance(v, str):
            clean = v.strip()
            if not clean:
                return []
            if "\n" in clean:
                return [line.strip("- •* ") for line in clean.split("\n") if line.strip()]
            if "," in clean:
                return [item.strip() for item in clean.split(",") if item.strip()]
            return [clean]
        return []

class EmailAgentOutput(BaseModel):
    subject: str = Field(..., description="Compelling, personalized email subject line")
    body: str = Field(..., description="Hyper-personalized email copy referencing specific pain points and company context")
    follow_up_subject: Optional[str] = Field(None, description="Subject for secondary touchpoint (3 days later)")
    follow_up_body: Optional[str] = Field(None, description="Value-oriented bump follow-up email")
    personalization_rationale: Optional[str] = Field(None, description="Explanation of why hooks and proof points were selected")
    tone: str = Field("professional_concise", description="Tone used for the email")
    model_config = ConfigDict(from_attributes=True)

class AgentPipelineResponse(BaseModel):
    lead_id: int
    status: str
    message: str
    research: Optional[ResearchAgentOutput] = None
    qualification: Optional[QualificationAgentOutput] = None
    email: Optional[EmailAgentOutput] = None
