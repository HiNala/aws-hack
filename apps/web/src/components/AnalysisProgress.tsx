import React, { useState, useEffect } from 'react'
import { 
  Satellite, 
  CloudRain, 
  Zap, 
  Brain, 
  Ticket, 
  CheckCircle, 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  Eye, 
  Cpu, 
  Image,
  CheckCircle2,
  CloudSun
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    analysis_method?: string
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
    component_risks?: {
      vegetation: number
      weather: number
      power_infrastructure: number
    }
  }
  jira_ticket_url?: string
  processing_time_seconds?: number
}

interface AnalysisProgressProps {
  analysis: AnalysisData
  demoMode: boolean
}

export default function AnalysisProgress({ analysis, demoMode }: AnalysisProgressProps) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)
  const [showMCPThinking, setShowMCPThinking] = useState(false)

  const phases = [
    { 
      icon: MapPin, 
      label: 'Location Verification', 
      key: 'location', 
      completed: true,
      description: 'Validating Hawaiian Islands coordinates',
      details: `Verified: ${analysis.coordinates.latitude.toFixed(4)}°N, ${Math.abs(analysis.coordinates.longitude).toFixed(4)}°W`
    },
    { 
      icon: Satellite, 
      label: 'Satellite Analysis', 
      key: 'satellite', 
      completed: !!analysis.satellite,
      description: 'Processing live vegetation dryness from Sentinel-2 imagery',
      details: analysis.satellite ? 
        `Clarifai NDVI → ${(analysis.satellite.dryness_score * 100).toFixed(1)}% dryness` : 
        'Fetching live satellite imagery from AWS S3...'
    },
    { 
      icon: CloudRain, 
      label: 'Weather Integration', 
      key: 'weather', 
      completed: !!analysis.weather,
      description: 'Fetching real-time NOAA meteorological data',
      details: analysis.weather ? 
        `${analysis.weather.temperature_f}°F, ${analysis.weather.wind_speed_mph}mph winds, ${analysis.weather.humidity_percent}% humidity` :
        'Querying NOAA weather.gov API...'
    },
    { 
      icon: Zap, 
      label: 'Power Infrastructure', 
      key: 'power_lines', 
      completed: !!analysis.power_lines,
      description: 'Analyzing OpenStreetMap electrical grid proximity',
      details: analysis.power_lines ? 
        `${analysis.power_lines.count} power lines, nearest ${analysis.power_lines.nearest_distance_m.toFixed(0)}m` :
        'Scanning 500m radius via Overpass API...'
    },
    { 
      icon: Brain, 
      label: 'MCP Agent Reasoning', 
      key: 'risk_assessment', 
      completed: !!analysis.risk_assessment,
      description: 'Multi-source risk synthesis via MCP reasoning chain',
      details: analysis.risk_assessment ? 
        `${analysis.risk_assessment.severity} risk (${(analysis.risk_assessment.risk_level * 100).toFixed(0)}% confidence)` :
        'Analyzing satellite + weather + power data...'
    },
    { 
      icon: Ticket, 
      label: 'Incident Automation', 
      key: 'jira_ticket', 
      completed: !!analysis.jira_ticket_url || (analysis.risk_assessment && analysis.risk_assessment.risk_level < 0.3),
      description: 'Make.com webhook → Jira ticket automation',
      details: analysis.jira_ticket_url ? 
        'Incident ticket created successfully' : 
        analysis.risk_assessment && analysis.risk_assessment.risk_level < 0.3 ?
        'Risk below threshold - no ticket needed' :
        'Triggering automated response workflow...'
    }
  ]

  // Update current phase based on analysis progress
  useEffect(() => {
    const completedPhases = phases.filter(p => p.completed).length
    if (completedPhases > currentPhase) {
      setCurrentPhase(completedPhases)
      setAnimationKey(prev => prev + 1)
    }
  }, [analysis, phases.length])

  const getPhaseStatus = (phase: typeof phases[0], index: number) => {
    if (phase.completed) return 'completed'
    if (index === currentPhase && analysis.status === 'processing') return 'active'
    return 'pending'
  }

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-400 border-green-400 bg-green-900/20'
      case 'MEDIUM': return 'text-yellow-400 border-yellow-400 bg-yellow-900/20'
      case 'HIGH': return 'text-orange-400 border-orange-400 bg-orange-900/20'
      case 'EXTREME': return 'text-red-400 border-red-400 bg-red-900/20'
      default: return 'text-gray-400 border-gray-400 bg-gray-900/20'
    }
  }

  const progressPercentage = Math.round((phases.filter(p => p.completed).length / phases.length) * 100)

  return (
    <div className="bg-dark-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-6 min-w-[520px] max-w-2xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="animate-pulse w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              PyroGuard Sentinel Analysis
            </h3>
            <p className="text-sm text-gray-400">
              Live wildfire risk assessment • ID: {analysis.analysis_id.slice(-8)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Processing Time</div>
          <div className="text-lg font-mono text-white">
            {analysis.processing_time_seconds ? `${analysis.processing_time_seconds.toFixed(1)}s` : '0.0s'}
          </div>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-gray-300">Analysis Location</span>
            {demoMode && (
              <span className="px-2 py-1 bg-blue-900/50 border border-blue-500/30 rounded text-xs text-blue-400">
                DEMO MODE
              </span>
            )}
          </div>
          {analysis.satellite?.analysis_method && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Image className="w-3 h-3" />
              <span>Live satellite processing</span>
            </div>
          )}
        </div>
        <div className="text-white font-mono">
          {analysis.coordinates.latitude.toFixed(4)}°N, {Math.abs(analysis.coordinates.longitude).toFixed(4)}°W
        </div>
        <div className="text-xs text-gray-500 mt-1">Hawaiian Islands • Real-time analysis</div>
      </div>

      {/* Phase Progress */}
      <div className="space-y-4 mb-6">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, index)
          const Icon = phase.icon
          
          return (
            <div 
              key={`${phase.key}-${animationKey}`} 
              className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-500 ${
                status === 'completed' ? 'bg-green-900/20 border border-green-500/30' :
                status === 'active' ? 'bg-blue-900/20 border border-blue-500/30 shadow-lg' :
                'bg-gray-900/20 border border-gray-600/30'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                status === 'completed' 
                  ? 'bg-green-600 border-green-500 scale-110' 
                  : status === 'active'
                  ? 'bg-blue-600 border-blue-500 animate-pulse scale-105'
                  : 'bg-gray-700 border-gray-600'
              }`}>
                {status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Icon className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold transition-colors duration-300 mb-1 ${
                  status === 'completed' ? 'text-green-400' :
                  status === 'active' ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  {phase.label}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {phase.description}
                </div>
                <div className="text-xs text-gray-300 bg-dark-700 rounded px-2 py-1 font-mono">
                  {phase.details}
                </div>
                
                {/* Enhanced phase-specific data display */}
                {phase.key === 'satellite' && analysis.satellite && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-orange-400 font-medium">
                        🌿 Vegetation Dryness: {(analysis.satellite.dryness_score * 100).toFixed(1)}%
                      </span>
                      <span className="text-blue-400">
                        📊 Confidence: {(analysis.satellite.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {analysis.satellite.analysis_method && (
                      <div className="text-xs text-green-400">
                        ✅ Analysis Method: {analysis.satellite.analysis_method}
                      </div>
                    )}
                    {analysis.satellite.tile_date && (
                      <div className="text-xs text-gray-500">
                        📅 Satellite Date: {analysis.satellite.tile_date}
                      </div>
                    )}
                  </div>
                )}
                
                {phase.key === 'weather' && analysis.weather && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-orange-400">🌡️ Temperature:</span>
                      <span className="text-white ml-1">{analysis.weather.temperature_f}°F</span>
                    </div>
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-blue-400">💨 Wind Speed:</span>
                      <span className="text-white ml-1">{analysis.weather.wind_speed_mph} mph</span>
                    </div>
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-cyan-400">💧 Humidity:</span>
                      <span className="text-white ml-1">{analysis.weather.humidity_percent}%</span>
                    </div>
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-gray-400">☁️ Conditions:</span>
                      <span className="text-white ml-1 capitalize">{analysis.weather.conditions}</span>
                    </div>
                  </div>
                )}
                
                {phase.key === 'power_lines' && analysis.power_lines && (
                  <div className="mt-3 flex items-center space-x-4 text-xs">
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-yellow-400">⚡ Power Lines:</span>
                      <span className="text-white ml-1">{analysis.power_lines.count} detected</span>
                    </div>
                    <div className="bg-dark-700 rounded px-2 py-1">
                      <span className="text-orange-400">📏 Nearest:</span>
                      <span className="text-white ml-1">{analysis.power_lines.nearest_distance_m.toFixed(0)}m away</span>
                    </div>
                  </div>
                )}
                
                {phase.key === 'risk_assessment' && analysis.risk_assessment && (
                  <div className="mt-3 space-y-2">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(analysis.risk_assessment.severity)}`}>
                      <TrendingUp className="w-3 h-3" />
                      <span>{analysis.risk_assessment.severity} RISK</span>
                      <span>({(analysis.risk_assessment.risk_level * 100).toFixed(0)}%)</span>
                    </div>
                    
                    {/* MCP Reasoning Toggle */}
                    <button
                      onClick={() => setShowMCPThinking(!showMCPThinking)}
                      className="flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 underline"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>View MCP Chain of Thought</span>
                    </button>
                    
                    {/* Component Risks Breakdown */}
                    {analysis.risk_assessment.component_risks && (
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        <div className="bg-dark-700 rounded px-2 py-1 text-center">
                          <div className="text-green-400">Vegetation</div>
                          <div className="text-white">{(analysis.risk_assessment.component_risks.vegetation * 100).toFixed(0)}%</div>
                        </div>
                        <div className="bg-dark-700 rounded px-2 py-1 text-center">
                          <div className="text-blue-400">Weather</div>
                          <div className="text-white">{(analysis.risk_assessment.component_risks.weather * 100).toFixed(0)}%</div>
                        </div>
                        <div className="bg-dark-700 rounded px-2 py-1 text-center">
                          <div className="text-yellow-400">Power</div>
                          <div className="text-white">{(analysis.risk_assessment.component_risks.power_infrastructure * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {phase.key === 'jira_ticket' && analysis.jira_ticket_url && (
                  <div className="mt-3">
                    <a 
                      href={analysis.jira_ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-900/50 border border-blue-500/30 rounded text-xs text-blue-300 hover:text-blue-200 hover:bg-blue-900/70 transition-colors"
                    >
                      <Ticket className="w-3 h-3" />
                      <span>Open Incident Ticket</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
              
              {status === 'active' && (
                <div className="flex space-x-1 mt-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MCP Chain of Thought Reasoning */}
      {showMCPThinking && analysis.risk_assessment && (
        <div className="mb-6 bg-dark-800 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">MCP Agent Chain of Thought</span>
          </div>
          <div className="space-y-2 text-xs text-gray-300 leading-relaxed">
            <div className="bg-dark-700 rounded p-2">
              <span className="text-purple-300 font-medium">🧠 Reasoning Process:</span>
              <div className="mt-1">{analysis.risk_assessment.rationale}</div>
            </div>
            <div className="bg-dark-700 rounded p-2">
              <span className="text-blue-300 font-medium">📊 Multi-Source Data Fusion:</span>
              <div className="mt-1">
                Satellite imagery ({(analysis.satellite?.dryness_score || 0) * 100}% dryness) + 
                NOAA weather ({analysis.weather?.temperature_f}°F, {analysis.weather?.wind_speed_mph}mph) + 
                Power infrastructure ({analysis.power_lines?.count} lines) → 
                Computed risk: {(analysis.risk_assessment.risk_level * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-dark-700 rounded p-2">
              <span className="text-green-300 font-medium">✅ Confidence Assessment:</span>
              <div className="mt-1">
                Model confidence: {(analysis.risk_assessment.confidence || 0) * 100}% based on data quality and cross-validation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-3 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Risk Assessment Summary */}
      {analysis.risk_assessment && (
        <div className={`rounded-lg p-4 border-2 ${getRiskColor(analysis.risk_assessment.severity)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Final Risk Assessment</span>
            </div>
            <span className="text-lg font-bold">
              {analysis.risk_assessment.severity}
            </span>
          </div>
          <p className="text-sm opacity-90 leading-relaxed mb-3">
            {analysis.risk_assessment.rationale}
          </p>
          <div className="flex items-center justify-between text-xs opacity-75">
            <span>Assessment Confidence: {(analysis.risk_assessment.confidence || 0) * 100}%</span>
            <span>Risk Score: {(analysis.risk_assessment.risk_level * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="mt-6 text-center">
        <p className={`text-sm font-medium ${
          analysis.status === 'processing' ? 'text-blue-400' : 
          analysis.status === 'completed' ? 'text-green-400' :
          analysis.status === 'failed' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {analysis.status === 'processing' ? '🔄 Live analysis in progress...' : 
           analysis.status === 'completed' ? '✅ Real-time analysis complete!' :
           analysis.status === 'failed' ? '❌ Analysis failed' :
           '⏳ Preparing live analysis...'}
        </p>
      </div>
    </div>
  )
} 