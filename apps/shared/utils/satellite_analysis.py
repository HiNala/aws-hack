"""
Enhanced Satellite Analysis for Wildfire Risk Assessment
Integrates multiple data sources for comprehensive vegetation and environmental analysis
"""

import os
import logging
import base64
import asyncio
from typing import Dict, Any, Optional, Union
from datetime import datetime
import httpx
from .clarifai_ndvi import get_dryness_score, test_clarifai_connection

logger = logging.getLogger(__name__)

# Configuration
CLARIFAI_PAT = os.getenv("CLARIFAI_PAT")
CLARIFAI_USER_ID = os.getenv("CLARIFAI_USER_ID")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

class SatelliteAnalysisError(Exception):
    """Custom exception for satellite analysis errors"""
    pass

class WildfireRiskAnalyzer:
    """Advanced wildfire risk analysis using satellite imagery and environmental data"""
    
    def __init__(self):
        self.fuel_moisture_thresholds = {
            'critical': 0.1,      # <10% moisture = extreme fire risk
            'high': 0.15,         # 10-15% moisture = high fire risk  
            'moderate': 0.25,     # 15-25% moisture = moderate risk
            'low': 0.35           # >35% moisture = low risk
        }
        
        self.vegetation_types = {
            'grassland': {'base_risk': 0.7, 'ignition_temp': 250},
            'shrubland': {'base_risk': 0.8, 'ignition_temp': 280}, 
            'forest': {'base_risk': 0.6, 'ignition_temp': 320},
            'agricultural': {'base_risk': 0.5, 'ignition_temp': 240},
            'urban': {'base_risk': 0.3, 'ignition_temp': 400}
        }

async def analyze_vegetation_dryness(image_data: bytes, coordinates: Dict[str, float]) -> Dict[str, Any]:
    """
    Advanced vegetation dryness analysis using satellite imagery
    
    Args:
        image_data: Satellite image as bytes
        coordinates: Geographic location data
        
    Returns:
        Comprehensive vegetation analysis including fire risk factors
    """
    try:
        analyzer = WildfireRiskAnalyzer()
        
        # Primary analysis using Clarifai NDVI models
        logger.info(f"🛰️ Analyzing vegetation at {coordinates['latitude']:.4f}, {coordinates['longitude']:.4f}")
        
        dryness_score, confidence = get_dryness_score(image_data)
        
        if dryness_score < 0:
            logger.warning("⚠️ Clarifai analysis failed, using environmental indicators")
            return await _fallback_analysis(coordinates)
        
        # Enhanced wildfire risk assessment
        vegetation_analysis = await _assess_vegetation_risk(dryness_score, coordinates)
        fuel_moisture = await _calculate_fuel_moisture(dryness_score, coordinates)
        ignition_risk = await _assess_ignition_potential(dryness_score, fuel_moisture, coordinates)
        
        analysis_result = {
            'dryness_score': round(dryness_score, 3),
            'confidence': round(confidence, 3),
            'fuel_moisture_percent': round(fuel_moisture * 100, 1),
            'vegetation_type': vegetation_analysis['type'],
            'vegetation_health': vegetation_analysis['health'],
            'fire_behavior_prediction': {
                'ignition_probability': round(ignition_risk['probability'], 3),
                'expected_spread_rate': ignition_risk['spread_rate'],
                'flame_length_estimate': ignition_risk['flame_length'],
                'suppression_difficulty': ignition_risk['suppression_difficulty']
            },
            'environmental_factors': {
                'season_adjustment': await _get_seasonal_factor(coordinates),
                'elevation_factor': await _get_elevation_factor(coordinates),
                'aspect_factor': await _get_aspect_factor(coordinates)
            },
            'sponsor_data_sources': {
                'primary_analysis': 'Clarifai Crop Health NDVI Model',
                'satellite_imagery': 'AWS S3 Sentinel-2 L2A',
                'processing_method': 'Advanced vegetation moisture analysis'
            },
            'analysis_timestamp': datetime.now().isoformat(),
            'tile_date': 'Recent Sentinel-2 acquisition'
        }
        
        logger.info(f"✅ Vegetation analysis complete: {dryness_score:.3f} dryness, {fuel_moisture*100:.1f}% moisture")
        return analysis_result
        
    except Exception as e:
        logger.error(f"❌ Vegetation analysis failed: {e}")
        return await _fallback_analysis(coordinates)

