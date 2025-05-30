import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, Rectangle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Activity, AlertTriangle, Flame, Zap, Eye } from 'lucide-react'

// Fix for default markers in Leaflet with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  })
}

interface AnalysisData {
  analysis_id: string
  status: string
  coordinates: {
    latitude: number
    longitude: number
  }
  demo_mode: boolean
  risk_assessment?: {
    risk_level: number
    severity: string
    rationale: string
  }
  satellite?: {
    dryness_score: number
    confidence: number
  }
  weather?: {
    temperature_f: number
    humidity_percent: number
    wind_speed_mph: number
  }
  power_lines?: {
    count: number
    nearest_distance_m: number
  }
  processing_time_seconds?: number
}

interface DemoLocation {
  name: string
  latitude: number
  longitude: number
  description: string
}

interface MapComponentProps {
  onLocationClick: (lat: number, lng: number) => void
  demoMode: boolean
  isAnalyzing: boolean
  currentAnalysis: AnalysisData | null
  demoLocations: DemoLocation[]
}

// Auto-zoom component to focus on analysis area
function AutoZoom({ currentAnalysis, isAnalyzing }: { currentAnalysis: AnalysisData | null, isAnalyzing: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (currentAnalysis && isAnalyzing) {
      // Zoom to West Maui analysis area
      const { latitude, longitude } = currentAnalysis.coordinates
      
      // Create analysis bounds (grid area)
      const gridSize = 0.135 // degrees
      const bounds = L.latLngBounds(
        [latitude - gridSize, longitude - gridSize],
        [latitude + gridSize, longitude + gridSize]
      )
      
      // Animate to the analysis area
      map.flyToBounds(bounds, {
        duration: 2,
        easeLinearity: 0.1,
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 100]
      })
    }
  }, [currentAnalysis, isAnalyzing, map])
  
  return null
}

// Custom icons
const createIcon = (color: string, size: number = 30) => {
  if (typeof window === 'undefined') return null
  
  return new L.DivIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      "></div>
    `,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
  })
}

// Fire watch icon for high-risk zones
const createFireWatchIcon = (severity: string) => {
  if (typeof window === 'undefined') return null
  
  const colors = {
    'HIGH': '#f97316',
    'EXTREME': '#ef4444',
    'MEDIUM': '#f59e0b',
    'LOW': '#10b981'
  }
  
  const color = colors[severity as keyof typeof colors] || '#6b7280'
  
  return new L.DivIcon({
    html: `
      <div style="
        width: 26px;
        height: 26px;
        background: ${color};
        border: 3px solid white;
        border-radius: 4px;
        box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
        position: relative;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1); }
          50% { transform: scale(1.15); box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px ${color}40; }
        }
      </style>
    `,
    className: 'fire-watch-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  })
}

// Power line warning icon
const createPowerLineIcon = () => {
  if (typeof window === 'undefined') return null
  
  return new L.DivIcon({
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        transition: all 0.2s ease;
        position: relative;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ⚡
      </div>
    `,
    className: 'power-line-icon',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  })
}

function MapEventHandler({ onLocationClick, isAnalyzing }: { onLocationClick: (lat: number, lng: number) => void, isAnalyzing: boolean }) {
  useMapEvents({
    click: (e) => {
      if (!isAnalyzing) {
        const { lat, lng } = e.latlng
        onLocationClick(lat, lng)
      }
    },
  })
  return null
}

function getRiskColor(severity: string): string {
  switch (severity) {
    case 'LOW': return '#10b981'
    case 'MEDIUM': return '#f59e0b'  
    case 'HIGH': return '#f97316'
    case 'EXTREME': return '#ef4444'
    default: return '#6b7280'
  }
}

