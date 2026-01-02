from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.measurement import MeasurementType


class MeasurementCreate(BaseModel):
    probe_id: int
    target_id: int
    up: bool
    measurement_type: MeasurementType = MeasurementType.ICMP
    rtt_ms: Optional[float] = None
    jitter_ms: Optional[float] = None
    loss_pct: Optional[float] = None
    http_code: Optional[int] = None
    error: Optional[str] = None


class MeasurementRawResponse(BaseModel):
    id: int
    timestamp: datetime
    probe_id: int
    target_id: int
    up: bool
    measurement_type: MeasurementType
    rtt_ms: Optional[float]
    jitter_ms: Optional[float]
    loss_pct: Optional[float]
    http_code: Optional[int]
    error: Optional[str]

    class Config:
        from_attributes = True


class Measurement1mResponse(BaseModel):
    bucket: datetime
    probe_id: int
    target_id: int
    up_ratio: float
    rtt_p50: Optional[float]
    rtt_p95: Optional[float]
    rtt_avg: Optional[float]
    jitter_avg: Optional[float]
    loss_avg: Optional[float]
    http_5xx_rate: Optional[float]
    samples: int

    class Config:
        from_attributes = True
