from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.alert_rule import Severity, RuleType


class AlertRuleCreate(BaseModel):
    name: str
    rule_type: RuleType
    severity: Severity
    threshold: Optional[float] = None
    consecutive_failures: Optional[int] = None


class AlertRuleResponse(BaseModel):
    id: int
    name: str
    rule_type: RuleType
    severity: Severity
    threshold: Optional[float]
    consecutive_failures: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
