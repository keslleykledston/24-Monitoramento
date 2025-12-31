from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...core.auth import verify_probe_token
from ...models import Target
from ...schemas.target import TargetResponse

router = APIRouter()


@router.get("/probe/targets", response_model=List[TargetResponse])
def list_targets_for_probe(
    db: Session = Depends(get_db),
    token: str = Depends(verify_probe_token)
):
    """Get list of active targets for probes"""
    return db.query(Target).filter(Target.is_active == True).all()
