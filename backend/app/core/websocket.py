from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Set
import json
import asyncio
import redis.asyncio as aioredis
from .config import settings

# Active WebSocket connections
active_connections: Set[WebSocket] = set()


async def websocket_handler(websocket: WebSocket):
    """Handle WebSocket connection and subscribe to Redis pub/sub"""
    await websocket.accept()
    active_connections.add(websocket)

    # Create async Redis client for pub/sub
    redis_client = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis_client.pubsub()

    try:
        # Subscribe to measurements channel
        await pubsub.subscribe("measurements")

        # Listen for messages
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                # Broadcast to this websocket
                try:
                    await websocket.send_text(data)
                except:
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        active_connections.discard(websocket)
        await pubsub.unsubscribe("measurements")
        await pubsub.close()
        await redis_client.close()


async def broadcast_to_all(message: dict):
    """Broadcast message to all connected websockets"""
    if not active_connections:
        return

    message_text = json.dumps(message)
    disconnected = set()

    for connection in active_connections:
        try:
            await connection.send_text(message_text)
        except:
            disconnected.add(connection)

    # Remove disconnected clients
    active_connections.difference_update(disconnected)
