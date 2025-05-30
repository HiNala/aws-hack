"""
Advanced Satellite Image Analysis for Vegetation Dryness Assessment
Uses Clarifai as primary analysis method with Anthropic Vision API as fallback
"""

import os
import logging
import base64
import asyncio
from typing import Dict, Any, Optional, Union
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

# Configuration
CLARIFAI_PAT = os.getenv("CLARIFAI_PAT")
CLARIFAI_USER_ID = os.getenv("CLARIFAI_USER_ID")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

class SatelliteAnalysisError(Exception):
    """Custom exception for satellite analysis errors"""
    pass


async def analyze_satellite_image(image_data: bytes, coordinates: Dict[str, float], demo_mode: bool = False) -> Dict[str, Any]:
    """
    Analyze satellite image for vegetation dryness using Clarifai with Anthropic fallback
    
    Args:
        image_data: Raw satellite image bytes (PNG/JPEG)
        coordinates: {"latitude": float, "longitude": float}
        demo_mode: If True, use cached/demo responses for faster processing
        
    Returns:
        Dict containing dryness analysis results
    """
    start_time = datetime.now()
    
    try:
        # Try Clarifai first (primary method)
        logger.info("🛰️ Starting Clarifai satellite image analysis...")
        result = await analyze_with_clarifai(image_data, coordinates, demo_mode)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        result["processing_time_seconds"] = processing_time
        result["analysis_method"] = "clarifai"
        
        logger.info(f"✅ Clarifai analysis complete: {result['dryness_score']:.2f} dryness in {processing_time:.1f}s")
        return result
        
    except Exception as clarifai_error:
        logger.warning(f"⚠️ Clarifai analysis failed: {str(clarifai_error)}")
        logger.info("🔄 Falling back to Anthropic Vision API...")
        
        try:
            # Fallback to Anthropic Vision API
            result = await analyze_with_anthropic(image_data, coordinates, demo_mode)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            result["processing_time_seconds"] = processing_time
            result["analysis_method"] = "anthropic_fallback"
            result["clarifai_error"] = str(clarifai_error)
            
            logger.info(f"✅ Anthropic fallback complete: {result['dryness_score']:.2f} dryness in {processing_time:.1f}s")
            return result
            
        except Exception as anthropic_error:
            logger.error(f"❌ Both Clarifai and Anthropic analysis failed")
            logger.error(f"Clarifai error: {clarifai_error}")
            logger.error(f"Anthropic error: {anthropic_error}")
            
            # Return error result with demo data for graceful degradation
            processing_time = (datetime.now() - start_time).total_seconds()
            return {
                "dryness_score": 0.5,  # Default moderate dryness
                "confidence": 0.1,     # Very low confidence
                "tile_date": datetime.now().strftime("%Y-%m-%d"),
                "processing_time_seconds": processing_time,
                "analysis_method": "error_fallback",
                "errors": {
                    "clarifai": str(clarifai_error),
                    "anthropic": str(anthropic_error)
                },
                "status": "degraded"
            }


async def analyze_with_clarifai(image_data: bytes, coordinates: Dict[str, float], demo_mode: bool = False) -> Dict[str, Any]:
    """
    Analyze satellite image using Clarifai's pre-trained satellite models
    """
    if not CLARIFAI_PAT:
        raise SatelliteAnalysisError("CLARIFAI_PAT not configured")
    
    if demo_mode:
        # Return cached demo results for faster processing
        await asyncio.sleep(0.3)
        return {
            "dryness_score": 0.68,
            "confidence": 0.92,
            "tile_date": datetime.now().strftime("%Y-%m-%d"),
            "model_used": "demo_mode",
            "vegetation_type": "mixed_grassland"
        }
    
    try:
        # Use the enhanced Clarifai NDVI analysis
        from apps.shared.utils.clarifai_ndvi import get_dryness_score
        
        logger.info("📡 Sending image to Clarifai Crop Health NDVI model...")
        dryness_score, confidence = get_dryness_score(image_data)
        
        if dryness_score < 0:
            raise SatelliteAnalysisError("Clarifai analysis returned error state")
        
        # Determine vegetation type based on dryness score
        if dryness_score > 0.8:
            vegetation_type = "severely_stressed_vegetation"
        elif dryness_score > 0.6:
            vegetation_type = "moderately_dry_vegetation"
        elif dryness_score > 0.3:
            vegetation_type = "slightly_dry_vegetation"
        else:
            vegetation_type = "healthy_vegetation"
        
        return {
            "dryness_score": float(dryness_score),
            "confidence": float(confidence),
            "tile_date": datetime.now().strftime("%Y-%m-%d"),
            "model_used": "clarifai_crop_health_ndvi",
            "vegetation_type": vegetation_type,
            "coordinates": coordinates,
            "analysis_source": "live_clarifai_api"
        }
        
    except ImportError:
        raise SatelliteAnalysisError("Clarifai SDK not installed: pip install clarifai")
    except Exception as e:
        raise SatelliteAnalysisError(f"Clarifai analysis error: {str(e)}")


