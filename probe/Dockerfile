FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (including ping)
RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy probe script
COPY probe.py .

# Create non-root user
RUN useradd -m -u 1000 probeuser && chown -R probeuser:probeuser /app
USER probeuser

# Run probe
CMD ["python", "-u", "probe.py"]
