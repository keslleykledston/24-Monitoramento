from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import logging

from .core.config import settings
from .core.database import engine, SessionLocal
from .core.websocket import websocket_handler
from .models import Base
from .services.seed import seed_database
from .jobs.aggregation import aggregate_1m_measurements
from .jobs.cleanup import cleanup_old_measurements
from .jobs.alert_evaluator import evaluate_alerts

from .api.v1 import auth, locations, probes, targets, alert_rules, incidents, measurements, probes_targets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Scheduler
scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting application...")

    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    # Seed data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start scheduler jobs
    scheduler.add_job(aggregate_1m_measurements, 'interval', minutes=1, id='aggregate_1m')
    scheduler.add_job(cleanup_old_measurements, 'interval', hours=1, id='cleanup')
    scheduler.add_job(evaluate_alerts, 'interval', seconds=10, id='evaluate_alerts')
    scheduler.start()
    logger.info("Scheduler started with jobs")

    yield

    # Shutdown
    scheduler.shutdown()
    logger.info("Application shutdown")


app = FastAPI(
    title="Multi-Location Monitoring API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# WebSocket endpoint
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_handler(websocket)

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["locations"])
app.include_router(probes.router, prefix="/api/v1/probes", tags=["probes"])
app.include_router(targets.router, prefix="/api/v1/targets", tags=["targets"])
app.include_router(alert_rules.router, prefix="/api/v1/alert-rules", tags=["alert-rules"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["incidents"])
app.include_router(measurements.router, prefix="/api/v1/measurements", tags=["measurements"])
app.include_router(probes_targets.router, prefix="/api/v1", tags=["probes"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
