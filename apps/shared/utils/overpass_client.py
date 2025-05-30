import os
import json
import logging
import requests
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime, timedelta
import math

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
CACHE_DIR = Path("data/cache/overpass")
CACHE_EXPIRY_HOURS = 24
SEARCH_RADIUS_M = 500  # 500 meter radius
TIMEOUT_SECONDS = 5


def get_cache_path(lat: float, lon: float) -> Path:
    """Generate cache file path for overpass data"""
    coord_hash = f"{lat:.6f}_{lon:.6f}".replace(".", "_").replace("-", "n")
    return CACHE_DIR / f"power_{coord_hash}.json"


def is_cache_valid(cache_path: Path) -> bool:
    """Check if cached overpass data is still valid"""
    if not cache_path.exists():
        return False
    
    cache_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
    return cache_age < timedelta(hours=CACHE_EXPIRY_HOURS)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    
    # Convert to radians
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = (math.sin(delta_lat/2) ** 2 + 
         math.cos(lat1_r) * math.cos(lat2_r) * math.sin(delta_lon/2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def build_overpass_query(lat: float, lon: float, radius_m: int = SEARCH_RADIUS_M) -> str:
    """Build Overpass API query for power infrastructure"""
    return f"""
    [out:json][timeout:{TIMEOUT_SECONDS}];
    (
      way["power"="line"](around:{radius_m},{lat},{lon});
      way["power"="minor_line"](around:{radius_m},{lat},{lon});
      node["power"="tower"](around:{radius_m},{lat},{lon});
      node["power"="pole"](around:{radius_m},{lat},{lon});
    );
    out geom;
    """


def get_power_line_data(lat: float, lon: float, demo_mode: bool = False) -> Optional[Dict[str, Any]]:
    """
    Get power line infrastructure data from Overpass API.
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate
        demo_mode: Use cached data if available
    
    Returns:
        Dictionary with power line analysis or None if failed
    """
    try:
        cache_path = get_cache_path(lat, lon)
        
        # Check cache first
        if cache_path.exists():
            if demo_mode or is_cache_valid(cache_path):
                logger.info(f"Using cached power line data: {cache_path}")
                return json.loads(cache_path.read_text())
        
        # If demo mode and no cache, return demo data
        if demo_mode:
            logger.warning(f"Demo mode: no cached power line data for {lat}, {lon}, using demo data")
            return create_demo_power_data(lat, lon)
        
        # Fetch live data from Overpass API
        return fetch_overpass_live(lat, lon)
    
    except Exception as e:
        logger.error(f"Failed to get power line data: {str(e)}")
        return None


def fetch_overpass_live(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Fetch live power line data from Overpass API"""
    try:
        query = build_overpass_query(lat, lon)
        
        logger.info(f"Querying Overpass API for power lines near {lat}, {lon}")
        
        response = requests.post(
            OVERPASS_URL,
            data=query,
            timeout=TIMEOUT_SECONDS,
            headers={'Content-Type': 'text/plain; charset=utf-8'}
        )
        
        response.raise_for_status()
        overpass_data = response.json()
        
        # Analyze the results
        analysis = analyze_power_infrastructure(overpass_data, lat, lon)
        
        # Cache the results
        cache_path = get_cache_path(lat, lon)
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(json.dumps(analysis, indent=2))
        
        logger.info(f"Found {analysis['count']} power features, "
                   f"nearest: {analysis['nearest_distance_m']:.1f}m")
        
        return analysis
    
    except requests.Timeout:
        logger.warning(f"Overpass API timeout for {lat}, {lon}")
        return create_fallback_power_data(lat, lon)
    except requests.RequestException as e:
        logger.error(f"Overpass API request failed: {str(e)}")
        return create_fallback_power_data(lat, lon)
    except Exception as e:
        logger.error(f"Overpass data processing failed: {str(e)}")
        return create_fallback_power_data(lat, lon)


def analyze_power_infrastructure(overpass_data: Dict[str, Any], center_lat: float, center_lon: float) -> Dict[str, Any]:
    """Analyze Overpass API results for power infrastructure"""
    elements = overpass_data.get("elements", [])
    
    power_lines = []
    transmission_towers = []
    power_poles = []
    
    # Categorize elements
    for element in elements:
        tags = element.get("tags", {})
        power_type = tags.get("power", "")
        
        if power_type in ["line", "minor_line"]:
            power_lines.append(element)
        elif power_type == "tower":
            transmission_towers.append(element)
        elif power_type == "pole":
            power_poles.append(element)
    
    # Calculate distances to nearest infrastructure
    min_distance = float('inf')
    
    # Check distances to power lines
    for line in power_lines:
        if "geometry" in line:
            for node in line["geometry"]:
                distance = calculate_distance(center_lat, center_lon, node["lat"], node["lon"])
                min_distance = min(min_distance, distance)
        elif "lat" in line and "lon" in line:
            distance = calculate_distance(center_lat, center_lon, line["lat"], line["lon"])
            min_distance = min(min_distance, distance)
    
    # Check distances to towers and poles
    for feature in transmission_towers + power_poles:
        if "lat" in feature and "lon" in feature:
            distance = calculate_distance(center_lat, center_lon, feature["lat"], feature["lon"])
            min_distance = min(min_distance, distance)
    
    # If no infrastructure found, set distance to search radius
    if min_distance == float('inf'):
        min_distance = SEARCH_RADIUS_M
    
    return {
        "count": len(power_lines),
        "transmission_towers": len(transmission_towers),
        "power_poles": len(power_poles),
        "nearest_distance_m": round(min_distance, 1),
        "total_features": len(elements),
        "search_radius_m": SEARCH_RADIUS_M,
        "center_lat": center_lat,
        "center_lon": center_lon,
        "source": "overpass_live",
        "cached_at": datetime.now().isoformat()
    }


def create_demo_power_data(lat: float, lon: float) -> Dict[str, Any]:
    """Create realistic demo power line data for Hawaii"""
    return {
        "count": 3,
        "transmission_towers": 1,
        "power_poles": 2,
        "nearest_distance_m": 230.0,
        "total_features": 6,
        "search_radius_m": SEARCH_RADIUS_M,
        "center_lat": lat,
        "center_lon": lon,
        "source": "demo",
        "cached_at": datetime.now().isoformat()
    }


def create_fallback_power_data(lat: float, lon: float) -> Dict[str, Any]:
    """Create fallback power line data when API fails"""
    return {
        "count": 0,
        "transmission_towers": 0,
        "power_poles": 0,
        "nearest_distance_m": SEARCH_RADIUS_M,  # Assume no power lines nearby
        "total_features": 0,
        "search_radius_m": SEARCH_RADIUS_M,
        "center_lat": lat,
        "center_lon": lon,
        "source": "fallback",
        "cached_at": datetime.now().isoformat()
    }


def test_overpass_connection() -> bool:
    """Test Overpass API connection"""
    try:
        # Simple test query
        test_query = "[out:json][timeout:5]; way[highway](around:100,21.3099,-157.8581); out count;"
        
        response = requests.post(
            OVERPASS_URL,
            data=test_query,
            timeout=10,
            headers={'Content-Type': 'text/plain; charset=utf-8'}
        )
        
        return response.status_code == 200
    
    except Exception as e:
        logger.error(f"Overpass connection test failed: {str(e)}")
        return False


def preload_demo_data():
    """Preload power line data for common demo locations"""
    demo_locations = [
        (21.3099, -157.8581),  # Honolulu
        (20.8783, -156.6825),  # Maui
        (19.6962, -155.5828),  # Big Island
    ]
    
    for lat, lon in demo_locations:
        try:
            cache_path = get_cache_path(lat, lon)
            if not cache_path.exists():
                data = fetch_overpass_live(lat, lon)
                if data:
                    cache_path.parent.mkdir(parents=True, exist_ok=True)
                    cache_path.write_text(json.dumps(data, indent=2))
                    logger.info(f"Preloaded power data for {lat}, {lon}")
        except Exception as e:
            logger.error(f"Failed to preload power data for {lat}, {lon}: {str(e)}") 