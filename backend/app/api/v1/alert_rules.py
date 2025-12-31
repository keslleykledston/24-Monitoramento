from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ...core.database import get_db
from ...core.auth import get_current_user
from ...models import AlertRule, User
from ...schemas.alert_rule import AlertRuleCreate, AlertRuleResponse

router = APIRouter()


@router.get("", response_model=List[AlertRuleResponse])
def list_alert_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AlertRule).all()


@router.post("", response_model=AlertRuleResponse)
def create_alert_rule(
    rule: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_rule = AlertRule(**rule.dict())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule
