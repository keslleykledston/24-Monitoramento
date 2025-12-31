import redis
import json
from .config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def publish_measurement(data: dict):
    """Publish measurement to Redis for WebSocket broadcast"""
    redis_client.publish("measurements", json.dumps(data))


def get_redis():
    return redis_client
