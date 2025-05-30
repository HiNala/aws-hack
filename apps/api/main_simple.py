import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    logging.info("✅ Environment variables loaded from .env file")
except ImportError:
    logging.warning("⚠️ python-dotenv not installed, using system environment variables")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import utilities for health checks
from apps.shared.utils.satellite_client import test_s3_connection
from apps.shared.utils.satellite_analysis import test_satellite_analysis_systems
from apps.shared.utils.weather_client import test_noaa_connection
from apps.shared.utils.overpass_client import test_overpass_connection
from apps.shared.utils.make_webhook import test_make_webhook

# Import the analysis router
from apps.api.routers.analyze import router as analyze_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("🚀 PyroGuard Sentinel API starting up...")
    
    # Startup health checks for all sponsor integrations
    logger.info("🔍 Testing sponsor tool integrations...")
    
    # Test Clarifai + Anthropic satellite analysis
    satellite_status = await test_satellite_analysis_systems()
    if satellite_status.get("clarifai", {}).get("status") == "configured":
        logger.info("✅ Clarifai satellite analysis ready")
    else:
        logger.warning(f"⚠️ Clarifai: {satellite_status.get('clarifai', {}).get('error', 'Unknown issue')}")
    
    if satellite_status.get("anthropic", {}).get("status") == "healthy":
        logger.info("✅ Anthropic Vision API ready")
    else:
        logger.warning(f"⚠️ Anthropic: {satellite_status.get('anthropic', {}).get('error', 'Unknown issue')}")
    
    # Test NOAA Weather Service
    noaa_status = await test_noaa_connection()
    if noaa_status:
        logger.info("✅ NOAA Weather Service ready")
    else:
        logger.warning("⚠️ NOAA Weather Service connection issues")
    
    # Test Make.com webhook
    make_status = await test_make_webhook()
    if make_status.get("status") == "healthy":
        logger.info("✅ Make.com webhook integration ready")
    else:
        logger.warning(f"⚠️ Make.com webhook: {make_status.get('error', 'Unknown issue')}")
    
    # Test AWS S3 for satellite imagery
    try:
        s3_status = test_s3_connection()
        if s3_status:
            logger.info("✅ AWS S3 satellite imagery access ready")
        else:
            logger.warning("⚠️ AWS S3 connection issues")
    except Exception as e:
        logger.warning(f"⚠️ AWS S3: {str(e)}")
    
    # Test OpenStreetMap Overpass API
    try:
        overpass_status = test_overpass_connection()
        if overpass_status:
            logger.info("✅ OpenStreetMap Overpass API ready")
        else:
            logger.warning("⚠️ OpenStreetMap Overpass API connection issues")
    except Exception as e:
        logger.warning(f"⚠️ Overpass API: {str(e)}")
    
    logger.info("🌟 PyroGuard Sentinel ready for wildfire risk assessment!")
    
    yield
    
    logger.info("🛑 PyroGuard Sentinel API shutting down...")


