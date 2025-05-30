import React, { useEffect, useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, Activity, AlertTriangle, Flame } from 'lucide-react'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

// Custom icons
const createIcon = (color: string, size: number = 30) => {
  return new L.DivIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    className: 'custom-div-icon',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
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

export default function MapComponent({ 
  onLocationClick, 
  demoMode, 
  isAnalyzing, 
  currentAnalysis, 
  demoLocations 
}: MapComponentProps) {
  const [mounted, setMounted] = useState(false)

  // Hawaiian Islands bounds
  const hawaiiBounds: [[number, number], [number, number]] = [
    [18.5, -161.0],
    [22.5, -154.0]
  ]

  // West Maui center (Lahaina area)
  const hawaiiCenter: [number, number] = [20.8783, -156.6825]

  useEffect(() => {
    setMounted(true)
  }, [])

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
        center={hawaiiCenter}
        zoom={8}
        className="w-full h-full"
        style={{ 
          background: '#1e293b',
          cursor: isAnalyzing ? 'wait' : 'crosshair'
        }}
      >
        {/* Simple reliable tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapEventHandler onLocationClick={onLocationClick} isAnalyzing={isAnalyzing} />

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
        {demoMode && demoLocations.map((location, index) => (
          <Marker 
            key={`demo-${index}`}
            position={[location.latitude, location.longitude]} 
            icon={createIcon('#3b82f6', 24)}
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
        ))}

        {/* Current Analysis Marker */}
        {currentAnalysis && (
          <Marker 
            position={[currentAnalysis.coordinates.latitude, currentAnalysis.coordinates.longitude]} 
            icon={createIcon(
              currentAnalysis.risk_assessment ? getRiskColor(currentAnalysis.risk_assessment.severity) : '#6b7280',
              36
            )}
          >
            <Popup>
              <div className="p-3 min-w-[300px] max-w-[350px]">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Wildfire Risk Analysis
                </h3>
                
                {currentAnalysis.risk_assessment ? (
                  <div className="space-y-3">
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
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-800/90 backdrop-blur-md border border-slate-600/50 rounded-lg p-3 shadow-xl">
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
              />
              <span className="text-xs text-slate-300">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 