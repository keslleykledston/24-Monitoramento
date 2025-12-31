from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum, JSON
from datetime import datetime
from ..core.database import Base
import enum


class IncidentStatus(str, enum.Enum):
    OPEN = "open"
    ACKED = "acked"
    RESOLVED = "resolved"


class IncidentSeverity(str, enum.Enum):
    MAJOR = "major"
    CRITICAL = "critical"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)
    probe_id = Column(Integer, ForeignKey("probes.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)

    severity = Column(SQLEnum(IncidentSeverity), nullable=False)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.OPEN)

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    evidence = Column(JSON, nullable=True)  # Last metric values

    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    acked_at = Column(DateTime, nullable=True)
    acked_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
