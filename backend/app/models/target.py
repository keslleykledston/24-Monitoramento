from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from datetime import datetime
from ..core.database import Base
import enum


class TargetType(str, enum.Enum):
    HTTP = "http"
    HTTPS = "https"
    PING = "ping"


class Target(Base):
    __tablename__ = "targets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    type = Column(SQLEnum(TargetType), default=TargetType.HTTPS)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
