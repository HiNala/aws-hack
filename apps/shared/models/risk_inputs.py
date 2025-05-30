from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Request model for wildfire risk analysis"""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    demo_mode: bool = Field(default=False, description="Use cached data for demo")


class WeatherData(BaseModel):
    """Weather conditions from NOAA"""
    wind_speed_mph: float = Field(..., description="Wind speed in mph")
    humidity_percent: float = Field(..., description="Relative humidity percentage")
    temperature_f: float = Field(..., description="Temperature in Fahrenheit")
    conditions: str = Field(..., description="Weather conditions description")


class PowerLineData(BaseModel):
    """Power line infrastructure analysis"""
    count: int = Field(..., description="Number of power lines within 500m")
    nearest_distance_m: float = Field(..., description="Distance to nearest power line in meters")
    transmission_towers: int = Field(default=0, description="Number of transmission towers")


class SatelliteData(BaseModel):
    """Satellite imagery analysis results"""
    dryness_score: float = Field(..., ge=-1, le=1, description="Vegetation dryness score from Clarifai NDVI")
    tile_date: str = Field(..., description="Date of satellite imagery")
    confidence: float = Field(default=1.0, ge=0, le=1, description="Analysis confidence")


class RiskAssessment(BaseModel):
    """Final wildfire risk assessment from Claude Sonnet"""
    risk_level: float = Field(..., ge=0, le=1, description="Overall risk score 0-1")
    severity: str = Field(..., description="Risk severity: LOW, MEDIUM, HIGH, EXTREME")
    rationale: str = Field(..., description="AI explanation of risk factors")
    confidence: float = Field(..., ge=0, le=1, description="Assessment confidence")


class AnalysisResult(BaseModel):
    """Complete analysis result"""
    request: AnalysisRequest
    weather: Optional[WeatherData] = None
    power_lines: Optional[PowerLineData] = None
    satellite: Optional[SatelliteData] = None
    risk_assessment: Optional[RiskAssessment] = None
    jira_ticket_url: Optional[str] = None
    processing_time_seconds: float = Field(default=0.0)
    status: str = Field(default="processing")
    error_message: Optional[str] = None


class WorkerEvent(BaseModel):
    """Inngest worker event payload"""
    analysis_id: str = Field(..., description="Unique analysis identifier")
    latitude: float
    longitude: float
    demo_mode: bool = False
    retry_count: int = Field(default=0)


class OperantLogEntry(BaseModel):
    """Operant AI timeline entry"""
    phase: str = Field(..., description="Processing phase")
    message: str = Field(..., description="Log message")
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(..., description="ISO timestamp")
    elapsed_ms: int = Field(..., description="Milliseconds since start") 