# Create FastAPI app
app = FastAPI(
    title="PyroGuard Sentinel API",
    description="AI-powered wildfire risk assessment system for Hawaiian Islands with sponsor tool integrations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://*.amplifyapp.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze_router, prefix="/api/v1", tags=["analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "PyroGuard Sentinel API",
        "version": "1.0.0", 
        "description": "AI-powered wildfire risk assessment system for Hawaiian Islands",
        "status": "operational",
        "mode": "production",
        "sponsor_integrations": {
            "satellite_analysis": "Clarifai + Anthropic Vision API",
            "weather_service": "NOAA Weather Service", 
            "power_infrastructure": "OpenStreetMap Overpass API",
            "satellite_imagery": "AWS S3 Sentinel-2",
            "incident_automation": "Make.com → Jira",
            "job_orchestration": "Inngest"
        },
        "features": [
            "Real-time wildfire risk analysis with AI reasoning",
            "7-phase comprehensive analysis pipeline",
            "Hawaiian Islands full coverage",
            "Multi-source environmental data integration",
            "Automated incident response workflows",
            "Server-sent events for real-time progress tracking",
            "Demo mode with cached responses"
        ],
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "analysis": "/api/v1/analyze",
            "demo_locations": "/api/v1/demo-locations",
            "system_status": "/api/v1/system-status"
        }
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint for all sponsor integrations"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": "2025-01-30T12:00:00Z",
            "services": {},
            "environment": {
                "python_version": "3.11+",
                "region": os.getenv("AWS_REGION", "us-west-2"),
                "mode": "production"
            },
            "features": {
                "analysis_pipeline": "operational",
                "real_time_progress": "operational",
                "sponsor_integrations": "operational",
                "hawaii_coverage": "full"
            }
        }
        
        # Test Clarifai + Anthropic satellite analysis
        try:
            satellite_status = await test_satellite_analysis_systems()
            health_status["services"]["clarifai"] = satellite_status.get("clarifai", {}).get("status", "unknown")
            health_status["services"]["anthropic"] = satellite_status.get("anthropic", {}).get("status", "unknown")
        except Exception as e:
            health_status["services"]["clarifai"] = f"error: {str(e)[:50]}"
            health_status["services"]["anthropic"] = f"error: {str(e)[:50]}"
        
        # Test AWS S3 connection
        try:
            s3_healthy = test_s3_connection()
            health_status["services"]["aws_s3"] = "healthy" if s3_healthy else "degraded"
        except Exception as e:
            health_status["services"]["aws_s3"] = f"error: {str(e)[:50]}"
        
        # Test NOAA Weather Service
        try:
            noaa_healthy = await test_noaa_connection()
            health_status["services"]["noaa_weather"] = "healthy" if noaa_healthy else "degraded"
        except Exception as e:
            health_status["services"]["noaa_weather"] = f"error: {str(e)[:50]}"
        
        # Test OpenStreetMap Overpass API
        try:
            overpass_healthy = test_overpass_connection()
            health_status["services"]["overpass_api"] = "healthy" if overpass_healthy else "degraded"
        except Exception as e:
            health_status["services"]["overpass_api"] = f"error: {str(e)[:50]}"
        
        # Test Make.com webhook
        try:
            make_status = await test_make_webhook()
            health_status["services"]["make_webhook"] = make_status.get("status", "unknown")
        except Exception as e:
            health_status["services"]["make_webhook"] = f"error: {str(e)[:50]}"
        
        # Check critical environment variables
        critical_env_vars = [
            "AWS_ACCESS_KEY_ID",
            "AWS_SECRET_ACCESS_KEY",
            "ANTHROPIC_API_KEY",
            "CLARIFAI_PAT",
            "MAKE_WEBHOOK_URL"
        ]
        
        missing_vars = [var for var in critical_env_vars if not os.getenv(var)]
        if missing_vars:
            health_status["status"] = "degraded"
            health_status["missing_env_vars"] = missing_vars
        
        # Determine overall status
        service_statuses = list(health_status["services"].values())
        if any("error" in str(status) for status in service_statuses):
            health_status["status"] = "degraded"
        
        # Add sponsor integration summary
        health_status["sponsor_integration_summary"] = {
            "satellite_analysis": "Clarifai + Anthropic fallback",
            "weather_data": "NOAA Weather Service API",
            "power_infrastructure": "OpenStreetMap Overpass API", 
            "satellite_imagery": "AWS S3 Sentinel-2",
            "incident_automation": "Make.com webhook → Jira",
            "total_integrations": 5,
            "operational_integrations": len([s for s in service_statuses if "healthy" in str(s) or "configured" in str(s)])
        }
        
        return health_status
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": "2025-01-30T12:00:00Z"
            }
        )


