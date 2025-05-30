# PyroGuard Sentinel Worker Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libgdal-dev \
    gdal-bin \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production

# Copy project files
COPY pyproject.toml .
COPY apps/ ./apps/
COPY scripts/ ./scripts/

# Install Python dependencies
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev

# Create cache directory with proper permissions
RUN mkdir -p /opt/pyroguard/data/cache && \
    chmod 755 /opt/pyroguard/data/cache

# Health check for worker
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import apps.worker.main; print('Worker healthy')" || exit 1

# Run the worker
CMD ["python", "-m", "apps.worker.main"] 