from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models import Location, User
from ...schemas.location import LocationCreate, LocationResponse

router = APIRouter()


@router.get("", response_model=List[LocationResponse])
def list_locations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Location).all()


@router.post("", response_model=LocationResponse)
def create_location(
    location: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_location = Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location