@app.get("/sponsor-integrations")
async def get_sponsor_integrations():
    """Get detailed information about all sponsor tool integrations"""
    return {
        "pyroguard_sentinel": {
            "description": "AI-powered wildfire risk assessment for Hawaiian Islands",
            "version": "1.0.0"
        },
        "integrations": {
            "clarifai": {
                "purpose": "Primary satellite image analysis for vegetation dryness",
                "model": "Crop Health NDVI",
                "status": "active",
                "fallback": "anthropic_vision"
            },
            "anthropic": {
                "purpose": "Fallback satellite image analysis using Vision API",
                "model": "Claude 3 Sonnet",
                "status": "active",
                "role": "fallback_for_clarifai"
            },
            "noaa": {
                "purpose": "Real-time weather data and forecasting",
                "api": "Weather.gov API",
                "status": "active",
                "coverage": "Hawaiian Islands"
            },
            "aws": {
                "purpose": "Satellite imagery storage and access",
                "service": "S3 + Sentinel-2",
                "status": "active",
                "region": "us-west-2"
            },
            "openstreetmap": {
                "purpose": "Power line infrastructure mapping",
                "api": "Overpass API",
                "status": "active",
                "data_source": "OpenStreetMap"
            },
            "make_com": {
                "purpose": "Automated workflow for incident response",
                "integration": "Webhook → Jira ticket creation",
                "status": "active",
                "target": "Jira Cloud"
            },
            "inngest": {
                "purpose": "Job queue and workflow orchestration",
                "status": "configured",
                "fallback": "direct_execution"
            }
        },
        "analysis_pipeline": {
            "phases": [
                {"phase": 1, "name": "Location Verification", "sponsor": "internal"},
                {"phase": 2, "name": "Satellite Analysis", "sponsor": "clarifai_anthropic"},
                {"phase": 3, "name": "Weather Integration", "sponsor": "noaa"},
                {"phase": 4, "name": "Power Infrastructure", "sponsor": "openstreetmap"},
                {"phase": 5, "name": "AI Risk Assessment", "sponsor": "internal_mcp_agent"},
                {"phase": 6, "name": "Incident Automation", "sponsor": "make_com_jira"},
                {"phase": 7, "name": "Complete", "sponsor": "internal"}
            ],
            "total_processing_time": "4-12 seconds",
            "real_time_updates": "Server-Sent Events"
        }
    }


@app.post("/api/v1/test-integrations")
async def test_all_integrations():
    """Test all sponsor tool integrations comprehensively"""
    results = {
        "timestamp": "2025-01-30T12:00:00Z",
        "tests": {}
    }
    
    try:
        # Test satellite analysis (Clarifai + Anthropic)
        satellite_status = await test_satellite_analysis_systems()
        results["tests"]["satellite_analysis"] = satellite_status
        
        # Test NOAA Weather
        noaa_status = await test_noaa_connection()
        results["tests"]["noaa_weather"] = {
            "status": "healthy" if noaa_status else "error",
            "service": "NOAA Weather Service API"
        }
        
        # Test Make.com webhook
        make_status = await test_make_webhook()
        results["tests"]["make_webhook"] = make_status
        
        # Test AWS S3
        s3_status = test_s3_connection()
        results["tests"]["aws_s3"] = {
            "status": "healthy" if s3_status else "error",
            "service": "AWS S3 Sentinel-2"
        }
        
        # Test Overpass API
        overpass_status = test_overpass_connection()
        results["tests"]["overpass_api"] = {
            "status": "healthy" if overpass_status else "error", 
            "service": "OpenStreetMap Overpass API"
        }
        
        # Count successful tests
        successful_tests = 0
        total_tests = len(results["tests"])
        
        for test_name, test_result in results["tests"].items():
            if isinstance(test_result, dict):
                if test_result.get("status") in ["healthy", "configured"]:
                    successful_tests += 1
                elif "clarifai" in test_result and test_result["clarifai"].get("status") == "configured":
                    successful_tests += 1
                elif "anthropic" in test_result and test_result["anthropic"].get("status") == "healthy":
                    successful_tests += 1
        
        results["summary"] = {
            "total_integrations": total_tests,
            "successful_tests": successful_tests,
            "success_rate": f"{(successful_tests/total_tests)*100:.1f}%",
            "overall_status": "operational" if successful_tests >= total_tests * 0.8 else "degraded"
        }
        
        return results
        
    except Exception as e:
        return {
            "timestamp": "2025-01-30T12:00:00Z",
            "error": str(e),
            "status": "test_failed"
        }


if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8081,
        reload=True,
        log_level="info"
    ) 