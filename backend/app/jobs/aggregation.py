from datetime import datetime, timedelta
from sqlalchemy import func, and_
from sqlalchemy.orm import Session
from ..models import MeasurementRaw, Measurement1m
from ..core.database import SessionLocal
import logging

logger = logging.getLogger(__name__)


def aggregate_1m_measurements():
    """Aggregate raw measurements into 1-minute buckets"""
    db = SessionLocal()
    try:
        # Get the last bucket we aggregated
        last_bucket = db.query(func.max(Measurement1m.bucket)).scalar()

        # Start from last bucket or 1 hour ago
        if last_bucket:
            start_time = last_bucket
        else:
            start_time = datetime.utcnow() - timedelta(hours=1)

        # Aggregate up to current minute (complete minutes only)
        end_time = datetime.utcnow().replace(second=0, microsecond=0)

        if start_time >= end_time:
            return

        logger.info(f"Aggregating measurements from {start_time} to {end_time}")

        current_bucket = start_time
        while current_bucket < end_time:
            next_bucket = current_bucket + timedelta(minutes=1)

            # Get all probe-target combinations with measurements in this bucket
            combinations = db.query(
                MeasurementRaw.probe_id,
                MeasurementRaw.target_id
            ).filter(
                and_(
                    MeasurementRaw.timestamp >= current_bucket,
                    MeasurementRaw.timestamp < next_bucket
                )
            ).distinct().all()

            for probe_id, target_id in combinations:
                # Get measurements for this combination
                measurements = db.query(MeasurementRaw).filter(
                    and_(
                        MeasurementRaw.probe_id == probe_id,
                        MeasurementRaw.target_id == target_id,
                        MeasurementRaw.timestamp >= current_bucket,
                        MeasurementRaw.timestamp < next_bucket
                    )
                ).all()

                if not measurements:
                    continue

                # Calculate aggregates
                total_samples = len(measurements)
                up_count = sum(1 for m in measurements if m.up)
                up_ratio = up_count / total_samples

                # RTT metrics (only for successful measurements)
                rtt_values = [m.rtt_ms for m in measurements if m.rtt_ms is not None and m.up]
                rtt_p50 = None
                rtt_p95 = None
                rtt_avg = None
                if rtt_values:
                    rtt_values.sort()
                    rtt_avg = sum(rtt_values) / len(rtt_values)
                    rtt_p50 = rtt_values[int(len(rtt_values) * 0.5)]
                    rtt_p95 = rtt_values[int(len(rtt_values) * 0.95)]

                # Jitter
                jitter_values = [m.jitter_ms for m in measurements if m.jitter_ms is not None]
                jitter_avg = sum(jitter_values) / len(jitter_values) if jitter_values else None

                # Loss
                loss_values = [m.loss_pct for m in measurements if m.loss_pct is not None]
                loss_avg = sum(loss_values) / len(loss_values) if loss_values else None

                # HTTP 5xx rate
                http_codes = [m.http_code for m in measurements if m.http_code is not None]
                http_5xx_count = sum(1 for code in http_codes if 500 <= code < 600)
                http_5xx_rate = (http_5xx_count / len(http_codes) * 100) if http_codes else None

                # Check if aggregate already exists
                existing = db.query(Measurement1m).filter(
                    and_(
                        Measurement1m.bucket == current_bucket,
                        Measurement1m.probe_id == probe_id,
                        Measurement1m.target_id == target_id
                    )
                ).first()

                if existing:
                    # Update existing
                    existing.up_ratio = up_ratio
                    existing.rtt_p50 = rtt_p50
                    existing.rtt_p95 = rtt_p95
                    existing.rtt_avg = rtt_avg
                    existing.jitter_avg = jitter_avg
                    existing.loss_avg = loss_avg
                    existing.http_5xx_rate = http_5xx_rate
                    existing.samples = total_samples
                else:
                    # Create new aggregate
                    agg = Measurement1m(
                        bucket=current_bucket,
                        probe_id=probe_id,
                        target_id=target_id,
                        up_ratio=up_ratio,
                        rtt_p50=rtt_p50,
                        rtt_p95=rtt_p95,
                        rtt_avg=rtt_avg,
                        jitter_avg=jitter_avg,
                        loss_avg=loss_avg,
                        http_5xx_rate=http_5xx_rate,
                        samples=total_samples
                    )
                    db.add(agg)

            current_bucket = next_bucket

        db.commit()
        logger.info("Aggregation completed successfully")

    except Exception as e:
        logger.error(f"Error during aggregation: {e}")
        db.rollback()
    finally:
        db.close()