async def analyze_with_anthropic(image_data: bytes, coordinates: Dict[str, float], demo_mode: bool = False) -> Dict[str, Any]:
    """
    Analyze satellite image using Anthropic Vision API as fallback
    """
    if not ANTHROPIC_API_KEY:
        raise SatelliteAnalysisError("ANTHROPIC_API_KEY not configured")
    
    if demo_mode:
        await asyncio.sleep(0.5)
        return {
            "dryness_score": 0.72,
            "confidence": 0.85,
            "tile_date": datetime.now().strftime("%Y-%m-%d"),
            "model_used": "demo_mode_anthropic",
            "vegetation_analysis": "simulated_analysis"
        }
    
    try:
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Prepare the vision analysis prompt
        analysis_prompt = f"""
        You are analyzing a satellite image for wildfire risk assessment in Hawaii at coordinates {coordinates['latitude']:.4f}°N, {coordinates['longitude']:.4f}°W.

        Please analyze this satellite image and assess the vegetation dryness level. Consider:
        
        1. Vegetation color (green = healthy, brown/yellow = dry)
        2. Vegetation density and coverage
        3. Soil moisture indicators
        4. Seasonal patterns typical for Hawaiian Islands
        5. Any visible stress indicators in vegetation
        
        Respond with a JSON object containing:
        {{
            "dryness_score": <float 0-1 where 0=very moist, 1=extremely dry>,
            "confidence": <float 0-1 indicating analysis confidence>,
            "vegetation_type": "<brief description>",
            "key_indicators": ["<list of visual indicators observed>"],
            "reasoning": "<brief explanation of the dryness assessment>"
        }}
        
        Focus on providing an accurate dryness score that reflects wildfire risk potential.
        """
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": "claude-3-sonnet-20241022",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": analysis_prompt
                        },
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_base64
                            }
                        }
                    ]
                }
            ]
        }
        
        logger.info("📡 Sending image to Anthropic Vision API...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload
            )
            
            if response.status_code != 200:
                raise SatelliteAnalysisError(f"Anthropic API error: {response.status_code} - {response.text}")
            
            result = response.json()
            content = result["content"][0]["text"]
            
            # Parse JSON response
            import json
            try:
                # Extract JSON from response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    analysis_data = json.loads(content[json_start:json_end])
                else:
                    raise ValueError("No JSON found in response")
                
                return {
                    "dryness_score": float(analysis_data.get("dryness_score", 0.5)),
                    "confidence": float(analysis_data.get("confidence", 0.7)),
                    "tile_date": datetime.now().strftime("%Y-%m-%d"),
                    "model_used": "anthropic_claude_3_sonnet",
                    "vegetation_type": analysis_data.get("vegetation_type", "unknown"),
                    "reasoning": analysis_data.get("reasoning", ""),
                    "coordinates": coordinates
                }
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse Anthropic JSON response: {e}")
                # Fallback parsing - extract dryness score from text
                import re
                dryness_match = re.search(r'dryness["\s:]*([0-9.]+)', content, re.IGNORECASE)
                confidence_match = re.search(r'confidence["\s:]*([0-9.]+)', content, re.IGNORECASE)
                
                dryness_score = float(dryness_match.group(1)) if dryness_match else 0.5
                confidence = float(confidence_match.group(1)) if confidence_match else 0.7
                
                return {
                    "dryness_score": dryness_score,
                    "confidence": confidence,
                    "tile_date": datetime.now().strftime("%Y-%m-%d"),
                    "model_used": "anthropic_claude_3_sonnet_text_parsed",
                    "raw_response": content,
                    "coordinates": coordinates
                }
                
    except Exception as e:
        raise SatelliteAnalysisError(f"Anthropic analysis error: {str(e)}")


async def test_satellite_analysis_systems() -> Dict[str, Any]:
    """
    Test both Clarifai and Anthropic satellite analysis systems
    """
    results = {
        "clarifai": {"status": "unknown", "error": None},
        "anthropic": {"status": "unknown", "error": None},
        "timestamp": datetime.now().isoformat()
    }
    
    # Test Clarifai using the enhanced module
    try:
        from apps.shared.utils.clarifai_ndvi import test_clarifai_connection
        
        if CLARIFAI_PAT:
            clarifai_works = test_clarifai_connection()
            if clarifai_works:
                results["clarifai"]["status"] = "configured"
                results["clarifai"]["message"] = "Crop Health NDVI model accessible"
            else:
                results["clarifai"]["status"] = "connection_failed"
                results["clarifai"]["error"] = "Model connection test failed"
        else:
            results["clarifai"]["status"] = "not_configured"
            results["clarifai"]["error"] = "CLARIFAI_PAT not set"
    except ImportError:
        results["clarifai"]["status"] = "sdk_missing"
        results["clarifai"]["error"] = "Clarifai SDK not installed"
    except Exception as e:
        results["clarifai"]["status"] = "error"
        results["clarifai"]["error"] = str(e)
    
    # Test Anthropic
    try:
        if ANTHROPIC_API_KEY:
            async with httpx.AsyncClient() as client:
                headers = {
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                }
                response = await client.get("https://api.anthropic.com/v1/models", headers=headers, timeout=10.0)
                if response.status_code == 200:
                    results["anthropic"]["status"] = "healthy"
                    results["anthropic"]["message"] = "Vision API accessible"
                else:
                    results["anthropic"]["status"] = "api_error"
                    results["anthropic"]["error"] = f"HTTP {response.status_code}"
        else:
            results["anthropic"]["status"] = "not_configured"
            results["anthropic"]["error"] = "ANTHROPIC_API_KEY not set"
    except Exception as e:
        results["anthropic"]["status"] = "error"
        results["anthropic"]["error"] = str(e)
    
    return results 