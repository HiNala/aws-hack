import os
import io
import logging
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Tuple
import boto3
import rasterio
from rasterio.session import AWSSession
from rasterio import windows
from rasterio.warp import transform_bounds, calculate_default_transform
import requests
from botocore.exceptions import NoCredentialsError, ClientError

logger = logging.getLogger(__name__)

# Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

# Hawaiian Islands geographic bounds
HAWAII_BOUNDS = {
    "min_lat": 20.5,
    "max_lat": 21.5, 
    "min_lon": -157.5,
    "max_lon": -155.9
}

CACHE_DIR = Path("data/cache/tiles")
CACHE_EXPIRY_DAYS = 7


def get_cache_path(lat: float, lon: float, date_str: str = None) -> Path:
    """Generate cache file path for satellite tile"""
    if not date_str:
        date_str = datetime.now().strftime("%Y%m%d")
    
    # Create a unique filename based on coordinates
    coord_hash = hashlib.md5(f"{lat:.6f}_{lon:.6f}".encode()).hexdigest()[:8]
    filename = f"tile_{coord_hash}_{date_str}.png"
    return CACHE_DIR / filename


def is_in_hawaii(lat: float, lon: float) -> bool:
    """Check if coordinates are within Hawaiian Islands bounds"""
    # Hawaiian Islands approximate bounds
    min_lat, max_lat = 18.9, 22.2
    min_lon, max_lon = -160.3, -154.8
    
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def get_utm_tile_id(lat: float, lon: float) -> str:
    """
    Get Sentinel-2 UTM tile ID for Hawaiian coordinates.
    Most of Hawaii is in UTM zones 59Q and 60Q.
    """
    # Simplified mapping for Hawaii
    if lon < -156.5:
        return "59QCH"  # West Hawaii (Kauai, Oahu west)
    elif lon < -156.0:
        return "59QCK"  # Central Hawaii (Oahu, Molokai)
    else:
        return "59QDH"  # East Hawaii (Big Island, Maui)


def get_sentinel2_s3_path(utm_tile: str, date: datetime) -> str:
    """
    Construct S3 path for Sentinel-2 COG data.
    Format: sentinel-s2-l2a-cogs/{zone}/{lat_band}/{grid}/{yyyy}/{MM}/{dd}/{sequence}/TCI.tif
    """
    zone = utm_tile[:2]  # e.g., "59"
    lat_band = utm_tile[2]  # e.g., "Q" 
    grid = utm_tile[3:]  # e.g., "CH"
    
    return (
        f"s3://sentinel-cogs/sentinel-s2-l2a-cogs/"
        f"{zone}/{lat_band}/{grid}/"
        f"{date.year:04d}/{date.month:02d}/{date.day:02d}/"
        f"0/TCI.tif"  # Usually sequence 0
    )


def get_satellite_png(lat: float, lon: float, demo_mode: bool = False) -> Optional[bytes]:
    """
    Get satellite imagery as PNG bytes for the given coordinates.
    
    Args:
        lat: Latitude coordinate
        lon: Longitude coordinate  
        demo_mode: Use cached data if available
    
    Returns:
        PNG bytes or None if failed
    """
    try:
        # Validate coordinates are in Hawaii
        if not is_in_hawaii(lat, lon):
            logger.error(f"Coordinates {lat}, {lon} outside Hawaii bounds")
            return None
        
        # Check cache first
        cache_path = get_cache_path(lat, lon)
        if cache_path.exists():
            cache_age = datetime.now() - datetime.fromtimestamp(cache_path.stat().st_mtime)
            if demo_mode or cache_age.days < CACHE_EXPIRY_DAYS:
                logger.info(f"Using cached tile: {cache_path}")
                return cache_path.read_bytes()
        
        # If demo mode and no cache, return None (should be pre-cached)
        if demo_mode:
            logger.warning(f"Demo mode: no cached tile for {lat}, {lon}")
            return None
        
        # Fetch live data from S3
        return fetch_sentinel2_live(lat, lon)
    
    except Exception as e:
        logger.error(f"Failed to get satellite PNG: {str(e)}")
        return None