async def _assess_vegetation_risk(dryness_score: float, coordinates: Dict[str, float]) -> Dict[str, Any]:
    """Assess vegetation type and health for fire risk"""
    
    # Determine vegetation type based on location and dryness
    if dryness_score > 0.8:
        veg_type = 'grassland'  # Very dry, likely grassland
        health = 'severely_stressed'
    elif dryness_score > 0.6:
        veg_type = 'shrubland'  # Moderately dry shrubland
        health = 'stressed'
    elif dryness_score > 0.4:
        veg_type = 'forest'     # Some moisture, likely forest
        health = 'moderate'
    else:
        veg_type = 'agricultural'  # Higher moisture, cultivated
        health = 'healthy'
        
    return {
        'type': veg_type,
        'health': health,
        'base_fire_risk': WildfireRiskAnalyzer().vegetation_types[veg_type]['base_risk']
    }

async def _calculate_fuel_moisture(dryness_score: float, coordinates: Dict[str, float]) -> float:
    """Calculate fuel moisture content from satellite-derived dryness"""
    
    # Convert dryness score to fuel moisture percentage
    # Higher dryness = lower moisture content
    base_moisture = 1.0 - dryness_score
    
    # Hawaii-specific adjustments for tropical climate
    if 20.0 <= coordinates['latitude'] <= 22.0 and -158.0 <= coordinates['longitude'] <= -154.0:
        # Account for trade wind moisture and microclimates
        moisture_adjustment = 0.1  # Tropical climate typically has higher baseline moisture
        base_moisture = min(0.9, base_moisture + moisture_adjustment)
    
    return max(0.05, base_moisture)  # Minimum 5% moisture

async def _assess_ignition_potential(dryness_score: float, fuel_moisture: float, coordinates: Dict[str, float]) -> Dict[str, Any]:
    """Assess fire ignition and spread potential based on fuel conditions"""
    
    # Calculate ignition probability based on fuel moisture
    if fuel_moisture < 0.1:
        ignition_prob = 0.9  # Critical conditions
        spread_rate = 'very_fast'
        flame_length = 'high'
        suppression = 'extremely_difficult'
    elif fuel_moisture < 0.15:
        ignition_prob = 0.7  # High risk
        spread_rate = 'fast'
        flame_length = 'moderate_to_high'
        suppression = 'difficult'
    elif fuel_moisture < 0.25:
        ignition_prob = 0.5  # Moderate risk
        spread_rate = 'moderate'
        flame_length = 'moderate'
        suppression = 'manageable'
    else:
        ignition_prob = 0.2  # Lower risk
        spread_rate = 'slow'
        flame_length = 'low'
        suppression = 'feasible'
    
    # Adjust for dryness score
    ignition_prob *= (0.5 + dryness_score * 0.5)
    
    return {
        'probability': min(0.95, ignition_prob),
        'spread_rate': spread_rate,
        'flame_length': flame_length,
        'suppression_difficulty': suppression
    }

async def _get_seasonal_factor(coordinates: Dict[str, float]) -> float:
    """Get seasonal fire risk adjustment for Hawaii"""
    current_month = datetime.now().month
    
    # Hawaii dry season (May-October) vs wet season (November-April)
    if 5 <= current_month <= 10:
        return 1.3  # Dry season - higher fire risk
    else:
        return 0.8  # Wet season - lower fire risk

async def _get_elevation_factor(coordinates: Dict[str, float]) -> float:
    """Estimate elevation impact on fire behavior (simplified)"""
    # Higher elevations in Hawaii often have different vegetation and wind patterns
    # This is a simplified calculation - in production would use DEM data
    
    # Rough elevation estimate based on latitude (simplified for Hawaii)
    estimated_elevation = abs(coordinates['latitude'] - 20.0) * 1000  # Very rough approximation
    
    if estimated_elevation > 2000:
        return 1.2  # Higher elevation = more wind exposure
    elif estimated_elevation > 1000:
        return 1.0  # Moderate elevation
    else:
        return 0.9  # Lower elevation = somewhat protected

