import os
import base64
import logging
from typing import Tuple
from clarifai.client.model import Model

logger = logging.getLogger(__name__)

# Clarifai model for Crop Health NDVI analysis
CROP_HEALTH_MODEL_URL = "https://clarifai.com/clarifai/main/models/crop-health-NDVI"
LANDCOVER_MODEL_URL = "https://clarifai.com/clarifai/main/models/land-cover-classification"
GENERAL_MODEL_URL = "https://clarifai.com/clarifai/main/models/general-image-recognition"


def ndvi_to_dryness(ndvi: float) -> float:
    """
    Convert NDVI value to dryness score.
    NDVI: -1 (water) → 1 (lush vegetation)
    Dryness: 0 (wet) → 1 (very dry)
    """
    # Ensure NDVI is in valid range and convert to dryness
    # Healthy vegetation (NDVI > 0.3) = low dryness
    # Stressed vegetation (NDVI 0-0.3) = medium dryness  
    # No vegetation (NDVI < 0) = high dryness
    if ndvi > 0.7:
        return 0.0  # Very healthy vegetation = no dryness
    elif ndvi > 0.3:
        return (0.7 - ndvi) / 0.4  # Linear mapping from 0.3-0.7 NDVI to 1.0-0.0 dryness
    else:
        return min(1.0, 0.5 + (0.3 - max(ndvi, -1)) / 2.6)  # Higher dryness for low/negative NDVI


