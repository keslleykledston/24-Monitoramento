from pydantic import BaseModel
from datetime import datetime


class LocationCreate(BaseModel):
    name: str
    code: str


class LocationResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True
