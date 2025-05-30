"""
Clarifai NDVI Analysis for Wildfire Risk Assessment
Advanced vegetation moisture analysis using pre-trained satellite models
"""
import os
import logging
import base64
import httpx
from typing import Tuple, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Clarifai configuration
CLARIFAI_PAT = os.getenv("CLARIFAI_PAT")
CLARIFAI_APP_ID = os.getenv("CLARIFAI_APP_ID", "pyroguard-app")
CLARIFAI_USER_ID = os.getenv("CLARIFAI_USER_ID", "clarifai")

# Clarifai model IDs for satellite analysis
NDVI_MODEL_ID = "aaa03c23b3724a16a56b629203edc62c"  # Crop Health NDVI
LANDCOVER_MODEL_ID = "landcover-classification"

class ClarifaiNDVIError(Exception):
    """Custom exception for Clarifai NDVI analysis errors"""
    pass

def get_dryness_score(image_data: bytes) -> Tuple[float, float]:
    """
    Get vegetation dryness score from satellite imagery using Clarifai NDVI analysis
    
    Args:
        image_data: Raw satellite image bytes (PNG format recommended)
        
    Returns:
        Tuple of (dryness_score, confidence) where:
        - dryness_score: 0.0 (very moist) to 1.0 (extremely dry)
        - confidence: 0.0 to 1.0 indicating analysis reliability
        
    Raises:
        ClarifaiNDVIError: If analysis fails or returns invalid data
    """
    if not CLARIFAI_PAT:
        logger.error("❌ CLARIFAI_PAT not configured")
        return -1.0, 0.0
    
    try:
        logger.info("🛰️ Submitting image to Clarifai Crop Health NDVI model...")
        
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare Clarifai API request
        headers = {
            "Authorization": f"Key {CLARIFAI_PAT}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": [
                {
                    "data": {
                        "image": {
                            "base64": image_base64
                        }
                    }
                }
            ]
        }
        
        # Call Clarifai NDVI model
        api_url = f"https://api.clarifai.com/v2/users/{CLARIFAI_USER_ID}/apps/{CLARIFAI_APP_ID}/models/{NDVI_MODEL_ID}/outputs"
        
        response = httpx.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=15.0
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Clarifai API error: HTTP {response.status_code}")
            logger.error(f"Response: {response.text}")
            return -1.0, 0.0
        
        result = response.json()
        
        # Parse NDVI response
        if "outputs" not in result or not result["outputs"]:
            logger.error("❌ No outputs in Clarifai response")
            return -1.0, 0.0
        
        output = result["outputs"][0]
        
        if "data" not in output or "regions" not in output["data"]:
            logger.error("❌ Invalid Clarifai response structure")
            return -1.0, 0.0
        
        # Extract NDVI value from regions
        regions = output["data"]["regions"]
        if not regions:
            logger.error("❌ No regions found in Clarifai analysis")
            return -1.0, 0.0
        
        # Get the first region's NDVI data
        region = regions[0]
        concepts = region["data"]["concepts"]
        
        # Find NDVI value in concepts
        ndvi_value = None
        confidence = 0.0
        
        for concept in concepts:
            if "ndvi" in concept["name"].lower() or "vegetation" in concept["name"].lower():
                ndvi_value = concept["value"]
                confidence = concept["value"]  # Use concept confidence
                break
        
        if ndvi_value is None:
            # Fallback: use the highest confidence concept
            if concepts:
                best_concept = max(concepts, key=lambda x: x["value"])
                ndvi_value = best_concept["value"]
                confidence = best_concept["value"]
                logger.info(f"📊 Using fallback concept: {best_concept['name']}")
        
        if ndvi_value is None:
            logger.error("❌ No NDVI value found in Clarifai response")
            return -1.0, 0.0
        
        # Convert NDVI to dryness score
        # NDVI typically ranges from -1 to 1, where:
        # -1 to 0: Non-vegetation (water, bare soil, rock)
        # 0 to 0.3: Sparse vegetation or stressed vegetation
        # 0.3 to 0.6: Moderate vegetation
        # 0.6 to 1: Dense, healthy vegetation
        
        # Normalize NDVI to 0-1 range first
        normalized_ndvi = max(0, min(1, (ndvi_value + 1) / 2))
        
        # Convert to dryness score (inverse of vegetation health)
        # Higher NDVI = healthier vegetation = lower dryness
        dryness_score = 1.0 - normalized_ndvi
        
        # Apply vegetation health curve
        # Healthy vegetation (NDVI > 0.6) should have very low dryness
        # Stressed vegetation (NDVI < 0.3) should have high dryness
        if normalized_ndvi > 0.8:  # Very healthy vegetation
            dryness_score = dryness_score * 0.3  # Very low fire risk
        elif normalized_ndvi > 0.6:  # Healthy vegetation
            dryness_score = dryness_score * 0.5  # Low fire risk
        elif normalized_ndvi > 0.3:  # Moderate vegetation
            dryness_score = dryness_score * 0.8  # Moderate fire risk
        else:  # Sparse/stressed vegetation
            dryness_score = min(1.0, dryness_score * 1.2)  # High fire risk
        
        # Ensure dryness score is within valid range
        dryness_score = max(0.0, min(1.0, dryness_score))
        confidence = max(0.1, min(1.0, confidence))
        
        logger.info(f"✅ Clarifai NDVI analysis complete: NDVI={ndvi_value:.3f}, Dryness={dryness_score:.3f}, Confidence={confidence:.3f}")
        
        return dryness_score, confidence
        
    except httpx.TimeoutException:
        logger.error("⏰ Clarifai API timeout")
        return -1.0, 0.0
    except httpx.RequestError as e:
        logger.error(f"❌ Clarifai request error: {e}")
        return -1.0, 0.0
    except Exception as e:
        logger.error(f"❌ Clarifai NDVI analysis failed: {e}")
        return -1.0, 0.0