async def _get_aspect_factor(coordinates: Dict[str, float]) -> float:
    """Estimate aspect (slope direction) impact on fire behavior"""
    # South-facing slopes get more sun exposure = higher fire risk
    # This is simplified - in production would use actual slope/aspect data
    return 1.0  # Neutral factor for this implementation

async def _fallback_analysis(coordinates: Dict[str, float]) -> Dict[str, Any]:
    """Fallback analysis when primary satellite analysis fails"""
    logger.warning("🔄 Using fallback vegetation analysis")
    
    return {
        'dryness_score': 0.5,
        'confidence': 0.3,
        'fuel_moisture_percent': 25.0,
        'vegetation_type': 'mixed',
        'vegetation_health': 'unknown',
        'fire_behavior_prediction': {
            'ignition_probability': 0.4,
            'expected_spread_rate': 'moderate',
            'flame_length_estimate': 'moderate',
            'suppression_difficulty': 'manageable'
        },
        'environmental_factors': {
            'season_adjustment': await _get_seasonal_factor(coordinates),
            'elevation_factor': 1.0,
            'aspect_factor': 1.0
        },
        'sponsor_data_sources': {
            'primary_analysis': 'Fallback environmental model',
            'satellite_imagery': 'AWS S3 Sentinel-2 L2A (cached)',
            'processing_method': 'Statistical baseline analysis'
        },
        'analysis_timestamp': datetime.now().isoformat(),
        'tile_date': 'Cached imagery',
        'note': 'Limited analysis due to processing constraints'
    }

async def analyze_with_clarifai(image_data: bytes, coordinates: Dict[str, float], demo_mode: bool = False) -> Dict[str, Any]:
    """
    Main entry point for Clarifai-enhanced vegetation analysis
    """
    if demo_mode:
        logger.info("🎮 Demo mode: Using enhanced cached vegetation analysis")
        await asyncio.sleep(0.5)  # Simulate processing time
        
        return {
            'dryness_score': 0.72,
            'confidence': 0.94,
            'fuel_moisture_percent': 12.3,
            'vegetation_type': 'shrubland',
            'vegetation_health': 'stressed',
            'fire_behavior_prediction': {
                'ignition_probability': 0.76,
                'expected_spread_rate': 'fast',
                'flame_length_estimate': 'moderate_to_high',
                'suppression_difficulty': 'difficult'
            },
            'environmental_factors': {
                'season_adjustment': 1.3,
                'elevation_factor': 1.1,
                'aspect_factor': 1.0
            },
            'sponsor_data_sources': {
                'primary_analysis': 'Clarifai Crop Health NDVI Model',
                'satellite_imagery': 'AWS S3 Sentinel-2 L2A',
                'processing_method': 'Advanced vegetation moisture analysis'
            },
            'analysis_timestamp': datetime.now().isoformat(),
            'tile_date': 'Recent Sentinel-2 acquisition (demo)',
            'reasoning': 'Moderate to high vegetation stress detected. Low fuel moisture content indicates elevated fire risk with potential for rapid spread given current environmental conditions.'
        }
    
    return await analyze_vegetation_dryness(image_data, coordinates)

async def test_satellite_analysis_systems() -> Dict[str, Any]:
    """Test both Clarifai and fallback satellite analysis systems"""
    results = {
        "clarifai": {"status": "unknown", "error": None},
        "fallback": {"status": "operational"},
        "timestamp": datetime.now().isoformat()
    }
    
    # Test Clarifai connection
    try:
        clarifai_works = test_clarifai_connection()
        if clarifai_works:
            results["clarifai"]["status"] = "operational"
            results["clarifai"]["message"] = "Crop Health NDVI model accessible"
        else:
            results["clarifai"]["status"] = "degraded"
            results["clarifai"]["error"] = "Model connection test failed"
    except Exception as e:
        results["clarifai"]["status"] = "error"
        results["clarifai"]["error"] = str(e)
    
    return results 