from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProbeCreate(BaseModel):
    name: str
    location_id: int
    token: str


class ProbeResponse(BaseModel):
    id: int
    name: str
    location_id: int
    is_active: bool
    last_seen: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True
