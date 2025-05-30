import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import utilities for health checks
from apps.shared.utils.clarifai_ndvi import test_clarifai_connection
from apps.shared.utils.satellite_client import test_s3_connection
from apps.shared.utils.weather_client import test_noaa_connection
from apps.shared.utils.overpass_client import test_overpass_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 PyroGuard Sentinel API starting up...")
    
    # Startup checks
    logger.info("🔍 Testing external service connections...")
    
    yield
    
    logger.info("🛑 PyroGuard Sentinel API shutting down...")


# Create FastAPI app
app = FastAPI(
    title="PyroGuard Sentinel API",
    description="AI-powered wildfire risk assessment system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://*.amplifyapp.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "PyroGuard Sentinel API",
        "version": "1.0.0",
        "description": "AI-powered wildfire risk assessment system",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": "2025-01-30T11:35:00Z",
            "services": {},
            "environment": {
                "python_version": "3.11+",
                "region": os.getenv("AWS_REGION", "us-west-2")
            }
        }
        
        # Test AWS S3 connection
        try:
            s3_healthy = test_s3_connection()
            health_status["services"]["aws_s3"] = "healthy" if s3_healthy else "degraded"
        except Exception as e:
            health_status["services"]["aws_s3"] = f"error: {str(e)[:50]}"
        
        # Test Clarifai connection
        try:
            clarifai_healthy = test_clarifai_connection()
            health_status["services"]["clarifai"] = "healthy" if clarifai_healthy else "degraded"
        except Exception as e:
            health_status["services"]["clarifai"] = f"error: {str(e)[:50]}"
        
        # Test NOAA connection
        try:
            noaa_healthy = test_noaa_connection()
            health_status["services"]["noaa"] = "healthy" if noaa_healthy else "degraded"
        except Exception as e:
            health_status["services"]["noaa"] = f"error: {str(e)[:50]}"
        
        # Test Overpass connection
        try:
            overpass_healthy = test_overpass_connection()
            health_status["services"]["overpass"] = "healthy" if overpass_healthy else "degraded"
        except Exception as e:
            health_status["services"]["overpass"] = f"error: {str(e)[:50]}"
        
        # Check critical environment variables
        critical_env_vars = [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY", 
            "CLARIFAI_PAT",
            "INNGEST_EVENT_KEY"
        ]
        
        missing_vars = [var for var in critical_env_vars if not os.getenv(var)]
        if missing_vars:
            health_status["status"] = "degraded"
            health_status["missing_env_vars"] = missing_vars
        
        # Determine overall status
        service_statuses = list(health_status["services"].values())
        if any("error" in status for status in service_statuses):
            health_status["status"] = "degraded"
        
        return health_status
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": "2025-01-30T11:35:00Z"
            }
        )


# Import and include routers
from .routers.analyze import router as analyze_router
app.include_router(analyze_router, prefix="/api/v1", tags=["analysis"])


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8080,
        reload=True,
        log_level="info"
    ) 