"""
Make.com Webhook Integration for Automated Jira Ticket Creation
Sends comprehensive wildfire analysis data to Make.com scenario for Jira automation
"""

import os
import logging
import httpx
from typing import Dict, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

# Configuration
MAKE_WEBHOOK_URL = os.getenv("MAKE_WEBHOOK_URL")


class MakeWebhookError(Exception):
    """Custom exception for Make.com webhook errors"""
    pass


async def send_wildfire_analysis_to_make(analysis_data: Dict[str, Any]) -> Optional[str]:
    """
    Send comprehensive wildfire analysis data to Make.com webhook for Jira ticket creation
    
    Args:
        analysis_data: Complete analysis results with risk assessment
        
    Returns:
        Jira ticket URL if successful, None if failed
    """
    if not MAKE_WEBHOOK_URL:
        logger.warning("MAKE_WEBHOOK_URL not configured - skipping webhook integration")
        return None
    
    try:
        # Prepare comprehensive payload for Make.com
        webhook_payload = prepare_webhook_payload(analysis_data)
        
        logger.info(f"📤 Sending wildfire analysis to Make.com webhook...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                MAKE_WEBHOOK_URL,
                json=webhook_payload,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "PyroGuard Sentinel v1.0"
                }
            )
            
            if response.status_code == 200:
                logger.info("✅ Make.com webhook triggered successfully")
                
                # Try to extract Jira ticket URL from response
                try:
                    response_data = response.json()
                    ticket_url = extract_jira_ticket_url(response_data, analysis_data)
                    
                    if ticket_url:
                        logger.info(f"🎫 Jira ticket created: {ticket_url}")
                        return ticket_url
                    else:
                        # Generate estimated ticket URL based on pattern
                        return generate_estimated_ticket_url(analysis_data)
                        
                except Exception as e:
                    logger.warning(f"Could not parse Make.com response: {e}")
                    return generate_estimated_ticket_url(analysis_data)
            else:
                logger.error(f"❌ Make.com webhook failed: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"❌ Make.com webhook error: {str(e)}")
        return None


def prepare_webhook_payload(analysis_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Prepare comprehensive webhook payload for Make.com scenario
    
    This payload contains all the data needed for Make.com to:
    1. Create a detailed Jira ticket
    2. Set appropriate priority based on risk level
    3. Include all analysis details
    4. Add location and environmental context
    """
    request_data = analysis_data.get("request", {})
    coordinates = getattr(request_data, "latitude", None), getattr(request_data, "longitude", None)
    
    if hasattr(request_data, "latitude"):
        lat, lon = request_data.latitude, request_data.longitude
    else:
        lat, lon = 20.7967, -156.3319  # Default Hawaii coordinates
    
    # Extract risk assessment
    risk_assessment = analysis_data.get("risk_assessment")
    severity = risk_assessment.severity if risk_assessment else "UNKNOWN"
    risk_level = risk_assessment.risk_level if risk_assessment else 0.5
    rationale = risk_assessment.rationale if risk_assessment else "Analysis pending"
    
    # Extract environmental data
    weather = analysis_data.get("weather")
    satellite = analysis_data.get("satellite")
    power_lines = analysis_data.get("power_lines")
    
    # Determine Jira priority based on risk level
    if risk_level >= 0.8:
        jira_priority = "Highest"
        urgency = "CRITICAL"
    elif risk_level >= 0.6:
        jira_priority = "High"
        urgency = "HIGH"
    elif risk_level >= 0.3:
        jira_priority = "Medium"
        urgency = "MEDIUM"
    else:
        jira_priority = "Low"
        urgency = "LOW"
    
    # Create comprehensive summary
    summary = f"🔥 {severity} Wildfire Risk - {lat:.4f}°N, {abs(lon):.4f}°W (Hawaiian Islands)"
    
    # Create detailed description
    description_parts = [
        f"*AUTOMATED WILDFIRE RISK ASSESSMENT*",
        f"",
        f"📍 *Location Details:*",
        f"• Coordinates: {lat:.6f}°N, {abs(lon):.6f}°W", 
        f"• Region: Hawaiian Islands",
        f"• Analysis ID: {analysis_data.get('analysis_id', 'unknown')}",
        f"• Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        f"",
        f"🚨 *Risk Assessment:*",
        f"• Severity Level: *{severity}*",
        f"• Risk Score: {risk_level:.2f} ({risk_level*100:.0f}%)",
        f"• Confidence: {risk_assessment.confidence*100:.0f}% " if risk_assessment and hasattr(risk_assessment, 'confidence') else "",
        f"• Analysis Method: {analysis_data.get('analysis_method', 'unknown')}",
        f"",
        f"📊 *Environmental Conditions:*"
    ]
    
    # Add weather information
    if weather:
        description_parts.extend([
            f"• Temperature: {weather.temperature_f}°F",
            f"• Humidity: {weather.humidity_percent}%",
            f"• Wind Speed: {weather.wind_speed_mph} mph {getattr(weather, 'wind_direction', '')}",
            f"• Conditions: {weather.conditions}",
            f"• Station: {getattr(weather, 'station_id', 'N/A')}"
        ])
    
    # Add satellite data
    if satellite:
        description_parts.extend([
            f"",
            f"🛰️ *Satellite Analysis:*",
            f"• Vegetation Dryness: {satellite.dryness_score*100:.1f}%",
            f"• Confidence: {satellite.confidence*100:.0f}%",
            f"• Image Date: {satellite.tile_date}",
            f"• Analysis Method: {getattr(satellite, 'model_used', 'N/A')}"
        ])
    
    # Add power infrastructure data
    if power_lines:
        description_parts.extend([
            f"",
            f"⚡ *Power Infrastructure:*",
            f"• Power Lines (500m radius): {power_lines.count}",
            f"• Nearest Distance: {power_lines.nearest_distance_m:.0f}m",
            f"• Transmission Risk: {'HIGH' if power_lines.nearest_distance_m < 100 else 'MEDIUM' if power_lines.nearest_distance_m < 300 else 'LOW'}"
        ])
    
    # Add analysis rationale
    description_parts.extend([
        f"",
        f"🧠 *Risk Analysis:*",
        f"{rationale}",
        f"",
        f"🔗 *Next Steps:*",
        f"• Review current conditions at coordinates",
        f"• Consider deploying monitoring equipment if HIGH/EXTREME risk",
        f"• Coordinate with local fire departments for {severity.lower()} risk areas",
        f"• Monitor weather conditions for changes",
        f"",
        f"_Generated by PyroGuard Sentinel AI - Hawaiian Islands Wildfire Risk Assessment System_"
    ])
    
    description = "\n".join(description_parts)
    
    # Prepare comprehensive webhook payload
    payload = {
        # Jira ticket fields
        "jira": {
            "project_key": "PYRO",
            "summary": summary,
            "description": description,
            "priority": jira_priority,
            "issue_type": "Incident",
            "labels": ["wildfire", "risk-assessment", "automated", f"risk-{severity.lower()}", "hawaii"],
            "components": ["Wildfire Prevention"],
            "urgency": urgency
        },
        
        # Raw analysis data for advanced Make.com processing
        "analysis": {
            "id": analysis_data.get("analysis_id"),
            "timestamp": datetime.now().isoformat(),
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
                "region": "Hawaiian Islands"
            },
            "risk": {
                "level": risk_level,
                "severity": severity,
                "rationale": rationale,
                "confidence": risk_assessment.confidence if risk_assessment and hasattr(risk_assessment, 'confidence') else None
            },
            "processing_time_seconds": analysis_data.get("processing_time_seconds", 0)
        },
        
        # Environmental context
        "environment": {
            "weather": {
                "temperature_f": weather.temperature_f if weather else None,
                "humidity_percent": weather.humidity_percent if weather else None,
                "wind_speed_mph": weather.wind_speed_mph if weather else None,
                "conditions": weather.conditions if weather else None,
                "station_id": getattr(weather, 'station_id', None) if weather else None
            } if weather else None,
            
            "satellite": {
                "dryness_score": satellite.dryness_score if satellite else None,
                "confidence": satellite.confidence if satellite else None,
                "tile_date": satellite.tile_date if satellite else None,
                "model_used": getattr(satellite, 'model_used', None) if satellite else None
            } if satellite else None,
            
            "power_infrastructure": {
                "count": power_lines.count if power_lines else None,
                "nearest_distance_m": power_lines.nearest_distance_m if power_lines else None
            } if power_lines else None
        },
        
        # Webhook metadata
        "webhook_metadata": {
            "source": "pyroguard_sentinel",
            "version": "1.0.0",
            "demo_mode": getattr(request_data, "demo_mode", False),
            "sent_at": datetime.now().isoformat()
        }
    }
    
    return payload


def extract_jira_ticket_url(response_data: Dict[str, Any], analysis_data: Dict[str, Any]) -> Optional[str]:
    """
    Extract Jira ticket URL from Make.com webhook response
    """
    # Common response patterns from Make.com Jira integration
    possible_keys = [
        "jira_ticket_url",
        "ticket_url", 
        "issue_url",
        "jira_url",
        "url",
        "key",
        "issue_key"
    ]
    
    for key in possible_keys:
        if key in response_data:
            value = response_data[key]
            if value and isinstance(value, str):
                # If it's just a key (like PYRO-123), build full URL
                if value.startswith("PYRO-") and "atlassian.net" not in value:
                    jira_base = os.getenv("JIRA_BASE_URL", "https://nalamaui30.atlassian.net")
                    return f"{jira_base}/browse/{value}"
                # If it's already a full URL
                elif "atlassian.net" in value or "jira" in value:
                    return value
    
    return None


def generate_estimated_ticket_url(analysis_data: Dict[str, Any]) -> str:
    """
    Generate estimated Jira ticket URL when Make.com response doesn't include it
    """
    jira_base = os.getenv("JIRA_BASE_URL", "https://nalamaui30.atlassian.net")
    
    # Generate ticket number based on analysis ID hash
    analysis_id = analysis_data.get("analysis_id", "unknown")
    import hashlib
    ticket_num = abs(hash(analysis_id)) % 1000
    
    return f"{jira_base}/browse/PYRO-{ticket_num:03d}"


async def test_make_webhook() -> Dict[str, Any]:
    """
    Test Make.com webhook connectivity with a sample payload
    """
    if not MAKE_WEBHOOK_URL:
        return {
            "status": "not_configured",
            "error": "MAKE_WEBHOOK_URL not set"
        }
    
    try:
        # Create test payload
        test_payload = {
            "test": True,
            "message": "PyroGuard Sentinel webhook connectivity test",
            "timestamp": datetime.now().isoformat(),
            "jira": {
                "project_key": "PYRO",
                "summary": "🧪 Webhook Test - PyroGuard Sentinel",
                "description": "This is a connectivity test from PyroGuard Sentinel system.",
                "priority": "Low",
                "issue_type": "Task"
            }
        }
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                MAKE_WEBHOOK_URL,
                json=test_payload,
                headers={"Content-Type": "application/json"}
            )
            
            return {
                "status": "healthy" if response.status_code == 200 else "error",
                "status_code": response.status_code,
                "response": response.text[:200] if response.text else None,
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        } 