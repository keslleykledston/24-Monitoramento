from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models import Target, User, MeasurementRaw, Measurement1m, MeasurementType
from ...schemas.target import TargetCreate, TargetResponse
from ...schemas.measurement import MeasurementRawResponse, Measurement1mResponse

router = APIRouter()


@router.get("", response_model=List[TargetResponse])
def list_targets(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List targets. Set active_only=true to get only active targets."""
    query = db.query(Target)
    if active_only:
        query = query.filter(Target.is_active == True)
    return query.all()


@router.post("", response_model=TargetResponse)
def create_target(
    target: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_target = Target(**target.dict())
    db.add(db_target)
    db.commit()
    db.refresh(db_target)
    return db_target


@router.get("/{target_id}/live")
def get_target_live_data(
    target_id: int,
    window: int = 15,  # minutes
    measurement_type: Optional[str] = Query(None, description="Filter by measurement type: http or icmp"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get live data for target (last N minutes of raw measurements)"""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    cutoff = datetime.utcnow() - timedelta(minutes=window)

    # Build query with optional measurement_type filter
    query = db.query(MeasurementRaw).filter(
        and_(
            MeasurementRaw.target_id == target_id,
            MeasurementRaw.timestamp >= cutoff
        )
    )

    if measurement_type:
        query = query.filter(MeasurementRaw.measurement_type == measurement_type)

    measurements = query.order_by(desc(MeasurementRaw.timestamp)).limit(1000).all()

    return {
        "target": TargetResponse.from_orm(target),
        "measurements": [MeasurementRawResponse.from_orm(m) for m in measurements]
    }


@router.get("/{target_id}/history")
def get_target_history(
    target_id: int,
    range_days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get historical aggregated data for target"""
    target = db.query(Target).filter(Target.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    cutoff = datetime.utcnow() - timedelta(days=range_days)

    aggregates = db.query(Measurement1m).filter(
        and_(
            Measurement1m.target_id == target_id,
            Measurement1m.bucket >= cutoff
        )
    ).order_by(Measurement1m.bucket).all()

    return {
        "target": TargetResponse.from_orm(target),
        "aggregates": [Measurement1mResponse.from_orm(a) for a in aggregates]
    }


@router.put("/{target_id}", response_model=TargetResponse)
def update_target(
    target_id: int,
    target: TargetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update target"""
    db_target = db.query(Target).filter(Target.id == target_id).first()
    if not db_target:
        raise HTTPException(status_code=404, detail="Target not found")

    for key, value in target.dict().items():
        setattr(db_target, key, value)

    db.commit()
    db.refresh(db_target)
    return db_target


@router.delete("/{target_id}")
def delete_target(
    target_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete target (soft delete by setting is_active=False)"""
    db_target = db.query(Target).filter(Target.id == target_id).first()
    if not db_target:
        raise HTTPException(status_code=404, detail="Target not found")

    db_target.is_active = False
    db.commit()
    return {"message": "Target deleted successfully"}
