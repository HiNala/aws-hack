import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Activity, AlertTriangle } from 'lucide-react'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

// Custom icon for current analysis location
const analysisIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  className: 'analysis-marker'
})

// Custom icon for demo locations
const demoIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64=' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20],
  className: 'demo-marker'
})

// Special prominent icon for West Maui (priority location)
const westMauiIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64=' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="32" height="32">
      <circle cx="16" cy="16" r="12" fill="rgba(251, 146, 60, 0.8)" stroke="rgb(234, 88, 12)" stroke-width="3"/>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" transform="translate(-4, -2) scale(0.7)" fill="rgb(239, 68, 68)" stroke="white" stroke-width="1"/>
      <circle cx="12" cy="8" r="2" transform="translate(-4, -2) scale(0.7)" fill="white"/>
      <text x="16" y="24" text-anchor="middle" fill="white" font-size="8" font-weight="bold">WEST MAUI</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
  className: 'west-maui-marker'
})

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

function MapTracker({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  
  useEffect(() => {
    mapRef.current = map
    return () => {
      mapRef.current = null
    }
  }, [map, mapRef])
  
  return null
}

function getRiskColor(severity: string): string {
  switch (severity) {
    case 'LOW': return '#10b981' // green-500
    case 'MEDIUM': return '#f59e0b' // yellow-500  
    case 'HIGH': return '#f97316' // orange-500
    case 'EXTREME': return '#ef4444' // red-500
    default: return '#6b7280' // gray-500
  }
}

export default function MapComponent({ 
  onLocationClick, 
  demoMode, 
  isAnalyzing, 
  currentAnalysis, 
  demoLocations 
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false)
  const [mapKey, setMapKey] = useState<string>('')
  const [mapError, setMapError] = useState<string | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const containerIdRef = useRef<string>('')

  // Hawaiian Islands bounds
  const hawaiiBounds: [[number, number], [number, number]] = [
    [18.5, -161.0], // Southwest corner
    [22.5, -154.0]  // Northeast corner
  ]

  // West Maui center (Lahaina area) - default focus area
  const hawaiiCenter: [number, number] = [20.8783, -156.6825] // West Maui center

  // Generate a unique container ID
  const generateContainerId = useCallback(() => {
    return `leaflet-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Generate a stable key for the map
  const generateMapKey = useCallback(() => {
    return `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Comprehensive cleanup function
  const cleanupMap = useCallback(() => {
    try {
      // Clean up map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      
      // Clean up DOM container
      if (containerIdRef.current) {
        const container = document.getElementById(containerIdRef.current)
        if (container) {
          container.innerHTML = ''
          // Remove any Leaflet classes
          container.className = container.className.replace(/leaflet-[^\s]*/g, '').trim()
        }
      }
    } catch (error) {
      console.warn('Error cleaning up map:', error)
    }
  }, [])

  // Initialize map with error handling
  const initializeMap = useCallback(() => {
    try {
      setMapError(null)
      const containerId = generateContainerId()
      const mapKey = generateMapKey()
      
      containerIdRef.current = containerId
      setMapKey(mapKey)
      
      return true
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(error instanceof Error ? error.message : 'Map initialization failed')
      return false
    }
  }, [generateContainerId, generateMapKey])

  // Force remount with comprehensive cleanup
  const remountMap = useCallback(() => {
    cleanupMap()
    setMounted(false)
    setMapError(null)
    
    // Longer delay to ensure complete cleanup
    setTimeout(() => {
      if (initializeMap()) {
        setMounted(true)
      }
    }, 200)
  }, [cleanupMap, initializeMap])

  // Initialize on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (initializeMap()) {
        setMounted(true)
      }
    }

    return () => {
      cleanupMap()
      setMounted(false)
    }
  }, [initializeMap, cleanupMap])

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Map container is already initialized')) {
        console.warn('Detected map initialization error, attempting remount...')
        remountMap()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [remountMap])

  // Loading state
  if (!mounted || !mapKey || !containerIdRef.current) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading map...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (mapError) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Map Error: {mapError}</p>
          <button 
            onClick={remountMap}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry Map
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        id={containerIdRef.current}
        className="w-full h-full"
      >
        <MapContainer
          key={mapKey}
          center={hawaiiCenter}
          zoom={8}
          maxBounds={hawaiiBounds}
          maxBoundsViscosity={1.0}
          className="w-full h-full z-0"
          style={{ 
            background: '#0f172a',
            cursor: isAnalyzing ? 'wait' : 'crosshair'
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            opacity={0.8}
          />
          
          <MapEventHandler onLocationClick={onLocationClick} isAnalyzing={isAnalyzing} />

          <MapTracker mapRef={mapInstanceRef} />

          {/* Permanent West Maui Marker - Always Visible Priority Location */}
          <Marker 
            key={`west-maui-permanent-${mapKey}`}
            position={[20.8783, -156.6825]} 
            icon={westMauiIcon}
            eventHandlers={{
              click: () => {
                if (!isAnalyzing) {
                  onLocationClick(20.8783, -156.6825)
                }
              }
            }}
          >
            <Popup className="west-maui-popup">
              <div className="p-3 min-w-[250px]">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <h3 className="font-bold text-orange-600">🔥 West Maui Priority Zone</h3>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded p-2 mb-3">
                  <p className="text-sm text-orange-800 font-medium">High-Risk Wildfire Area</p>
                  <p className="text-xs text-orange-700">Lahaina Region • Historical Fire Zone</p>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-mono text-xs">20.8783°N, 156.6825°W</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className="text-orange-600 font-medium">ELEVATED</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vegetation:</span>
                    <span className="text-gray-700">Dry grassland/shrub</span>
                  </div>
                </div>
                <button 
                  onClick={() => onLocationClick(20.8783, -156.6825)}
                  disabled={isAnalyzing}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isAnalyzing 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg hover:shadow-orange-500/25'
                  }`}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Activity className="w-4 h-4" />
                      <span>Start Risk Analysis</span>
                    </div>
                  )}
                </button>
                <div className="mt-2 text-xs text-orange-600 text-center font-medium">
                  🌺 Priority Analysis Zone • Made with Aloha
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Demo Location Markers */}
          {demoMode && demoLocations.map((location, index) => (
            <Marker 
              key={`demo-${index}-${mapKey}`}
              position={[location.latitude, location.longitude]} 
              icon={location.name.includes("West Maui") ? westMauiIcon : demoIcon}
              eventHandlers={{
                click: () => {
                  if (!isAnalyzing) {
                    onLocationClick(location.latitude, location.longitude)
                  }
                }
              }}
            >
              <Popup className="demo-popup">
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-gray-800">{location.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{location.description}</p>
                  <div className="text-xs text-gray-500 mb-3 font-mono">
                    {location.latitude.toFixed(4)}°N, {Math.abs(location.longitude).toFixed(4)}°W
                  </div>
                  <button 
                    onClick={() => onLocationClick(location.latitude, location.longitude)}
                    disabled={isAnalyzing}
                    className={`w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
                      isAnalyzing 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isAnalyzing ? 'Analysis in Progress...' : 'Analyze Location'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Current Analysis Marker */}
          {currentAnalysis && (
            <Marker 
              key={`analysis-${currentAnalysis.analysis_id}-${mapKey}`}
              position={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]} 
              icon={analysisIcon}
            >
              <Popup className="analysis-popup">
                <div className="p-3 min-w-[250px]">
                  <div className="flex items-center space-x-2 mb-3">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-800">Wildfire Risk Analysis</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Location */}
                    <div className="text-sm">
                      <div className="text-gray-600 mb-1">Location:</div>
                      <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {currentAnalysis.coordinates.latitude.toFixed(4)}°N, {Math.abs(currentAnalysis.coordinates.longitude).toFixed(4)}°W
                      </div>
                    </div>

                    {/* Analysis Status */}
                    <div className="text-sm">
                      <div className="text-gray-600 mb-1">Status:</div>
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                        currentAnalysis.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        currentAnalysis.status === 'completed' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {currentAnalysis.status === 'processing' && (
                          <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                        )}
                        <span className="capitalize">{currentAnalysis.status}</span>
                      </div>
                    </div>

                    {/* Processing Time */}
                    {currentAnalysis.processing_time_seconds && (
                      <div className="text-sm">
                        <div className="text-gray-600 mb-1">Processing Time:</div>
                        <div className="text-gray-800 font-mono">
                          {currentAnalysis.processing_time_seconds.toFixed(1)}s
                        </div>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {currentAnalysis.risk_assessment && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-semibold text-gray-700">Risk Assessment</span>
                          </div>
                          <div 
                            className="px-2 py-1 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity) }}
                          >
                            {currentAnalysis.risk_assessment.severity}
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600">Risk Level:</span>
                            <span className="font-semibold">
                              {(currentAnalysis.risk_assessment.risk_level * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${currentAnalysis.risk_assessment.risk_level * 100}%`,
                                backgroundColor: getRiskColor(currentAnalysis.risk_assessment.severity)
                              }}
                            ></div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {currentAnalysis.risk_assessment.rationale}
                        </p>
                      </div>
                    )}

                    {/* Demo Mode Indicator */}
                    {currentAnalysis.demo_mode && (
                      <div className="border-t pt-2">
                        <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-xs text-blue-700 font-medium">Demo Mode</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[700] bg-slate-800/90 backdrop-blur-md border border-slate-600/50 rounded-lg p-3 shadow-xl">
        <div className="text-xs font-semibold text-white mb-2">Risk Levels</div>
        <div className="space-y-1">
          {[
            { level: 'LOW', color: '#10b981' },
            { level: 'MEDIUM', color: '#f59e0b' },
            { level: 'HIGH', color: '#f97316' },
            { level: 'EXTREME', color: '#ef4444' }
          ].map(({ level, color }) => (
            <div key={level} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-slate-300">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom CSS for popups */}
      <style jsx global>{`
        .analysis-marker {
          filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5));
        }
        
        .demo-marker {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .west-maui-marker {
          filter: drop-shadow(0 6px 12px rgba(234, 88, 12, 0.6));
          animation: pulse-glow 3s ease-in-out infinite;
          z-index: 1000 !important;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            filter: drop-shadow(0 6px 12px rgba(234, 88, 12, 0.6));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 8px 16px rgba(234, 88, 12, 0.8));
            transform: scale(1.05);
          }
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .leaflet-popup-tip {
          background: white;
        }
        
        .demo-popup .leaflet-popup-content {
          margin: 0;
        }
        
        .analysis-popup .leaflet-popup-content {
          margin: 0;
        }
        
        .west-maui-popup .leaflet-popup-content {
          margin: 0;
        }
        
        .west-maui-popup .leaflet-popup-content-wrapper {
          background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
          border: 2px solid #fed7aa;
          box-shadow: 0 8px 24px rgba(234, 88, 12, 0.25);
        }
        
        .west-maui-popup .leaflet-popup-tip {
          background: #fef2f2;
          border: 1px solid #fed7aa;
        }
      `}</style>
    </div>
  )
} 