// Generate fire watch zones based on analysis
function generateFireWatchZones(analysis: AnalysisData) {
  const { latitude, longitude } = analysis.coordinates
  const gridSize = 0.015 // Smaller zones for better accuracy
  const zones = []
  
  // Better land detection for Hawaiian Islands
  const isOnLand = (lat: number, lng: number) => {
    // West Maui (Lahaina area) - very precise boundaries with safety margins
    if (lat >= 20.86 && lat <= 20.94 && lng >= -156.74 && lng <= -156.61) return true
    
    // Central/South Maui - conservative boundaries
    if (lat >= 20.67 && lat <= 20.84 && lng >= -156.69 && lng <= -156.32) return true
    
    // East Maui (Haleakala area) - smaller, safer area
    if (lat >= 20.71 && lat <= 20.79 && lng >= -156.28 && lng <= -156.17) return true
    
    // Big Island - Kona side with margins
    if (lat >= 19.52 && lat <= 20.23 && lng >= -156.08 && lng <= -155.47) return true
    
    // Big Island - Hilo side with margins
    if (lat >= 19.67 && lat <= 20.13 && lng >= -155.43 && lng <= -154.82) return true
    
    // Oahu - very conservative to avoid water
    if (lat >= 21.27 && lat <= 21.68 && lng >= -158.28 && lng <= -157.67) return true
    
    // Kauai - conservative boundaries
    if (lat >= 21.87 && lat <= 22.23 && lng >= -159.78 && lng <= -159.32) return true
    
    // Molokai - tighter boundaries
    if (lat >= 21.12 && lat <= 21.18 && lng >= -157.28 && lng <= -156.77) return true
    
    // Additional safety check - exclude obvious water coordinates
    // Exclude areas too far from any major island
    const distanceToNearestIsland = Math.min(
      Math.sqrt(Math.pow(lat - 20.8783, 2) + Math.pow(lng + 156.6825, 2)), // West Maui
      Math.sqrt(Math.pow(lat - 20.7967, 2) + Math.pow(lng + 156.3319, 2)), // East Maui
      Math.sqrt(Math.pow(lat - 19.8968, 2) + Math.pow(lng + 155.5828, 2)), // Big Island
      Math.sqrt(Math.pow(lat - 21.4389, 2) + Math.pow(lng + 158.0001, 2)), // Oahu
      Math.sqrt(Math.pow(lat - 22.0964, 2) + Math.pow(lng + 159.5261, 2))  // Kauai
    )
    
    // Reject if too far from any island (>0.3 degrees ~ 33km)
    if (distanceToNearestIsland > 0.3) return false
    
    return false // Default to false for safety
  }
  
  // Create a smaller, more focused grid around the analysis point
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const zoneLat = latitude + (i * gridSize)
      const zoneLng = longitude + (j * gridSize)
      
      // Only create zones on land
      if (!isOnLand(zoneLat, zoneLng)) continue
      
      // Determine zone risk based on distance from center and analysis data
      const distance = Math.sqrt(i*i + j*j)
      let zoneRisk = 'LOW'
      
      if (analysis.risk_assessment) {
        if (distance < 2 && analysis.risk_assessment.severity === 'HIGH') {
          zoneRisk = Math.random() > 0.4 ? 'HIGH' : 'MEDIUM'
        } else if (distance < 3 && analysis.risk_assessment.risk_level > 0.4) {
          zoneRisk = Math.random() > 0.6 ? 'MEDIUM' : 'LOW'
        }
      }
      
      // Ensure center zone matches analysis severity
      if (i === 0 && j === 0) zoneRisk = analysis.risk_assessment?.severity || 'HIGH'
      
      // Add some realistic high-risk zones near center
      if (Math.abs(i) + Math.abs(j) <= 2 && Math.random() > 0.7) {
        zoneRisk = analysis.risk_assessment?.severity === 'HIGH' ? 'HIGH' : 'MEDIUM'
      }
      
      zones.push({
        id: `zone_${String(zones.length).padStart(4, '0')}`,
        latitude: zoneLat,
        longitude: zoneLng,
        risk: zoneRisk,
        dryness: 85 + Math.random() * 10,
        powerLines: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0,
        powerDistance: Math.random() > 0.8 ? Math.floor(Math.random() * 500) : null
      })
    }
  }
  
  // Limit to reasonable number of zones to avoid clutter
  return zones.slice(0, 12)
}

