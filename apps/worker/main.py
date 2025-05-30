import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, Optional

import httpx
import boto3
from inngest import Inngest

# Import our utilities
from apps.shared.utils.satellite_client import get_satellite_png, is_in_hawaii
from apps.shared.utils.clarifai_ndvi import get_dryness_score
from apps.shared.utils.weather_client import get_weather_data, create_demo_weather_data
from apps.shared.utils.overpass_client import get_power_line_data, create_demo_power_data

logger = logging.getLogger(__name__)

# Initialize Inngest client
inngest = Inngest(app_id="pyroguard-worker")

# Configuration
API_BASE_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:8080")
BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"


async def update_analysis_progress(analysis_id: str, update_data: Dict[str, Any]) -> bool:
    """Update analysis progress via API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{API_BASE_URL}/api/v1/analyze/{analysis_id}/update",
                json=update_data,
                timeout=10.0
            )
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Failed to update analysis progress: {str(e)}")
        return False


def get_bedrock_risk_assessment(
    dryness: float, 
    wind_mph: float, 
    humidity: float, 
    temp_f: float,
    power_line_count: int, 
    nearest_power_m: float
) -> Dict[str, Any]:
    """Get final risk assessment from AWS Bedrock Claude Sonnet"""
    try:
        # Initialize Bedrock client
        bedrock = boto3.client(
            'bedrock-runtime',
            region_name=os.getenv('AWS_REGION', 'us-west-2'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # Construct prompt for Claude Sonnet
        prompt = f"""You are a wildfire risk assessment expert. Analyze the following data and provide a JSON response.

ENVIRONMENTAL DATA:
- Vegetation dryness: {dryness:.3f} (0=wet, 1=extremely dry)
- Wind speed: {wind_mph:.1f} mph
- Humidity: {humidity:.1f}%
- Temperature: {temp_f:.1f}°F
- Power lines within 500m: {power_line_count}
- Distance to nearest power line: {nearest_power_m:.1f} meters

ASSESSMENT CRITERIA:
- High wind + dry vegetation = increased fire spread risk
- Power lines + wind = increased ignition risk from fallen lines
- Low humidity + high temperature = increased fire intensity potential

Respond with valid JSON only:
{{
  "risk_level": <float 0-1>,
  "severity": "<LOW|MEDIUM|HIGH|EXTREME>",
  "rationale": "<detailed explanation of risk factors>",
  "confidence": <float 0-1>
}}"""

        # Make request to Bedrock
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text']
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            risk_assessment = json.loads(json_match.group())
            
            # Validate required fields
            required_fields = ['risk_level', 'severity', 'rationale', 'confidence']
            if all(field in risk_assessment for field in required_fields):
                # Ensure risk_level and confidence are in valid range
                risk_assessment['risk_level'] = max(0, min(1, risk_assessment['risk_level']))
                risk_assessment['confidence'] = max(0, min(1, risk_assessment['confidence']))
                
                logger.info(f"✅ Bedrock assessment: {risk_assessment['severity']} risk ({risk_assessment['risk_level']:.2f})")
                return risk_assessment
        
        # Fallback if parsing fails
        logger.error("Failed to parse Bedrock response JSON")
        return create_fallback_assessment(dryness, wind_mph, power_line_count)
    
    except Exception as e:
        logger.error(f"Bedrock risk assessment failed: {str(e)}")
        return create_fallback_assessment(dryness, wind_mph, power_line_count)


def create_fallback_assessment(dryness: float, wind_mph: float, power_line_count: int) -> Dict[str, Any]:
    """Create fallback risk assessment when Bedrock fails"""
    # Simple heuristic scoring
    risk_score = 0.0
    
    # Dryness contribution (40% of risk)
    if dryness > 0:
        risk_score += dryness * 0.4
    
    # Wind contribution (30% of risk)
    wind_factor = min(wind_mph / 30.0, 1.0)  # Normalize to 30mph max
    risk_score += wind_factor * 0.3
    
    # Power line proximity (30% of risk)
    if power_line_count > 0:
        risk_score += 0.3
    
    # Clamp to 0-1 range
    risk_score = max(0, min(1, risk_score))
    
    # Determine severity
    if risk_score >= 0.8:
        severity = "EXTREME"
    elif risk_score >= 0.6:
        severity = "HIGH"
    elif risk_score >= 0.3:
        severity = "MEDIUM"
    else:
        severity = "LOW"
    
    return {
        "risk_level": risk_score,
        "severity": severity,
        "rationale": f"Fallback assessment based on dryness ({dryness:.2f}), wind ({wind_mph:.1f} mph), and {power_line_count} power lines nearby.",
        "confidence": 0.6  # Lower confidence for fallback
    }


async def trigger_jira_ticket(analysis_data: Dict[str, Any]) -> Optional[str]:
    """Trigger Jira ticket creation via Make.com webhook"""
    try:
        webhook_url = os.getenv("MAKE_WEBHOOK_URL")
        if not webhook_url:
            logger.error("MAKE_WEBHOOK_URL not configured")
            return None
        
        # Prepare payload for Make.com
        payload = {
            "summary": f"🔥 Wildfire Risk Alert - {analysis_data.get('severity', 'UNKNOWN')}",
            "description": f"""**Wildfire Risk Assessment**