def get_dryness_score(png_bytes: bytes) -> Tuple[float, float]:
    """
    Analyze PNG satellite imagery using Clarifai's Crop Health NDVI model.
    
    Args:
        png_bytes: Satellite imagery as PNG bytes (should be < 600KB)
    
    Returns:
        Tuple[dryness_score, confidence]
        - dryness_score: 0-1 where 1 is extremely dry
        - confidence: 0-1 confidence in the analysis
    """
    try:
        # Validate environment variables
        pat = os.getenv("CLARIFAI_PAT")
        if not pat:
            logger.error("CLARIFAI_PAT environment variable not set")
            return -1.0, 0.0
        
        # Check image size
        if len(png_bytes) > 600_000:  # 600KB limit
            logger.warning(f"PNG size {len(png_bytes)} bytes exceeds 600KB recommendation")
        
        logger.info(f"🔍 Analyzing {len(png_bytes)} bytes with Clarifai Crop Health NDVI model...")
        
        # Try Crop Health NDVI model first (primary)
        try:
            model = Model(url=CROP_HEALTH_MODEL_URL, pat=pat)
            prediction = model.predict_by_bytes(png_bytes, input_type="image")
            
            if prediction and prediction.outputs:
                output = prediction.outputs[0]
                
                if hasattr(output, 'data') and hasattr(output.data, 'concepts'):
                    concepts = output.data.concepts
                    
                    # Look for NDVI-related concepts
                    for concept in concepts:
                        concept_name = concept.name.lower()
                        if 'ndvi' in concept_name or 'health' in concept_name:
                            ndvi_value = concept.value
                            confidence = concept.value
                            
                            # Convert concept value to meaningful NDVI range
                            # Clarifai concept values are 0-1, map to NDVI range -1 to 1
                            mapped_ndvi = (ndvi_value * 2) - 1
                            dryness = ndvi_to_dryness(mapped_ndvi)
                            
                            logger.info(f"✅ Clarifai NDVI analysis: concept='{concept.name}', value={ndvi_value:.3f}, mapped_ndvi={mapped_ndvi:.3f}, dryness={dryness:.3f}")
                            return dryness, confidence
                    
                    # If no NDVI concept found, use first concept as general health indicator
                    if concepts:
                        health_value = concepts[0].value
                        dryness = 1.0 - health_value  # Invert health to get dryness
                        logger.info(f"✅ Clarifai health analysis: {concepts[0].name}={health_value:.3f}, dryness={dryness:.3f}")
                        return dryness, 0.8
                        
        except Exception as crop_error:
            logger.warning(f"Crop Health NDVI model failed: {crop_error}")
            
        # Try Land Cover Classification model (fallback)
        try:
            logger.info("🔄 Trying Land Cover Classification model...")
            model = Model(url=LANDCOVER_MODEL_URL, pat=pat)
            prediction = model.predict_by_bytes(png_bytes, input_type="image")
            
            if prediction and prediction.outputs:
                output = prediction.outputs[0]
                
                if hasattr(output, 'data') and hasattr(output.data, 'concepts'):
                    concepts = output.data.concepts
                    
                    # Analyze land cover types for vegetation dryness indicators
                    vegetation_confidence = 0.0
                    dry_indicators = 0.0
                    
                    for concept in concepts[:10]:  # Check top 10 concepts
                        concept_name = concept.name.lower()
                        
                        # Look for dry/stressed vegetation indicators
                        if any(term in concept_name for term in ['dry', 'barren', 'bare', 'sparse', 'desert']):
                            dry_indicators += concept.value
                        elif any(term in concept_name for term in ['green', 'dense', 'forest', 'healthy', 'lush']):
                            vegetation_confidence += concept.value
                    
                    # Calculate dryness based on land cover analysis
                    dryness = min(1.0, dry_indicators + (1.0 - vegetation_confidence))
                    confidence = max(dry_indicators, vegetation_confidence)
                    
                    logger.info(f"✅ Clarifai land cover: dry_indicators={dry_indicators:.3f}, vegetation={vegetation_confidence:.3f}, dryness={dryness:.3f}")
                    return dryness, confidence
                    
        except Exception as landcover_error:
            logger.warning(f"Land Cover model failed: {landcover_error}")
        
        # Final fallback to general image recognition
        logger.info("🔄 Trying General Image Recognition model...")
        model = Model(url=GENERAL_MODEL_URL, pat=pat)
        prediction = model.predict_by_bytes(png_bytes, input_type="image")
        
        if prediction and prediction.outputs:
            output = prediction.outputs[0]
            
            if hasattr(output, 'data') and hasattr(output.data, 'concepts'):
                concepts = output.data.concepts
                vegetation_score = 0.0
                
                for concept in concepts[:5]:  # Check top 5 concepts
                    concept_name = concept.name.lower()
                    if any(veg_term in concept_name for veg_term in ['green', 'vegetation', 'plant', 'forest', 'grass', 'tree']):
                        vegetation_score = max(vegetation_score, concept.value)
                
                # Convert vegetation confidence to dryness (inverse)
                dryness = 1.0 - vegetation_score
                logger.info(f"✅ Clarifai general: vegetation_score={vegetation_score:.3f}, dryness={dryness:.3f}")
                return dryness, 0.6  # Lower confidence for general model
        
        logger.error("❌ No valid analysis from any Clarifai model")
        return -1.0, 0.0
        
    except Exception as e:
        logger.error(f"❌ Clarifai analysis failed: {str(e)}")
        return -1.0, 0.0


def test_clarifai_connection() -> bool:
    """
    Test if Clarifai API is accessible and working
    """
    if not CLARIFAI_PAT:
        logger.error("❌ CLARIFAI_PAT not configured")
        return False
    
    try:
        from clarifai.client.model import Model
        
        # Test with a simple image
        test_url = "https://samples.clarifai.com/metro-north.jpg"
        
        model = Model(url=GENERAL_MODEL_URL, pat=CLARIFAI_PAT)
        prediction = model.predict_by_url(test_url)
        
        if prediction and prediction.outputs and len(prediction.outputs) > 0:
            logger.info("✅ Clarifai general image recognition model accessible")
            return True
        else:
            logger.error("❌ Clarifai model returned no valid outputs")
            return False
            
    except Exception as e:
        logger.error(f"❌ Clarifai connection test failed: {e}")
        return False 