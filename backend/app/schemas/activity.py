from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ActivityResponse(BaseModel):
    id: int
    lead_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    agent_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class ActivityCreate(BaseModel):
    lead_id: Optional[int] = None
    action: str
    agent_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