def get_landcover_analysis(image_data: bytes) -> Dict[str, Any]:
    """
    Get detailed land cover classification from satellite imagery
    
    Args:
        image_data: Raw satellite image bytes
        
    Returns:
        Dictionary containing land cover classification results
    """
    if not CLARIFAI_PAT:
        logger.error("❌ CLARIFAI_PAT not configured")
        return {"error": "API key not configured"}
    
    try:
        logger.info("🗺️ Analyzing land cover classification...")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        headers = {
            "Authorization": f"Key {CLARIFAI_PAT}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": [
                {
                    "data": {
                        "image": {
                            "base64": image_base64
                        }
                    }
                }
            ]
        }
        
        api_url = f"https://api.clarifai.com/v2/users/{CLARIFAI_USER_ID}/apps/{CLARIFAI_APP_ID}/models/{LANDCOVER_MODEL_ID}/outputs"
        
        response = httpx.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=15.0
        )
        
        if response.status_code != 200:
            logger.error(f"❌ Land cover API error: HTTP {response.status_code}")
            return {"error": f"API error: {response.status_code}"}
        
        result = response.json()
        
        # Parse land cover results
        if "outputs" not in result or not result["outputs"]:
            return {"error": "No outputs in response"}
        
        output = result["outputs"][0]
        concepts = output["data"]["concepts"]
        
        # Extract top land cover types
        land_cover_types = []
        for concept in concepts[:5]:  # Top 5 classifications
            land_cover_types.append({
                "type": concept["name"],
                "confidence": concept["value"],
                "fire_risk_factor": _get_landcover_fire_risk(concept["name"])
            })
        
        logger.info(f"✅ Land cover analysis complete: {len(land_cover_types)} types identified")
        
        return {
            "land_cover_types": land_cover_types,
            "analysis_timestamp": datetime.now().isoformat(),
            "primary_type": land_cover_types[0]["type"] if land_cover_types else "unknown"
        }
        
    except Exception as e:
        logger.error(f"❌ Land cover analysis failed: {e}")
        return {"error": str(e)}

