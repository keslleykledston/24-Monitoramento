from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime
from ...core.database import get_db
from ...core.auth import verify_probe_token
from ...core.redis_client import publish_measurement
from ...models import MeasurementRaw, Probe
from ...schemas.measurement import MeasurementCreate

router = APIRouter()


@router.post("")
def create_measurement(
    measurement: MeasurementCreate,
    db: Session = Depends(get_db),
    token: str = Depends(verify_probe_token)
):
    """Ingest measurement from probe"""

    # Update probe last_seen
    probe = db.query(Probe).filter(Probe.id == measurement.probe_id).first()
    if probe:
        probe.last_seen = datetime.utcnow()

    # Save raw measurement
    db_measurement = MeasurementRaw(
        timestamp=datetime.utcnow(),
        **measurement.dict()
    )
    db.add(db_measurement)
    db.commit()
    db.refresh(db_measurement)

    # Publish to Redis for WebSocket broadcast
    publish_measurement({
        "type": "measurement",
        "target_id": measurement.target_id,
        "probe_id": measurement.probe_id,
        "location_id": probe.location_id if probe else None,
        "up": measurement.up,
        "rtt_ms": measurement.rtt_ms,
        "jitter_ms": measurement.jitter_ms,
        "loss_pct": measurement.loss_pct,
        "http_code": measurement.http_code,
        "timestamp": db_measurement.timestamp.isoformat()
    })

    return {"status": "ok", "id": db_measurement.id}
