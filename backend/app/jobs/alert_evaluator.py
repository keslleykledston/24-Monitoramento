from datetime import datetime, timedelta
from sqlalchemy import and_, desc
from sqlalchemy.orm import Session
from ..models import (
    MeasurementRaw, Measurement1m, AlertRule, Incident, Target, Probe, Location
)
from ..models.alert_rule import RuleType, Severity
from ..models.incident import IncidentStatus, IncidentSeverity
from ..core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


def evaluate_alerts():
    """Evaluate alert rules and create incidents"""
    db = SessionLocal()
    try:
        # Get all active alert rules
        rules = db.query(AlertRule).filter(AlertRule.is_active == True).all()

        for rule in rules:
            if rule.rule_type == RuleType.DOWN:
                evaluate_down_rule(db, rule)
            elif rule.rule_type == RuleType.LOSS:
                evaluate_loss_rule(db, rule)
            elif rule.rule_type == RuleType.RTT_P95:
                evaluate_rtt_rule(db, rule)
            elif rule.rule_type == RuleType.JITTER:
                evaluate_jitter_rule(db, rule)
            elif rule.rule_type == RuleType.HTTP_5XX:
                evaluate_http5xx_rule(db, rule)

        # Auto-resolve incidents that are no longer triggered
        auto_resolve_incidents(db)

    except Exception as e:
        logger.error(f"Error during alert evaluation: {e}")
        db.rollback()
    finally:
        db.close()


def evaluate_down_rule(db: Session, rule: AlertRule):
    """Evaluate DOWN rule: 3 consecutive failures"""
    consecutive = rule.consecutive_failures or 3
    cutoff = datetime.utcnow() - timedelta(seconds=consecutive)

    # Get all probe-target combinations
    combinations = db.query(
        MeasurementRaw.probe_id,
        MeasurementRaw.target_id
    ).filter(
        MeasurementRaw.timestamp >= cutoff
    ).distinct().all()

    for probe_id, target_id in combinations:
        # Get last N measurements
        recent = db.query(MeasurementRaw).filter(
            and_(
                MeasurementRaw.probe_id == probe_id,
                MeasurementRaw.target_id == target_id,
                MeasurementRaw.timestamp >= cutoff
            )
        ).order_by(desc(MeasurementRaw.timestamp)).limit(consecutive).all()

        if len(recent) == consecutive and all(not m.up for m in recent):
            # All down - create incident if not exists
            create_or_update_incident(
                db, target_id, probe_id, rule,
                f"Target DOWN - {consecutive} consecutive failures",
                IncidentSeverity.CRITICAL,
                {"last_measurements": [{"ts": m.timestamp.isoformat(), "error": m.error} for m in recent[:3]]}
            )


def evaluate_loss_rule(db: Session, rule: AlertRule):
    """Evaluate packet loss rule"""
    cutoff = datetime.utcnow() - timedelta(minutes=2)

    # Check latest 1m aggregates
    aggregates = db.query(Measurement1m).filter(
        Measurement1m.bucket >= cutoff
    ).all()

    for agg in aggregates:
        if agg.loss_avg is not None and agg.loss_avg >= rule.threshold:
            severity = IncidentSeverity.CRITICAL if rule.threshold >= 5.0 else IncidentSeverity.MAJOR
            create_or_update_incident(
                db, agg.target_id, agg.probe_id, rule,
                f"High packet loss: {agg.loss_avg:.1f}%",
                severity,
                {"loss_avg": agg.loss_avg, "bucket": agg.bucket.isoformat()}
            )


def evaluate_rtt_rule(db: Session, rule: AlertRule):
    """Evaluate RTT P95 rule"""
    cutoff = datetime.utcnow() - timedelta(minutes=2)

    aggregates = db.query(Measurement1m).filter(
        Measurement1m.bucket >= cutoff
    ).all()

    for agg in aggregates:
        if agg.rtt_p95 is not None and agg.rtt_p95 > rule.threshold:
            create_or_update_incident(
                db, agg.target_id, agg.probe_id, rule,
                f"High latency P95: {agg.rtt_p95:.1f}ms",
                IncidentSeverity.MAJOR,
                {"rtt_p95": agg.rtt_p95, "bucket": agg.bucket.isoformat()}
            )


