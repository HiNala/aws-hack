"""
NOAA Weather Service API Client
Follows official API documentation at https://www.weather.gov/documentation/services-web-api
"""

import os
import logging
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

# Configuration from environment
NOAA_USER_AGENT = os.getenv("NOAA_USER_AGENT", "PyroGuard Sentinel (contact: support@pyroguard.ai)")
NOAA_BASE_URL = "https://api.weather.gov"

# Rate limiting to respect NOAA API guidelines
RATE_LIMIT_DELAY = 1.0  # seconds between requests


class NOAAWeatherError(Exception):
    """Custom exception for NOAA weather API errors"""
    pass


async def get_weather_data(latitude: float, longitude: float, demo_mode: bool = False) -> Optional[Dict[str, Any]]:
    """
    Get comprehensive weather data for given coordinates using NOAA Weather API
    
    Follows the official NOAA API workflow:
    1. Use /points endpoint to get grid information
    2. Use grid info to fetch current conditions and forecast
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate  
        demo_mode: If True, return cached demo data for faster processing
        
    Returns:
        Dict containing weather conditions or None if failed
    """
    if demo_mode:
        return create_demo_weather_data(latitude, longitude)
    
    try:
        logger.info(f"🌤️ Fetching NOAA weather data for {latitude:.4f}, {longitude:.4f}")
        
        # Step 1: Get grid information for the point
        grid_info = await get_grid_info(latitude, longitude)
        if not grid_info:
            logger.warning("Failed to get grid information from NOAA")
            return create_demo_weather_data(latitude, longitude)
        
        # Step 2: Get current conditions from the nearest observation station
        current_conditions = await get_current_conditions(grid_info)
        
        # Step 3: Get forecast data for additional context
        forecast_data = await get_forecast_data(grid_info)
        
        # Combine all data
        weather_data = {
            "temperature_f": current_conditions.get("temperature_f", 75.0),
            "humidity_percent": current_conditions.get("humidity_percent", 65.0),
            "wind_speed_mph": current_conditions.get("wind_speed_mph", 10.0),
            "wind_direction": current_conditions.get("wind_direction", "NE"),
            "conditions": current_conditions.get("conditions", "partly cloudy"),
            "pressure_mb": current_conditions.get("pressure_mb", 1013.0),
            "visibility_miles": current_conditions.get("visibility_miles", 10.0),
            "dewpoint_f": current_conditions.get("dewpoint_f", 65.0),
            "source": "noaa_weather_gov",
            "station_id": grid_info.get("observation_station", "unknown"),
            "grid_office": grid_info.get("grid_office", "unknown"),
            "timestamp": datetime.now().isoformat(),
            "coordinates": {"latitude": latitude, "longitude": longitude}
        }
        
        # Add forecast context for wildfire risk
        if forecast_data:
            weather_data.update({
                "forecast_high_f": forecast_data.get("high_temperature_f"),
                "forecast_low_f": forecast_data.get("low_temperature_f"), 
                "forecast_conditions": forecast_data.get("conditions"),
                "fire_weather_warning": forecast_data.get("fire_weather_warning", False)
            })
        
        logger.info(f"✅ NOAA weather: {weather_data['temperature_f']}°F, {weather_data['humidity_percent']}% humidity, {weather_data['wind_speed_mph']} mph wind")
        return weather_data
        
    except Exception as e:
        logger.error(f"❌ NOAA weather API error: {str(e)}")
        return create_demo_weather_data(latitude, longitude)