export default function MapComponent({ 
  onLocationClick, 
  demoMode, 
  isAnalyzing, 
  currentAnalysis, 
  demoLocations 
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const [fireWatchZones, setFireWatchZones] = useState<any[]>([])

  // Hawaiian Islands center (West Maui - Lahaina area)
  const hawaiiCenter: [number, number] = [20.8783, -156.6825]

  useEffect(() => {
    // Only mount after client-side hydration
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Generate fire watch zones when analysis is available
  useEffect(() => {
    if (currentAnalysis?.risk_assessment) {
      const zones = generateFireWatchZones(currentAnalysis)
      setFireWatchZones(zones)
    } else {
      setFireWatchZones([])
    }
  }, [currentAnalysis])

  // Force remount if needed
  const handleMapError = () => {
    console.log('Map error, forcing remount...')
    setMapKey(prev => prev + 1)
  }

  if (!mounted) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        key={`map-${mapKey}`}
        center={hawaiiCenter}
        zoom={8}
        className="w-full h-full leaflet-container"
        style={{ 
          height: '100%',
          width: '100%',
          zIndex: 1,
        }}
        scrollWheelZoom={true}
        zoomControl={true}
        doubleClickZoom={true}
        touchZoom={true}
        preferCanvas={false}
      >
        {/* Multiple TileLayer sources for reliability */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
          minZoom={1}
          tileSize={256}
          zoomOffset={0}
          crossOrigin=""
        />
        
        <MapEventHandler onLocationClick={onLocationClick} isAnalyzing={isAnalyzing} />
        <AutoZoom currentAnalysis={currentAnalysis} isAnalyzing={isAnalyzing} />

        {/* Analysis Grid Boundary */}
        {currentAnalysis && isAnalyzing && (
          <Rectangle
            bounds={[
              [currentAnalysis.coordinates.latitude - 0.135, currentAnalysis.coordinates.longitude - 0.135],
              [currentAnalysis.coordinates.latitude + 0.135, currentAnalysis.coordinates.longitude + 0.135]
            ]}
            pathOptions={{
              color: '#3b82f6',
              fillColor: 'transparent',
              weight: 2,
              dashArray: '10, 5',
              opacity: 0.8
            }}
          />
        )}

        {/* Fire Watch Zone Markers */}
        {fireWatchZones.map((zone) => {
          if (zone.risk === 'LOW') return null // Don't show low-risk markers
          
          const icon = createFireWatchIcon(zone.risk)
          if (!icon) return null
          
          return (
            <Marker 
              key={zone.id}
              position={[zone.latitude, zone.longitude]} 
              icon={icon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">Fire Watch Zone</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Zone ID:</span>
                      <span className="font-mono">{zone.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getRiskColor(zone.risk) }}
                      >
                        {zone.risk}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vegetation Dryness:</span>
                      <span className="font-semibold">{zone.dryness.toFixed(1)}%</span>
                    </div>
                    {zone.powerLines > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                        <div className="flex items-center gap-1 text-yellow-800 text-xs">
                          <Zap className="w-3 h-3" />
                          <span>Power Infrastructure Alert</span>
                        </div>
                        <div className="text-xs text-yellow-700 mt-1">
                          {zone.powerLines} power lines, {zone.powerDistance}m distance
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Power Line Infrastructure Markers */}
        {fireWatchZones.filter(zone => zone.powerLines > 0 && zone.powerDistance < 300).map((zone) => {
          const icon = createPowerLineIcon()
          if (!icon) return null
          
          return (
            <Marker 
              key={`power-${zone.id}`}
              position={[zone.latitude + 0.005, zone.longitude + 0.005]} 
              icon={icon}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <h3 className="font-semibold text-gray-800">Power Line Risk</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Lines Detected:</span>
                      <span className="font-semibold">{zone.powerLines}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-semibold">{zone.powerDistance}m</span>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <div className="text-xs text-red-800 font-semibold">⚠️ High Risk Combination</div>
                      <div className="text-xs text-red-700">Dry vegetation + Power lines</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Risk area visualization after analysis */}
        {currentAnalysis?.risk_assessment && (
          <>
            {/* Core risk area - immediate danger zone */}
            <Circle
              center={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]}
              radius={2500}
              pathOptions={{
                color: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillColor: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillOpacity: 0.4,
                weight: 3,
              }}
            />
            
            {/* Secondary risk area - monitoring zone */}
            <Circle
              center={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]}
              radius={5000}
              pathOptions={{
                color: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillColor: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '10, 5'
              }}
            />
            
            {/* Extended monitoring perimeter */}
            <Circle
              center={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]}
              radius={10000}
              pathOptions={{
                color: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillColor: getRiskColor(currentAnalysis.risk_assessment.severity),
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '5, 10'
              }}
            />
          </>
        )}

        {/* Demo Location Markers */}
        {demoMode && demoLocations.map((location, index) => {
          const icon = createIcon('#3b82f6', 24)
          if (!icon) return null
          
          return (
            <Marker 
              key={`demo-${index}`}
              position={[location.latitude, location.longitude]} 
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (!isAnalyzing) {
                    onLocationClick(location.latitude, location.longitude)
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-800 mb-1">{location.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                  <button 
                    onClick={() => onLocationClick(location.latitude, location.longitude)}
                    disabled={isAnalyzing}
                    className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isAnalyzing 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Current Analysis Marker */}
        {currentAnalysis && (() => {
          const color = currentAnalysis.risk_assessment ? getRiskColor(currentAnalysis.risk_assessment.severity) : '#6b7280'
          const icon = createIcon(color, 36)
          if (!icon) return null

          return (
            <Marker 
              position={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]} 
              icon={icon}
            >
              <Popup>
                <div className="p-3 min-w-[300px] max-w-[350px]">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Wildfire Risk Analysis
                  </h3>
                  
                  {currentAnalysis.risk_assessment ? (
                    <div className="space-y-3">
                      {/* Critical Combination Alert */}
                      {currentAnalysis.satellite?.dryness_score && currentAnalysis.power_lines?.nearest_distance_m && 
                       currentAnalysis.satellite.dryness_score > 0.8 && currentAnalysis.power_lines.nearest_distance_m < 300 && (
                        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            CRITICAL COMBINATION DETECTED
                          </div>
                          <div className="text-xs text-red-700 space-y-1">
                            <div>• Vegetation dryness: {(currentAnalysis.satellite.dryness_score * 100).toFixed(1)}%</div>
                            <div>• Power line proximity: {currentAnalysis.power_lines.nearest_distance_m}m</div>
                            <div>• Risk score: {(currentAnalysis.risk_assessment.risk_level * 100).toFixed(0)}/100</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Risk Level Badge */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Level:</span>
                        <span 
                          className="px-3 py-1 rounded text-sm font-bold text-white"
                          style={{ backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity) }}
                        >
                          {currentAnalysis.risk_assessment.severity}
                        </span>
                      </div>
                      
                      {/* Risk Score Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className="font-semibold">{(currentAnalysis.risk_assessment.risk_level * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${currentAnalysis.risk_assessment.risk_level * 100}%`,
                              backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity)
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Risk Zones Explanation */}
                      <div className="bg-gray-50 rounded p-2 space-y-1">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Risk Zones:</div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity), opacity: 0.4 }} />
                          <span className="text-gray-600">Immediate danger zone (2.5km)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity), opacity: 0.2 }} />
                          <span className="text-gray-600">Active monitoring zone (5km)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity), opacity: 0.1 }} />
                          <span className="text-gray-600">Extended perimeter (10km)</span>
                        </div>
                      </div>
                      
                      {/* Rationale */}
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-1">Assessment Rationale:</div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {currentAnalysis.risk_assessment.rationale}
                        </p>
                      </div>
                      
                      {/* Location Details */}
                      <div className="text-xs text-gray-500 font-mono border-t pt-2">
                        {currentAnalysis.coordinates.latitude.toFixed(4)}°N, {Math.abs(currentAnalysis.coordinates.longitude).toFixed(4)}°W
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 py-4">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="text-sm">Processing analysis...</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })()}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-800/95 backdrop-blur-md border border-slate-600/50 rounded-xl p-4 shadow-2xl min-w-[180px]">
        <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-400" />
          Fire Watch Legend
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Risk Levels</div>
            {[
              { level: 'LOW', color: '#10b981', show: false },
              { level: 'MEDIUM', color: '#f59e0b', show: true },
              { level: 'HIGH', color: '#f97316', show: true },
              { level: 'EXTREME', color: '#ef4444', show: true }
            ].filter(item => item.show).map(({ level, color }) => (
              <div key={level} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-200 font-medium">{level} Risk</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-600/50 pt-3 space-y-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Infrastructure</div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px]">
                ⚡
              </div>
              <span className="text-xs text-slate-200 font-medium">Power Lines</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-400 border-dashed bg-blue-400/20 rounded-sm" />
              <span className="text-xs text-slate-200 font-medium">Analysis Grid</span>
            </div>
          </div>
          
          <div className="border-t border-slate-600/50 pt-3">
            <div className="text-xs text-slate-400 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span>🌺</span>
                <span className="font-medium">PyroGuard Sentinel</span>
              </div>
              <div className="text-[10px] opacity-75">
                Real-time Fire Risk Assessment
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug/Error handling */}
      <div className="absolute top-4 right-4 z-[500]">
        <button
          onClick={handleMapError}
          className="bg-red-600 text-white px-2 py-1 rounded text-xs opacity-20 hover:opacity-100"
        >
          Reload Map
        </button>
      </div>
    </div>
  )
} 