from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from ..core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "São Paulo - BR"
    code = Column(String, unique=True, nullable=False)  # e.g., "sp-br"
    created_at = Column(DateTime, default=datetime.utcnow)