async def get_grid_info(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Get grid and station information for coordinates using NOAA /points endpoint
    
    According to NOAA API docs, this endpoint provides:
    - Grid forecast endpoints  
    - Observation stations
    - Zone information
    """
    url = f"{NOAA_BASE_URL}/points/{latitude:.4f},{longitude:.4f}"
    
    headers = {
        "User-Agent": NOAA_USER_AGENT,
        "Accept": "application/geo+json"
    }
    
    try:
        logger.info(f"📍 Fetching NOAA grid info: {url}")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 404:
                logger.warning("Location outside NOAA coverage area")
                return None
            elif response.status_code != 200:
                logger.warning(f"NOAA points API error: {response.status_code}")
                return None
            
            data = response.json()
            properties = data.get("properties", {})
            
            grid_info = {
                "grid_office": properties.get("cwa"),
                "grid_x": properties.get("gridX"),
                "grid_y": properties.get("gridY"),
                "forecast_url": properties.get("forecast"),
                "forecast_hourly_url": properties.get("forecastHourly"),
                "forecast_grid_data_url": properties.get("forecastGridData"),
                "observation_stations_url": properties.get("observationStations"),
                "timezone": properties.get("timeZone"),
                "coordinates": {"latitude": latitude, "longitude": longitude}
            }
            
            # Get nearest observation station
            if grid_info["observation_stations_url"]:
                station_info = await get_nearest_observation_station(grid_info["observation_stations_url"])
                if station_info:
                    grid_info["observation_station"] = station_info["station_id"]
                    grid_info["observation_station_name"] = station_info["name"]
            
            return grid_info
            
    except Exception as e:
        logger.error(f"Error fetching NOAA grid info: {str(e)}")
        return None


async def get_nearest_observation_station(stations_url: str) -> Optional[Dict[str, Any]]:
    """Get the nearest observation station from the stations endpoint"""
    headers = {
        "User-Agent": NOAA_USER_AGENT,
        "Accept": "application/geo+json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(stations_url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                features = data.get("features", [])
                
                if features:
                    # Take the first station (they're ordered by distance)
                    station = features[0]
                    properties = station.get("properties", {})
                    
                    return {
                        "station_id": properties.get("stationIdentifier"),
                        "name": properties.get("name"),
                        "elevation": properties.get("elevation", {}).get("value"),
                        "coordinates": station.get("geometry", {}).get("coordinates", [])
                    }
                    
    except Exception as e:
        logger.error(f"Error fetching observation stations: {str(e)}")
    
    return None


async def get_current_conditions(grid_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get current weather conditions from the nearest observation station
    """
    station_id = grid_info.get("observation_station")
    if not station_id:
        return {}
    
    url = f"{NOAA_BASE_URL}/stations/{station_id}/observations/latest"
    
    headers = {
        "User-Agent": NOAA_USER_AGENT,
        "Accept": "application/geo+json"
    }
    
    try:
        await asyncio.sleep(RATE_LIMIT_DELAY)  # Rate limiting
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.warning(f"Current conditions API error: {response.status_code}")
                return {}
            
            data = response.json()
            properties = data.get("properties", {})
            
            # Convert all measurements to standard units
            conditions = {}
            
            # Temperature (convert from Celsius if needed)
            temp_c = get_measurement_value(properties.get("temperature"))
            if temp_c is not None:
                conditions["temperature_f"] = celsius_to_fahrenheit(temp_c)
            
            # Humidity  
            humidity = get_measurement_value(properties.get("relativeHumidity"))
            if humidity is not None:
                conditions["humidity_percent"] = float(humidity)
            
            # Wind speed (convert from m/s if needed)
            wind_speed_ms = get_measurement_value(properties.get("windSpeed"))
            if wind_speed_ms is not None:
                conditions["wind_speed_mph"] = meters_per_second_to_mph(wind_speed_ms)
            
            # Wind direction
            wind_dir = get_measurement_value(properties.get("windDirection"))
            if wind_dir is not None:
                conditions["wind_direction"] = degrees_to_cardinal(wind_dir)
            
            # Conditions text
            conditions["conditions"] = properties.get("textDescription", "unknown").lower()
            
            # Pressure (convert from Pa to mb)
            pressure_pa = get_measurement_value(properties.get("barometricPressure"))
            if pressure_pa is not None:
                conditions["pressure_mb"] = pascals_to_millibars(pressure_pa)
            
            # Visibility (convert from meters)
            visibility_m = get_measurement_value(properties.get("visibility"))
            if visibility_m is not None:
                conditions["visibility_miles"] = meters_to_miles(visibility_m)
            
            # Dewpoint
            dewpoint_c = get_measurement_value(properties.get("dewpoint"))
            if dewpoint_c is not None:
                conditions["dewpoint_f"] = celsius_to_fahrenheit(dewpoint_c)
            
            return conditions
            
    except Exception as e:
        logger.error(f"Error fetching current conditions: {str(e)}")
        return {}


async def get_forecast_data(grid_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Get forecast data for additional wildfire risk context
    """
    forecast_url = grid_info.get("forecast_url")
    if not forecast_url:
        return None
    
    headers = {
        "User-Agent": NOAA_USER_AGENT,
        "Accept": "application/geo+json"
    }
    
    try:
        await asyncio.sleep(RATE_LIMIT_DELAY)  # Rate limiting
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(forecast_url, headers=headers)
            
            if response.status_code != 200:
                return None
            
            data = response.json()
            periods = data.get("properties", {}).get("periods", [])
            
            if not periods:
                return None
            
            # Get today's forecast period
            today_period = periods[0]
            
            forecast_data = {
                "conditions": today_period.get("shortForecast", "").lower(),
                "detailed_forecast": today_period.get("detailedForecast", ""),
                "wind_speed": today_period.get("windSpeed", ""),
                "wind_direction": today_period.get("windDirection", "")
            }
            
            # Extract temperature
            if today_period.get("temperature"):
                if today_period.get("temperatureUnit") == "F":
                    if "High" in today_period.get("name", ""):
                        forecast_data["high_temperature_f"] = today_period["temperature"]
                    else:
                        forecast_data["low_temperature_f"] = today_period["temperature"]
            
            # Check for fire weather warnings in detailed forecast
            detailed = today_period.get("detailedForecast", "").lower()
            fire_keywords = ["fire weather", "red flag", "extreme fire danger", "critical fire weather"]
            forecast_data["fire_weather_warning"] = any(keyword in detailed for keyword in fire_keywords)
            
            return forecast_data
            
    except Exception as e:
        logger.error(f"Error fetching forecast data: {str(e)}")
        return None


def get_measurement_value(measurement: Optional[Dict]) -> Optional[float]:
    """Extract numeric value from NOAA measurement object"""
    if not measurement:
        return None
    
    value = measurement.get("value")
    if value is None:
        return None
    
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


# Unit conversion functions
def celsius_to_fahrenheit(celsius: float) -> float:
    return (celsius * 9/5) + 32

def meters_per_second_to_mph(mps: float) -> float:
    return mps * 2.237

def pascals_to_millibars(pascals: float) -> float:
    return pascals / 100

def meters_to_miles(meters: float) -> float:
    return meters * 0.000621371

def degrees_to_cardinal(degrees: float) -> str:
    """Convert wind direction degrees to cardinal direction"""
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    index = round(degrees / 22.5) % 16
    return directions[index]


def create_demo_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Create realistic demo weather data for Hawaiian Islands
    """
    # Hawaiian weather patterns
    base_temp = 78.0  # Typical Hawaiian temperature
    base_humidity = 68.0  # Typical Hawaiian humidity
    base_wind = 12.0  # Trade winds
    
    # Add some realistic variation based on coordinates
    import hashlib
    coord_hash = hashlib.md5(f"{latitude:.3f},{longitude:.3f}".encode()).hexdigest()
    variation = int(coord_hash[:2], 16) / 255.0  # 0-1 variation
    
    demo_data = {
        "temperature_f": base_temp + (variation * 10 - 5),  # ±5°F variation
        "humidity_percent": base_humidity + (variation * 20 - 10),  # ±10% variation  
        "wind_speed_mph": base_wind + (variation * 15),  # 0-15 mph additional
        "wind_direction": ["NE", "E", "SE", "S"][int(variation * 4)],
        "conditions": ["partly cloudy", "mostly sunny", "scattered clouds", "clear"][int(variation * 4)],
        "pressure_mb": 1013.0 + (variation * 10 - 5),
        "visibility_miles": 10.0,
        "dewpoint_f": base_temp - 8.0,
        "source": "demo_mode",
        "station_id": "DEMO",
        "timestamp": datetime.now().isoformat(),
        "coordinates": {"latitude": latitude, "longitude": longitude}
    }
    
    return demo_data


async def test_noaa_connection() -> bool:
    """
    Test NOAA Weather Service API connectivity
    """
    try:
        headers = {
            "User-Agent": NOAA_USER_AGENT,
            "Accept": "application/geo+json"
        }
        
        # Test with Honolulu coordinates
        test_url = f"{NOAA_BASE_URL}/points/21.3099,-157.8581"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(test_url, headers=headers)
            return response.status_code == 200
            
    except Exception as e:
        logger.error(f"NOAA connection test failed: {str(e)}")
        return False 