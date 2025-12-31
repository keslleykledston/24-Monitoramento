from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from datetime import datetime
from ..core.database import Base


class Probe(Base):
    __tablename__ = "probes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
