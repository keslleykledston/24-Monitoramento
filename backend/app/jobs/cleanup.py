from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models import MeasurementRaw, Measurement1m
from ..core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


def cleanup_old_measurements():
    """Clean up old measurements based on retention policy"""
    db = SessionLocal()
    try:
        # Delete raw measurements older than 6 hours
        raw_cutoff = datetime.utcnow() - timedelta(hours=6)
        deleted_raw = db.query(MeasurementRaw).filter(
            MeasurementRaw.timestamp < raw_cutoff
        ).delete()

        # Delete 1m aggregates older than 7 days
        agg_cutoff = datetime.utcnow() - timedelta(days=7)
        deleted_agg = db.query(Measurement1m).filter(
            Measurement1m.bucket < agg_cutoff
        ).delete()

        db.commit()
        logger.info(f"Cleanup: deleted {deleted_raw} raw measurements, {deleted_agg} aggregates")

    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()
