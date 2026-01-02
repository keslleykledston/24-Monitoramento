#!/usr/bin/env python3
"""
Multi-location monitoring probe
Performs HTTP/HTTPS and ICMP checks every 1 second
"""

import os
import time
import logging
import subprocess
import statistics
from datetime import datetime
from typing import Optional, Dict, Any
import httpx
import sys
from urllib.parse import urlparse

# Configuration from environment
API_URL = os.getenv("API_URL", "http://api:8000")
PROBE_ID = int(os.getenv("PROBE_ID", "1"))
LOCATION_ID = int(os.getenv("LOCATION_ID", "1"))
PROBE_TOKEN = os.getenv("PROBE_TOKEN", "")
CHECK_INTERVAL = float(os.getenv("CHECK_INTERVAL", "1.0"))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# HTTP client
http_client = httpx.Client(timeout=10.0, follow_redirects=True)


def get_targets() -> list:
    """Fetch active targets from API"""
    try:
        response = http_client.get(
            f"{API_URL}/api/v1/probes/{PROBE_ID}/targets",
            headers={"X-Probe-Token": PROBE_TOKEN}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch targets: {e}")
        return []


def normalize_http_url(url: str) -> str:
    if url.startswith(("http://", "https://")):
        return url
    return f"https://{url}"


def extract_host(value: str) -> str:
    if not value:
        return ""
    if "://" in value:
        parsed = urlparse(value)
        if parsed.hostname:
            return parsed.hostname
    return value.split("/")[0]


def ping_check(address: str, count: int = 5) -> Optional[Dict[str, Any]]:
    """Perform ICMP ping check"""
    try:
        hostname = extract_host(address)
        if not hostname:
            return {"up": False, "rtt_ms": None, "loss": 100.0}

        result = subprocess.run(
            ["ping", "-c", str(count), "-W", "1", hostname],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            # Parse ping output for RTT stats
            lines = result.stdout.split("\n")
            for line in lines:
                if "min/avg/max" in line or "round-trip" in line:
                    # Extract avg RTT
                    parts = line.split("=")[-1].strip().split("/")
                    if len(parts) >= 2:
                        return {
                            "up": True,
                            "rtt_ms": float(parts[1]),
                            "loss": 0.0
                        }

        return {"up": False, "rtt_ms": None, "loss": 100.0}
    except Exception as e:
        logger.error(f"Ping check failed for {address}: {e}")
        return {"up": False, "rtt_ms": None, "loss": 100.0}


def http_check(url: str) -> Dict[str, Any]:
    """Perform HTTP/HTTPS check"""
    try:
        url = normalize_http_url(url)
        start = time.time()
        response = http_client.get(url)
        rtt_ms = (time.time() - start) * 1000

        return {
            "up": response.status_code < 500,
            "rtt_ms": round(rtt_ms, 2),
            "status_code": response.status_code,
            "loss": 0.0 if response.status_code < 500 else 100.0
        }
    except Exception as e:
        logger.error(f"HTTP check failed for {url}: {e}")
        return {
            "up": False,
            "rtt_ms": None,
            "status_code": None,
            "loss": 100.0
        }


def send_measurement(target_id: int, result: Dict[str, Any], measurement_type: str = "icmp"):
    """Send measurement to API"""
    try:
        payload = {
            "probe_id": PROBE_ID,
            "location_id": LOCATION_ID,
            "target_id": target_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "up": result["up"],
            "measurement_type": measurement_type,
            "rtt_ms": result["rtt_ms"],
            "http_status_code": result.get("status_code"),
            "packet_loss": result.get("loss", 0.0)
        }

        response = http_client.post(
            f"{API_URL}/api/v1/measurements",
            json=payload,
            headers={"X-Probe-Token": PROBE_TOKEN}
        )
        response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send measurement: {e}")


def main():
    """Main probe loop"""
    logger.info(f"Starting probe (ID={PROBE_ID}, Location={LOCATION_ID})")
    logger.info(f"API URL: {API_URL}")
    logger.info(f"Check interval: {CHECK_INTERVAL}s")

    # Wait for API to be ready
    for i in range(30):
        try:
            response = http_client.get(f"{API_URL}/health")
            if response.status_code == 200:
                logger.info("API is ready")
                break
        except:
            pass
        logger.info(f"Waiting for API... ({i+1}/30)")
        time.sleep(2)

    targets_cache = []
    targets_refresh_counter = 0

    while True:
        try:
            # Refresh targets every 60 iterations (60 seconds)
            if targets_refresh_counter % 60 == 0:
                targets_cache = get_targets()
                logger.info(f"Loaded {len(targets_cache)} targets")
            targets_refresh_counter += 1

            # Check each target
            for target in targets_cache:
                target_id = target["id"]
                url = target.get("url", "")
                ip_address = target.get("ip_address") or target.get("ip")
                target_type = target.get("type", "https")

                if target_type in ["http", "https"]:
                    # For HTTP/HTTPS targets, do BOTH checks
                    # 1. HTTP check for application monitoring
                    http_result = http_check(url)
                    send_measurement(target_id, http_result, "http")
                    logger.debug(f"HTTP checked {url}: UP={http_result['up']}, RTT={http_result['rtt_ms']}ms")

                    # 2. ICMP ping check for network latency monitoring
                    ping_result = ping_check(ip_address or url or target.get("name", ""))
                    send_measurement(target_id, ping_result, "icmp")
                    logger.debug(f"PING checked {url}: UP={ping_result['up']}, RTT={ping_result['rtt_ms']}ms")
                else:  # ping only
                    # For PING targets, only do ICMP ping
                    result = ping_check(ip_address or url or target.get("name", ""))
                    send_measurement(target_id, result, "icmp")
                    logger.debug(f"PING checked {url}: UP={result['up']}, RTT={result['rtt_ms']}ms")

            # Sleep until next interval
            time.sleep(CHECK_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Shutting down...")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main()
