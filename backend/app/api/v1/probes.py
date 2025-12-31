from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models import Probe, User, Target
from ...schemas.probe import ProbeCreate, ProbeResponse
from ...schemas.target import TargetResponse

router = APIRouter()


@router.get("", response_model=List[ProbeResponse])
def list_probes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Probe).all()


@router.post("", response_model=ProbeResponse)
def create_probe(
    probe: ProbeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_probe = Probe(**probe.dict())
    db.add(db_probe)
    db.commit()
    db.refresh(db_probe)
    return db_probe


@router.get("/{probe_id}/targets", response_model=List[TargetResponse])
def get_probe_targets(
    probe_id: int,
    db: Session = Depends(get_db),
    x_probe_token: Optional[str] = Header(None)
):
    """Get active targets for a specific probe (authenticated by probe token)"""
    # Verify probe exists and token matches
    probe = db.query(Probe).filter(Probe.id == probe_id).first()
    if not probe:
        raise HTTPException(status_code=404, detail="Probe not found")

    if x_probe_token != probe.token:
        raise HTTPException(status_code=403, detail="Invalid probe token")

    # Return all active targets
    targets = db.query(Target).filter(Target.is_active == True).all()
    return targets