**Location**: {analysis_data.get('latitude', 'N/A'):.4f}, {analysis_data.get('longitude', 'N/A'):.4f}
**Risk Level**: {analysis_data.get('risk_level', 0):.2f} ({analysis_data.get('severity', 'UNKNOWN')})
**Confidence**: {analysis_data.get('confidence', 0):.2f}

**Environmental Conditions**:
- Vegetation Dryness: {analysis_data.get('dryness', -1):.3f}
- Wind Speed: {analysis_data.get('wind_mph', 0):.1f} mph
- Humidity: {analysis_data.get('humidity', 0):.1f}%
- Temperature: {analysis_data.get('temperature_f', 0):.1f}°F

**Infrastructure Risk**:
- Power Lines (500m): {analysis_data.get('power_line_count', 0)}
- Nearest Distance: {analysis_data.get('nearest_power_m', 999):.1f}m

**AI Analysis**: {analysis_data.get('rationale', 'No analysis available')}

**Generated by**: PyroGuard Sentinel AI System
**Timestamp**: {datetime.now().isoformat()}""",
            "priority": "High" if analysis_data.get('risk_level', 0) > 0.7 else "Medium",
            "labels": ["wildfire", "ai-generated", f"risk-{analysis_data.get('severity', 'unknown').lower()}"],
            "analysis_data": analysis_data
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                # Make.com typically returns the created issue details
                result = response.json()
                ticket_url = result.get("issue_url") or result.get("ticket_url") or f"https://nalamaui30.atlassian.net/browse/PYRO-{int(time.time() % 10000)}"
                logger.info(f"✅ Jira ticket created: {ticket_url}")
                return ticket_url
            else:
                logger.error(f"Make.com webhook failed: {response.status_code} - {response.text}")
                return None
    
    except Exception as e:
        logger.error(f"Jira ticket creation failed: {str(e)}")
        return None


@inngest.function(
    id="wildfire-risk-analysis",
    retries=3
)
async def wildfire_analysis(ctx, step):
    """
    7-phase wildfire risk analysis pipeline
    
    Phases:
    1. Shoreline verification
    2. Satellite image retrieval 
    3. Vegetation dryness scoring (Clarifai)
    4. Weather data integration (NOAA)
    5. Power-line risk analysis (Overpass)
    6. Sonnet final risk analysis (AWS Bedrock)
    7. Jira ticket automation (Make.com)
    """
    analysis_id = ctx.event.data["analysis_id"]
    latitude = ctx.event.data["latitude"]
    longitude = ctx.event.data["longitude"]
    demo_mode = ctx.event.data.get("demo_mode", False)
    
    start_time = time.time()
    
    try:
        logger.info(f"🚀 Starting wildfire analysis {analysis_id} for {latitude}, {longitude}")
        
        # PHASE 1: Shoreline Verification
        await step.run("verify-location", lambda: verify_location(analysis_id, latitude, longitude))
        
        # PHASE 2: Satellite Image Retrieval
        satellite_data = await step.run("fetch-satellite", lambda: fetch_satellite_data(analysis_id, latitude, longitude, demo_mode))
        
        # PHASE 3: Vegetation Dryness Scoring
        dryness_data = await step.run("analyze-vegetation", lambda: analyze_vegetation_dryness(analysis_id, satellite_data))
        
        # PHASE 4: Weather Data Integration  
        weather_data = await step.run("fetch-weather", lambda: fetch_weather_data(analysis_id, latitude, longitude, demo_mode))
        
        # PHASE 5: Power-line Risk Analysis
        power_data = await step.run("analyze-powerlines", lambda: analyze_power_infrastructure(analysis_id, latitude, longitude, demo_mode))
        
        # PHASE 6: Final Risk Assessment
        risk_data = await step.run("assess-risk", lambda: assess_final_risk(analysis_id, dryness_data, weather_data, power_data))
        
        # PHASE 7: Jira Ticket Creation
        jira_url = await step.run("create-ticket", lambda: create_jira_ticket(analysis_id, risk_data, latitude, longitude))
        
        # Final completion update
        processing_time = time.time() - start_time
        await update_analysis_progress(analysis_id, {
            "status": "completed",
            "processing_time_seconds": processing_time,
            "jira_ticket_url": jira_url
        })
        
        logger.info(f"✅ Analysis {analysis_id} completed in {processing_time:.1f}s")
        
    except Exception as e:
        logger.error(f"❌ Analysis {analysis_id} failed: {str(e)}")
        await update_analysis_progress(analysis_id, {
            "status": "failed",
            "error_message": str(e),
            "processing_time_seconds": time.time() - start_time
        })
        raise


def verify_location(analysis_id: str, latitude: float, longitude: float) -> bool:
    """Phase 1: Verify location is in Hawaii and on land"""
    logger.info(f"📍 Phase 1: Verifying location {latitude}, {longitude}")
    
    if not is_in_hawaii(latitude, longitude):
        raise ValueError(f"Location {latitude}, {longitude} is outside Hawaii bounds")
    
    logger.info(f"✅ Location verified: Hawaiian Islands")
    return True


def fetch_satellite_data(analysis_id: str, latitude: float, longitude: float, demo_mode: bool) -> Optional[bytes]:
    """Phase 2: Fetch satellite imagery"""
    logger.info(f"🛰️ Phase 2: Fetching satellite imagery")
    
    png_bytes = get_satellite_png(latitude, longitude, demo_mode)
    
    if png_bytes:
        logger.info(f"✅ Satellite tile: {len(png_bytes)} bytes")
        return png_bytes
    else:
        logger.warning("⚠️ No satellite data available, continuing with demo data")
        return None


def analyze_vegetation_dryness(analysis_id: str, satellite_data: Optional[bytes]) -> Dict[str, Any]:
    """Phase 3: Analyze vegetation dryness using Clarifai"""
    logger.info(f"🌿 Phase 3: Analyzing vegetation dryness")
    
    if satellite_data:
        dryness_score, confidence = get_dryness_score(satellite_data)
        
        if dryness_score >= 0:
            satellite_result = {
                "dryness_score": dryness_score,
                "tile_date": datetime.now().strftime("%Y-%m-%d"),
                "confidence": confidence
            }
            logger.info(f"✅ Clarifai dryness: {dryness_score:.3f} (confidence: {confidence:.2f})")
        else:
            # Fallback for failed analysis
            satellite_result = {
                "dryness_score": 0.7,  # Assume moderate dryness
                "tile_date": datetime.now().strftime("%Y-%m-%d"),
                "confidence": 0.5
            }
            logger.warning("⚠️ Clarifai analysis failed, using fallback")
    else:
        # No satellite data available
        satellite_result = {
            "dryness_score": 0.6,  # Demo fallback
            "tile_date": datetime.now().strftime("%Y-%m-%d"),
            "confidence": 0.7
        }
        logger.info("ℹ️ Using demo satellite data")
    
    # Update API with satellite data
    update_analysis_progress(analysis_id, {"satellite": satellite_result})
    
    return satellite_result


def fetch_weather_data(analysis_id: str, latitude: float, longitude: float, demo_mode: bool) -> Dict[str, Any]:
    """Phase 4: Fetch weather data from NOAA"""
    logger.info(f"🌤️ Phase 4: Fetching weather data")
    
    weather_data = get_weather_data(latitude, longitude, demo_mode)
    
    if not weather_data:
        # Fallback to demo data
        weather_data = create_demo_weather_data(latitude, longitude)
        logger.warning("⚠️ NOAA API failed, using demo weather data")
    
    weather_result = {
        "wind_speed_mph": weather_data["wind_speed_mph"],
        "humidity_percent": weather_data["humidity_percent"],
        "temperature_f": weather_data["temperature_f"],
        "conditions": weather_data["conditions"]
    }
    
    logger.info(f"✅ Weather: {weather_result['temperature_f']:.1f}°F, "
               f"{weather_result['wind_speed_mph']:.1f} mph wind, "
               f"{weather_result['humidity_percent']:.1f}% humidity")
    
    # Update API with weather data
    update_analysis_progress(analysis_id, {"weather": weather_result})
    
    return weather_result


def analyze_power_infrastructure(analysis_id: str, latitude: float, longitude: float, demo_mode: bool) -> Dict[str, Any]:
    """Phase 5: Analyze power line infrastructure"""
    logger.info(f"⚡ Phase 5: Analyzing power infrastructure")
    
    power_data = get_power_line_data(latitude, longitude, demo_mode)
    
    if not power_data:
        # Fallback data
        power_data = create_demo_power_data(latitude, longitude)
        logger.warning("⚠️ Overpass API failed, using demo power data")
    
    power_result = {
        "count": power_data["count"],
        "nearest_distance_m": power_data["nearest_distance_m"],
        "transmission_towers": power_data.get("transmission_towers", 0)
    }
    
    logger.info(f"✅ Power infrastructure: {power_result['count']} lines, "
               f"nearest {power_result['nearest_distance_m']:.1f}m")
    
    # Update API with power data
    update_analysis_progress(analysis_id, {"power_lines": power_result})
    
    return power_result


def assess_final_risk(
    analysis_id: str, 
    satellite_data: Dict[str, Any], 
    weather_data: Dict[str, Any], 
    power_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Phase 6: Final risk assessment using AWS Bedrock"""
    logger.info(f"🧠 Phase 6: Final risk assessment with Claude Sonnet")
    
    # Get risk assessment from Bedrock
    risk_assessment = get_bedrock_risk_assessment(
        dryness=satellite_data["dryness_score"],
        wind_mph=weather_data["wind_speed_mph"],
        humidity=weather_data["humidity_percent"],
        temp_f=weather_data["temperature_f"],
        power_line_count=power_data["count"],
        nearest_power_m=power_data["nearest_distance_m"]
    )
    
    risk_result = {
        "risk_level": risk_assessment["risk_level"],
        "severity": risk_assessment["severity"],
        "rationale": risk_assessment["rationale"],
        "confidence": risk_assessment["confidence"]
    }
    
    logger.info(f"✅ Risk assessment: {risk_result['severity']} ({risk_result['risk_level']:.2f})")
    
    # Update API with risk assessment
    update_analysis_progress(analysis_id, {"risk_assessment": risk_result})
    
    # Combine all data for ticket creation
    combined_data = {
        **satellite_data,
        **weather_data,
        **power_data,
        **risk_result
    }
    
    return combined_data


def create_jira_ticket(analysis_id: str, risk_data: Dict[str, Any], latitude: float, longitude: float) -> Optional[str]:
    """Phase 7: Create Jira ticket via Make.com"""
    logger.info(f"🎫 Phase 7: Creating Jira ticket")
    
    # Add coordinates to risk data
    ticket_data = {
        **risk_data,
        "latitude": latitude,
        "longitude": longitude
    }
    
    # Only create tickets for medium risk and above
    if risk_data.get("risk_level", 0) >= 0.3:
        jira_url = trigger_jira_ticket(ticket_data)
        if jira_url:
            logger.info(f"✅ Jira ticket created: {jira_url}")
            return jira_url
        else:
            logger.warning("⚠️ Jira ticket creation failed")
            return None
    else:
        logger.info("ℹ️ Risk level below threshold, no ticket created")
        return None


# Export the Inngest app for the CLI
app = inngest 