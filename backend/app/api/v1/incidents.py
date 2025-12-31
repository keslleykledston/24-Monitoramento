from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models import Incident, User
from ...models.incident import IncidentStatus, IncidentSeverity
from ...schemas.incident import IncidentResponse, IncidentAck

router = APIRouter()


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    status: Optional[IncidentStatus] = None,
    severity: Optional[IncidentSeverity] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident)

    if status:
        query = query.filter(Incident.status == status)
    if severity:
        query = query.filter(Incident.severity == severity)

    incidents = query.order_by(desc(Incident.started_at)).limit(limit).all()
    return incidents


@router.post("/{incident_id}/ack", response_model=IncidentResponse)
def acknowledge_incident(
    incident_id: int,
    ack: IncidentAck,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = IncidentStatus.ACKED
    incident.acked_at = datetime.utcnow()
    incident.acked_by = ack.acked_by

    db.commit()
    db.refresh(incident)
    return incident
