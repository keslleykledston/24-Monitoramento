from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SQLEnum
from datetime import datetime
from ..core.database import Base
import enum


class Severity(str, enum.Enum):
    MAJOR = "major"
    CRITICAL = "critical"


class RuleType(str, enum.Enum):
    DOWN = "down"
    LOSS = "loss"
    RTT_P95 = "rtt_p95"
    JITTER = "jitter"
    HTTP_5XX = "http_5xx"


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    rule_type = Column(SQLEnum(RuleType), nullable=False)
    severity = Column(SQLEnum(Severity), nullable=False)
    threshold = Column(Float, nullable=True)  # For numeric rules
    consecutive_failures = Column(Integer, nullable=True)  # For DOWN rule
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
