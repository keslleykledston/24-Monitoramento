from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from ..models.incident import IncidentStatus, IncidentSeverity


class IncidentResponse(BaseModel):
    id: int
    target_id: int
    probe_id: int
    location_id: int
    alert_rule_id: Optional[int]
    severity: IncidentSeverity
    status: IncidentStatus
    title: str
    description: Optional[str]
    evidence: Optional[Dict[str, Any]]
    started_at: datetime
    acked_at: Optional[datetime]
    acked_by: Optional[str]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class IncidentAck(BaseModel):
    acked_by: str