def evaluate_jitter_rule(db: Session, rule: AlertRule):
    """Evaluate jitter rule"""
    cutoff = datetime.utcnow() - timedelta(minutes=2)

    aggregates = db.query(Measurement1m).filter(
        Measurement1m.bucket >= cutoff
    ).all()

    for agg in aggregates:
        if agg.jitter_avg is not None and agg.jitter_avg > rule.threshold:
            create_or_update_incident(
                db, agg.target_id, agg.probe_id, rule,
                f"High jitter: {agg.jitter_avg:.1f}ms",
                IncidentSeverity.MAJOR,
                {"jitter_avg": agg.jitter_avg, "bucket": agg.bucket.isoformat()}
            )


def evaluate_http5xx_rule(db: Session, rule: AlertRule):
    """Evaluate HTTP 5xx rate rule"""
    cutoff = datetime.utcnow() - timedelta(minutes=2)

    aggregates = db.query(Measurement1m).filter(
        Measurement1m.bucket >= cutoff
    ).all()

    for agg in aggregates:
        if agg.http_5xx_rate is not None and agg.http_5xx_rate > rule.threshold:
            create_or_update_incident(
                db, agg.target_id, agg.probe_id, rule,
                f"High 5xx rate: {agg.http_5xx_rate:.1f}%",
                IncidentSeverity.MAJOR,
                {"http_5xx_rate": agg.http_5xx_rate, "bucket": agg.bucket.isoformat()}
            )


def create_or_update_incident(
    db: Session,
    target_id: int,
    probe_id: int,
    rule: AlertRule,
    title: str,
    severity: IncidentSeverity,
    evidence: dict
):
    """Create incident or update existing open incident"""
    probe = db.query(Probe).filter(Probe.id == probe_id).first()
    if not probe:
        return

    # Check if there's already an open incident for this combination
    existing = db.query(Incident).filter(
        and_(
            Incident.target_id == target_id,
            Incident.probe_id == probe_id,
            Incident.alert_rule_id == rule.id,
            Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKED])
        )
    ).first()

    if existing:
        # Update evidence with latest data
        existing.evidence = evidence
        existing.severity = severity
    else:
        # Create new incident
        incident = Incident(
            target_id=target_id,
            probe_id=probe_id,
            location_id=probe.location_id,
            alert_rule_id=rule.id,
            severity=severity,
            status=IncidentStatus.OPEN,
            title=title,
            description=f"Alert rule '{rule.name}' triggered",
            evidence=evidence
        )
        db.add(incident)
        logger.info(f"Created incident: {title} for target {target_id}, probe {probe_id}")

    db.commit()


def auto_resolve_incidents(db: Session):
    """Auto-resolve incidents that are no longer triggered"""
    cutoff = datetime.utcnow() - timedelta(minutes=5)

    # Get all open/acked incidents
    open_incidents = db.query(Incident).filter(
        Incident.status.in_([IncidentStatus.OPEN, IncidentStatus.ACKED])
    ).all()

    for incident in open_incidents:
        # Check if issue is resolved
        recent = db.query(MeasurementRaw).filter(
            and_(
                MeasurementRaw.probe_id == incident.probe_id,
                MeasurementRaw.target_id == incident.target_id,
                MeasurementRaw.timestamp >= cutoff
            )
        ).order_by(desc(MeasurementRaw.timestamp)).limit(5).all()

        if recent and all(m.up for m in recent):
            incident.status = IncidentStatus.RESOLVED
            incident.resolved_at = datetime.utcnow()
            logger.info(f"Auto-resolved incident {incident.id}")

    db.commit()