def fetch_sentinel2_live(lat: float, lon: float) -> Optional[bytes]:
    """
    Fetch live Sentinel-2 imagery from AWS S3 and extract 512x512 window.
    """
    try:
        # Set up AWS session with requester pays
        aws_session = AWSSession(
            boto3.Session(
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                region_name=AWS_REGION
            ),
            requester_pays=True
        )
        
        # Get UTM tile ID and recent date
        utm_tile = get_utm_tile_id(lat, lon)
        
        # Try recent dates (last 30 days)
        for days_ago in range(0, 30, 3):  # Check every 3 days
            date = datetime.now() - timedelta(days=days_ago)
            s3_path = get_sentinel2_s3_path(utm_tile, date)
            
            logger.info(f"Trying S3 path: {s3_path}")
            
            try:
                with rasterio.Env(aws_session):
                    with rasterio.open(s3_path) as src:
                        # Convert lat/lon to pixel coordinates
                        row, col = src.index(lon, lat)
                        
                        # Define 512x512 window centered on the point
                        window_size = 512
                        window = windows.Window(
                            col - window_size // 2,
                            row - window_size // 2,
                            window_size,
                            window_size
                        )
                        
                        # Read the window
                        img_data = src.read(window=window)
                        
                        # Save as PNG using rasterio
                        cache_path = get_cache_path(lat, lon, date.strftime("%Y%m%d"))
                        cache_path.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Create memory buffer for PNG
                        with io.BytesIO() as buffer:
                            with rasterio.open(
                                buffer,
                                'w',
                                driver='PNG',
                                height=window_size,
                                width=window_size,
                                count=3,  # RGB
                                dtype=img_data.dtype,
                                crs=src.crs,
                                transform=windows.transform(window, src.transform)
                            ) as dst:
                                dst.write(img_data)
                            
                            png_bytes = buffer.getvalue()
                        
                        # Cache to disk
                        cache_path.write_bytes(png_bytes)
                        
                        logger.info(f"Fetched {len(png_bytes)} bytes from S3, cached to {cache_path}")
                        return png_bytes
            
            except Exception as e:
                logger.debug(f"Failed to fetch {s3_path}: {str(e)}")
                continue
        
        logger.error(f"No valid Sentinel-2 data found for {lat}, {lon} in last 30 days")
        return None
    
    except Exception as e:
        logger.error(f"Sentinel-2 S3 fetch failed: {str(e)}")
        return None


def get_satellite_image_bytes(latitude: float, longitude: float) -> Optional[bytes]:
    """
    Get satellite image bytes for the given coordinates from live Sentinel-2 data
    
    This function:
    1. Queries AWS S3 for Sentinel-2 imagery covering the coordinates
    2. Downloads and crops the relevant tile
    3. Returns the processed image bytes
    """
    try:
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            logger.warning("AWS credentials not configured - cannot fetch live satellite imagery")
            return None
        
        if not is_in_hawaii(latitude, longitude):
            logger.error(f"Coordinates {latitude}, {longitude} outside Hawaii bounds")
            return None
        
        logger.info(f"🛰️ Fetching live satellite imagery for {latitude:.4f}, {longitude:.4f}")
        
        # Try to get live satellite PNG data
        png_data = get_satellite_png(latitude, longitude, demo_mode=False)
        
        if png_data:
            logger.info(f"✅ Successfully fetched {len(png_data)} bytes of live satellite imagery")
            return png_data
        else:
            logger.warning("🔄 Live satellite fetch failed, will use demo analysis")
            return None
        
    except Exception as e:
        logger.error(f"❌ Failed to get satellite imagery: {str(e)}")
        return None


def get_sentinel_tile_name(lat: float, lon: float) -> str:
    """
    Get Sentinel-2 tile name for given coordinates
    
    Sentinel-2 uses a UTM-based tiling system with ~100km x 100km tiles
    Hawaiian Islands are primarily covered by tiles in UTM zone 4N and 5N
    """
    # Simplified tile mapping for Hawaiian Islands
    # In production, would use proper UTM coordinate conversion
    
    if -158.3 <= lon <= -155.0:  # Main Hawaiian islands
        if 19.5 <= lat <= 22.3:
            return "04QFJ"  # Covers most of the main islands
    
    return "04QFJ"  # Default tile for Hawaii


def test_s3_connection() -> bool:
    """Test AWS S3 connection for satellite imagery access"""
    try:
        if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
            logger.warning("AWS credentials not configured")
            return False
        
        # Test basic S3 connectivity
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        
        s3_client = session.client('s3')
        
        # Test with a simple head request to Sentinel-2 bucket
        try:
            s3_client.head_bucket(Bucket='sentinel-s2-l2a')
            logger.info("✅ AWS S3 Sentinel-2 access verified")
            return True
        except ClientError as e:
            # Even if we can't access this specific bucket, S3 connection works
            if e.response['Error']['Code'] == '403':
                logger.info("✅ AWS S3 connection works (access restricted to Sentinel bucket)")
                return True
            else:
                logger.warning(f"AWS S3 test failed: {e}")
                return False
        
    except NoCredentialsError:
        logger.error("AWS credentials not found")
        return False
    except Exception as e:
        logger.error(f"S3 connection test failed: {str(e)}")
        return False 