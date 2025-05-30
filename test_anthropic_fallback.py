#!/usr/bin/env python3
"""
Test Anthropic Fallback Functionality
Verifies that when Clarifai fails, the system properly falls back to Anthropic Vision API
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from dotenv import load_dotenv
load_dotenv()

# Import the satellite analysis functions
from apps.shared.utils.satellite_analysis import _anthropic_vegetation_analysis, test_satellite_analysis_systems

async def test_anthropic_fallback():
    """Test the Anthropic Vision API fallback functionality"""
    print("🧪 Testing Anthropic Fallback Functionality")
    print("=" * 60)
    
    # Test coordinates for West Maui
    test_coordinates = {
        "latitude": 20.8783,
        "longitude": -156.6825
    }
    
    # Create a dummy image (simple PNG header)
    # In real usage, this would be actual satellite imagery
    dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x02\x1a\xc2\xc9\x00\x00\x00\x00IEND\xaeB`\x82'
    
    print(f"📍 Test Location: West Maui ({test_coordinates['latitude']:.4f}°N, {test_coordinates['longitude']:.4f}°W)")
    print(f"🛰️ Using test satellite image data ({len(dummy_image)} bytes)")
    print()
    
    # Test the Anthropic fallback directly
    print("🔍 Testing Anthropic Vision API fallback...")
    try:
        dryness_score, confidence, method = await _anthropic_vegetation_analysis(
            dummy_image, 
            test_coordinates
        )
        
        if dryness_score >= 0:
            print(f"✅ Anthropic fallback: SUCCESS")
            print(f"   📊 Dryness Score: {dryness_score:.3f}")
            print(f"   📈 Confidence: {confidence:.3f}")
            print(f"   🔧 Method: {method}")
            print(f"   🎯 Result: {'HIGH RISK' if dryness_score > 0.7 else 'MODERATE RISK' if dryness_score > 0.4 else 'LOW RISK'}")
        else:
            print(f"❌ Anthropic fallback: FAILED")
            print(f"   Error: {method}")
            return False
            
    except Exception as e:
        print(f"❌ Anthropic fallback: EXCEPTION")
        print(f"   Error: {str(e)}")
        return False
    
    print()
    
    # Test the overall satellite analysis system status
    print("🔍 Testing satellite analysis system status...")
    try:
        system_status = await test_satellite_analysis_systems()
        
        print(f"📡 Clarifai Status: {system_status['clarifai']['status']}")
        print(f"🧠 Anthropic Status: {system_status['anthropic']['status']}")
        print(f"🔄 Fallback Status: {system_status['fallback']['status']}")
        
        # Check if fallback is operational
        if system_status['anthropic']['status'] == 'healthy':
            print("✅ Fallback system is fully operational!")
            return True
        else:
            print(f"⚠️ Fallback system issues: {system_status['anthropic'].get('error', 'Unknown')}")
            return False
            
    except Exception as e:
        print(f"❌ System status check failed: {str(e)}")
        return False

async def test_make_webhook_payload():
    """Test Make.com webhook payload generation"""
    print("\n🔗 Testing Make.com Webhook Integration")
    print("=" * 60)
    
    from apps.shared.utils.make_webhook import prepare_webhook_payload, test_make_webhook
    
    # Create mock analysis data
    mock_analysis = {
        "analysis_id": "test_fallback_001",
        "request": type('obj', (object,), {
            "latitude": 20.8783,
            "longitude": -156.6825,
            "demo_mode": False
        })(),
        "risk_assessment": type('obj', (object,), {
            "severity": "HIGH",
            "risk_level": 0.75,
            "confidence": 0.88,
            "rationale": "High vegetation dryness combined with low humidity and moderate wind speeds create elevated wildfire risk conditions."
        })(),
        "weather": type('obj', (object,), {
            "temperature_f": 84,
            "humidity_percent": 35,
            "wind_speed_mph": 12,
            "conditions": "Partly Cloudy"
        })(),
        "satellite": type('obj', (object,), {
            "dryness_score": 0.72,
            "confidence": 0.88,
            "tile_date": "2025-01-30",
            "model_used": "Anthropic Vision API (fallback)"
        })(),
        "power_lines": type('obj', (object,), {
            "count": 3,
            "nearest_distance_m": 150
        })(),
        "processing_time_seconds": 8.5
    }
    
    print("📤 Generating webhook payload...")
    try:
        payload = prepare_webhook_payload(mock_analysis)
        
        print(f"✅ Payload generated successfully")
        print(f"   📋 Jira Summary: {payload['jira']['summary']}")
        print(f"   🚨 Priority: {payload['jira']['priority']}")
        print(f"   📊 Risk Level: {payload['analysis']['risk']['level']}")
        print(f"   🛰️ Analysis Method: {payload['environment']['satellite']['model_used']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Payload generation failed: {str(e)}")
        return False

async def main():
    """Run all fallback tests"""
    print("🚀 PyroGuard Sentinel - Anthropic Fallback Test Suite")
    print("🌺 Testing AI-powered wildfire risk assessment for Hawaiian Islands")
    print("=" * 80)
    
    results = []
    
    # Test Anthropic fallback
    fallback_result = await test_anthropic_fallback()
    results.append(("Anthropic Fallback", fallback_result))
    
    # Test webhook integration
    webhook_result = await test_make_webhook_payload()
    results.append(("Make.com Webhook", webhook_result))
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 FALLBACK TEST RESULTS")
    print("=" * 80)
    
    passed_tests = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} {test_name}")
        if result:
            passed_tests += 1
    
    success_rate = (passed_tests / len(results)) * 100
    print(f"\n📈 Test Results: {passed_tests}/{len(results)} passed ({success_rate:.0f}%)")
    
    if passed_tests == len(results):
        print("🎉 All fallback systems operational!")
        print("🔥 PyroGuard Sentinel ready for wildfire risk assessment!")
    else:
        print("⚠️ Some fallback systems need attention")
    
    return passed_tests == len(results)

if __name__ == "__main__":
    asyncio.run(main()) 