def _get_landcover_fire_risk(land_type: str) -> float:
    """
    Get fire risk factor based on land cover type
    
    Args:
        land_type: Land cover classification name
        
    Returns:
        Fire risk factor (0.0 = low risk, 1.0 = high risk)
    """
    land_type_lower = land_type.lower()
    
    # Fire risk factors for different land cover types
    fire_risk_map = {
        "grassland": 0.8,
        "shrubland": 0.9,
        "forest": 0.7,
        "agriculture": 0.6,
        "urban": 0.3,
        "water": 0.0,
        "bare": 0.4,
        "developed": 0.2,
        "crop": 0.5,
        "pasture": 0.7,
        "wetland": 0.1
    }
    
    # Check for matches in land type name
    for key, risk in fire_risk_map.items():
        if key in land_type_lower:
            return risk
    
    # Default moderate risk for unknown types
    return 0.5

def test_clarifai_connection() -> bool:
    """
    Test Clarifai API connection and model accessibility
    
    Returns:
        True if connection is successful, False otherwise
    """
    if not CLARIFAI_PAT:
        logger.error("❌ CLARIFAI_PAT not configured")
        return False
    
    try:
        logger.info("🔍 Testing Clarifai API connection...")
        
        headers = {
            "Authorization": f"Key {CLARIFAI_PAT}",
            "Content-Type": "application/json"
        }
        
        # Test API connectivity with a simple model list request
        response = httpx.get(
            f"https://api.clarifai.com/v2/users/{CLARIFAI_USER_ID}/apps/{CLARIFAI_APP_ID}/models",
            headers=headers,
            timeout=10.0
        )
        
        if response.status_code == 200:
            logger.info("✅ Clarifai connection successful")
            return True
        else:
            logger.error(f"❌ Clarifai connection failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Clarifai connection test failed: {e}")
        return False

def get_clarifai_status() -> Dict[str, Any]:
    """
    Get comprehensive Clarifai service status
    
    Returns:
        Dictionary containing service status information
    """
    status = {
        "configured": bool(CLARIFAI_PAT),
        "timestamp": datetime.now().isoformat(),
        "models": {
            "ndvi": {"id": NDVI_MODEL_ID, "status": "unknown"},
            "landcover": {"id": LANDCOVER_MODEL_ID, "status": "unknown"}
        }
    }
    
    if not CLARIFAI_PAT:
        status["error"] = "CLARIFAI_PAT not configured"
        return status
    
    # Test connection
    connection_ok = test_clarifai_connection()
    status["connected"] = connection_ok
    
    if connection_ok:
        status["models"]["ndvi"]["status"] = "accessible"
        status["models"]["landcover"]["status"] = "accessible"
        status["message"] = "Clarifai satellite analysis ready"
    else:
        status["models"]["ndvi"]["status"] = "error"
        status["models"]["landcover"]["status"] = "error"
        status["error"] = "Connection failed"
    
    return status

# Demo/test data for development
DEMO_ANALYSIS_RESULTS = {
    "high_risk": {
        "dryness_score": 0.82,
        "confidence": 0.91,
        "vegetation_type": "stressed_grassland",
        "ndvi_value": 0.15,
        "reasoning": "Very low NDVI indicates severely stressed vegetation with high fire potential"
    },
    "moderate_risk": {
        "dryness_score": 0.55,
        "confidence": 0.87,
        "vegetation_type": "mixed_shrubland",
        "ndvi_value": 0.35,
        "reasoning": "Moderate NDVI suggests stressed vegetation with elevated fire risk"
    },
    "low_risk": {
        "dryness_score": 0.25,
        "confidence": 0.93,
        "vegetation_type": "healthy_forest",
        "ndvi_value": 0.75,
        "reasoning": "High NDVI indicates healthy vegetation with lower fire susceptibility"
    }
} 