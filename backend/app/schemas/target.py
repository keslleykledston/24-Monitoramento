from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.target import TargetType


class TargetCreate(BaseModel):
    name: str
    url: str
    ip_address: Optional[str] = None
    type: TargetType = TargetType.HTTPS


class TargetResponse(BaseModel):
    id: int
    name: str
    url: str
    ip_address: Optional[str] = None
    type: TargetType
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
