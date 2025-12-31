from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Index
from datetime import datetime
from ..core.database import Base


class MeasurementRaw(Base):
    """Raw measurements at 1s interval - retained for 6 hours"""
    __tablename__ = "measurements_raw"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    probe_id = Column(Integer, ForeignKey("probes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)

    # Status
    up = Column(Boolean, nullable=False)

    # Metrics
    rtt_ms = Column(Float, nullable=True)
    jitter_ms = Column(Float, nullable=True)
    loss_pct = Column(Float, nullable=True)
    http_code = Column(Integer, nullable=True)
    error = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_raw_probe_target_ts", "probe_id", "target_id", "timestamp"),
    )


class Measurement1m(Base):
    """Aggregated measurements at 1 minute interval - retained for 7 days"""
    __tablename__ = "measurements_1m"

    id = Column(Integer, primary_key=True, index=True)
    bucket = Column(DateTime, nullable=False, index=True)  # Time bucket (1 minute)
    probe_id = Column(Integer, ForeignKey("probes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("targets.id"), nullable=False)

    # Aggregated metrics
    up_ratio = Column(Float, nullable=False)  # % of time up
    rtt_p50 = Column(Float, nullable=True)  # Median latency
    rtt_p95 = Column(Float, nullable=True)  # 95th percentile latency
    rtt_avg = Column(Float, nullable=True)  # Average latency
    jitter_avg = Column(Float, nullable=True)  # Average jitter
    loss_avg = Column(Float, nullable=True)  # Average loss %
    http_5xx_rate = Column(Float, nullable=True)  # % of 5xx responses
    samples = Column(Integer, nullable=False)  # Number of samples aggregated

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_1m_probe_target_bucket", "probe_id", "target_id", "bucket", unique=True),
    )
