import React from 'react'
import { MapPin, Zap, CloudRain, Satellite, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react'

interface AnalysisData {
  analysis_id: string
  status: string
  coordinates: {
    latitude: number
    longitude: number
  }
  demo_mode: boolean
  weather?: {
    temperature_f: number
    humidity_percent: number
    wind_speed_mph: number
    conditions: string
  }
  satellite?: {
    dryness_score: number
    confidence: number
    tile_date?: string
  }
  power_lines?: {
    count: number
    nearest_distance_m: number
  }
  risk_assessment?: {
    risk_level: number
    severity: string
    rationale: string
    confidence?: number
  }
  jira_ticket_url?: string
  processing_time_seconds?: number
}

interface DemoLocation {
  name: string
  latitude: number
  longitude: number
  description: string
}

interface SidebarProps {
  demoLocations: DemoLocation[]
  onLocationSelect: (location: DemoLocation) => void
  isAnalyzing: boolean
  currentAnalysis: AnalysisData | null
}

export default function Sidebar({ demoLocations, onLocationSelect, isAnalyzing, currentAnalysis }: SidebarProps) {
  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-400 border-green-400 bg-green-900/20'
      case 'MEDIUM': return 'text-yellow-400 border-yellow-400 bg-yellow-900/20'
      case 'HIGH': return 'text-orange-400 border-orange-400 bg-orange-900/20'
      case 'EXTREME': return 'text-red-400 border-red-400 bg-red-900/20'
      default: return 'text-gray-400 border-gray-400 bg-gray-900/20'
    }
  }

  return (
    <div className="w-80 bg-dark-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-2">Analysis Dashboard</h2>
        <p className="text-sm text-gray-400">
          Real-time wildfire risk assessment for Hawaiian Islands
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick Access Locations */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            Demo Locations
          </h3>
          <div className="space-y-2">
            {demoLocations.map((location, index) => (
              <button
                key={index}
                onClick={() => onLocationSelect(location)}
                disabled={isAnalyzing}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  isAnalyzing 
                    ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed opacity-50' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white mb-1">
                      {location.name}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {location.description}
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      {location.latitude.toFixed(3)}°N, {Math.abs(location.longitude).toFixed(3)}°W
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Analysis Details */}
        {currentAnalysis && (
          <>
            <div className="border-t border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Current Analysis
              </h3>

              {/* Analysis Location */}
              <div className="bg-dark-900 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Location</span>
                </div>
                <div className="text-white font-mono text-sm">
                  {currentAnalysis.coordinates.latitude.toFixed(4)}°N
                </div>
                <div className="text-white font-mono text-sm">
                  {Math.abs(currentAnalysis.coordinates.longitude).toFixed(4)}°W
                </div>
                {currentAnalysis.demo_mode && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-blue-900/50 border border-blue-500/30 rounded text-xs text-blue-400">
                      DEMO MODE
                    </span>
                  </div>
                )}
              </div>

              {/* Weather Data */}
              {currentAnalysis.weather && (
                <div className="bg-dark-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <CloudRain className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">Weather Conditions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Temperature</div>
                      <div className="text-white font-semibold">{currentAnalysis.weather.temperature_f}°F</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Humidity</div>
                      <div className="text-white font-semibold">{currentAnalysis.weather.humidity_percent}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Wind Speed</div>
                      <div className="text-white font-semibold">{currentAnalysis.weather.wind_speed_mph} mph</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Conditions</div>
                      <div className="text-white font-semibold capitalize">{currentAnalysis.weather.conditions}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Satellite Data */}
              {currentAnalysis.satellite && (
                <div className="bg-dark-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Satellite className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-gray-300">Satellite Analysis</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Vegetation Dryness</span>
                      <span className="text-white font-semibold">
                        {(currentAnalysis.satellite.dryness_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"
                        style={{ width: `${currentAnalysis.satellite.dryness_score * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Confidence: {(currentAnalysis.satellite.confidence * 100).toFixed(0)}%</span>
                      {currentAnalysis.satellite.tile_date && (
                        <span>Date: {currentAnalysis.satellite.tile_date}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Power Lines Data */}
              {currentAnalysis.power_lines && (
                <div className="bg-dark-900 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Power Infrastructure</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-400">Lines Nearby</div>
                      <div className="text-white font-semibold">{currentAnalysis.power_lines.count}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Nearest Distance</div>
                      <div className="text-white font-semibold">{currentAnalysis.power_lines.nearest_distance_m.toFixed(0)}m</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {currentAnalysis.risk_assessment && (
                <div className={`rounded-lg p-4 mb-4 border-2 ${getRiskColor(currentAnalysis.risk_assessment.severity)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Risk Assessment</span>
                    </div>
                    <span className="text-lg font-bold">
                      {currentAnalysis.risk_assessment.severity}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Risk Level</span>
                      <span>{(currentAnalysis.risk_assessment.risk_level * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          currentAnalysis.risk_assessment.severity === 'LOW' ? 'bg-green-500' :
                          currentAnalysis.risk_assessment.severity === 'MEDIUM' ? 'bg-yellow-500' :
                          currentAnalysis.risk_assessment.severity === 'HIGH' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${currentAnalysis.risk_assessment.risk_level * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs opacity-90 leading-relaxed mb-2">
                    {currentAnalysis.risk_assessment.rationale}
                  </p>

                  {currentAnalysis.risk_assessment.confidence && (
                    <div className="text-xs opacity-75">
                      Confidence: {(currentAnalysis.risk_assessment.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              )}

              {/* Jira Ticket */}
              {currentAnalysis.jira_ticket_url && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Incident Ticket Created</span>
                  </div>
                  <a
                    href={currentAnalysis.jira_ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline text-sm"
                  >
                    View Ticket →
                  </a>
                </div>
              )}

              {/* Analysis Status */}
              <div className="mt-4 text-center">
                <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                  currentAnalysis.status === 'processing' ? 'bg-blue-900/20 text-blue-400' :
                  currentAnalysis.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                  'bg-gray-900/20 text-gray-400'
                }`}>
                  {currentAnalysis.status === 'processing' && (
                    <div className="animate-spin w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                  )}
                  {currentAnalysis.status === 'completed' && (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  <span className="font-medium capitalize">{currentAnalysis.status}</span>
                  {currentAnalysis.processing_time_seconds && (
                    <span className="text-xs">
                      ({currentAnalysis.processing_time_seconds.toFixed(1)}s)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Instructions when no analysis */}
        {!currentAnalysis && !isAnalyzing && (
          <div className="border-t border-gray-700 p-6">
            <div className="bg-dark-900 rounded-lg p-4 text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Ready for Analysis
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Click on a demo location above or anywhere on the Hawaiian Islands map to start a comprehensive wildfire risk assessment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 