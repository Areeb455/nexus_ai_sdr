from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.agent_schemas import ResearchAgentOutput, QualificationAgentOutput, EmailAgentOutput

class LeadBase(BaseModel):
    company_name: str
    contact_name: str
    contact_email: Optional[str] = None
    role: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    role: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ResearchResultResponse(ResearchAgentOutput):
    id: int
    lead_id: int
    created_at: datetime

class QualificationResultResponse(QualificationAgentOutput):
    id: int
    lead_id: int
    created_at: datetime

class EmailOutputResponse(EmailAgentOutput):
    id: int
    lead_id: int
    created_at: datetime

class LeadResponse(LeadBase):
    id: int
    user_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: datetime
    latest_research: Optional[ResearchResultResponse] = None
    latest_qualification: Optional[QualificationResultResponse] = None
    latest_email: Optional[EmailOutputResponse] = None
    model_config = ConfigDict(from_attributes=True)

class LeadSummaryItem(LeadBase):
    id: int
    status: str
    created_at: datetime
    qualification_score: Optional[int] = None
    fit_category: Optional[str] = None
    last_activity: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class LeadListResponse(BaseModel):
    total: int
    items: List[LeadSummaryItem]

class DashboardMetrics(BaseModel):
    total_leads: int
    researched_leads: int
    qualified_leads: int
    disqualified_leads: int
    contacted_leads: int
    high_fit_leads: int
    medium_fit_leads: int
    low_fit_leads: int
    conversion_rate_percentage: float
