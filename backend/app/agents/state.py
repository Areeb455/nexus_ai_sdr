from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.agent_schemas import ResearchAgentOutput, QualificationAgentOutput, EmailAgentOutput

class AgentWorkflowState(BaseModel):
    """
    Structured state object passed across cooperating agents in the SDR pipeline.
    Ensures deterministic data handoffs and auditability.
    """
    lead_id: int
    company_name: str
    contact_name: str
    contact_email: Optional[str] = None
    role: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    
    # State tracking
    current_step: str = "INITIALIZED"  # INITIALIZED, RESEARCHED, QUALIFIED, EMAIL_GENERATED, COMPLETED, FAILED
    errors: List[str] = Field(default_factory=list)
    execution_logs: List[str] = Field(default_factory=list)
    
    # Agent Artifacts
    research: Optional[ResearchAgentOutput] = None
    qualification: Optional[QualificationAgentOutput] = None
    email: Optional[EmailAgentOutput] = None
    
    def add_log(self, message: str):
        self.execution_logs.append(message)
        
    def add_error(self, err: str):
        self.errors.append(err)
