'use client'

import React, { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Flame, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Wind, 
  Droplets,
  Zap,
  StopCircle,
  CheckCircle2,
  Satellite,
  CloudSun
} from 'lucide-react'

// Dynamic imports to avoid SSR issues
const MapComponent = dynamic(() => import('../../components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-400">Loading PyroGuard Sentinel...</p>
      </div>
    </div>
  )
})

const ChainOfThought = dynamic(() => import('@/components/ChainOfThought'), { 
  ssr: false,
  loading: () => (
    <div className="w-72 h-40 bg-slate-800/50 border border-slate-600/50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-slate-400 text-sm">Loading reasoning...</p>
      </div>
    </div>
  )
})

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
  error_message?: string
}

interface DemoLocation {
  name: string
  latitude: number
  longitude: number
  description: string
}

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Loading PyroGuard Sentinel...</p>
        </div>
      </div>
    }>
      <AppContent />
    </Suspense>
  )
}

function AppContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [demoLocations, setDemoLocations] = useState<DemoLocation[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082'

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('pyroguard_auth')
    if (authStatus === 'true' || authStatus === 'bypass') {
      setIsAuthenticated(true)
    } else {
      router.replace('/landing')
      return
    }
    setIsLoading(false)
  }, [router])

  // Check for demo mode in URL params
  useEffect(() => {
    if (!isAuthenticated) return
    
    const demo = searchParams?.get('demo') === '1' || false
    setDemoMode(demo)
    if (demo) {
      showNotification('Demo mode enabled - Using cached data for faster analysis', 'info')
    }
  }, [searchParams, isAuthenticated])

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/`)
      if (response.ok) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
    }
  }, [API_URL])

  const loadDemoLocations = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/demo-locations`)
      if (response.ok) {
        const data = await response.json()
        setDemoLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to load demo locations:', error)
    }
  }, [API_URL])

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  // Test API connection on mount
  useEffect(() => {
    if (!isAuthenticated) return
    
    checkConnection()
    loadDemoLocations()
  }, [isAuthenticated, checkConnection, loadDemoLocations])

  const handleLogout = () => {
    localStorage.removeItem('pyroguard_auth')
    localStorage.removeItem('pyroguard_user')
    router.push('/landing')
  }

  const handleMapClick = async (lat: number, lng: number) => {
    if (isAnalyzing) {
      showNotification('Analysis already in progress. Please wait for completion.', 'info')
      return
    }

    // Close any existing EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsAnalyzing(true)
    setCurrentAnalysis(null)

    try {
      // Start analysis
      const analysisResponse = await fetch(`${API_URL}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          demo_mode: demoMode
        }),
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.detail?.message || 'Analysis request failed')
      }

      const analysisData = await analysisResponse.json()
      console.log('🚀 Analysis started:', analysisData)

      // Initialize analysis data
      setCurrentAnalysis({
        analysis_id: analysisData.analysis_id,
        status: 'processing',
        coordinates: {
          latitude: lat,
          longitude: lng
        },
        demo_mode: demoMode,
        processing_time_seconds: 0
      })

      // Set up Server-Sent Events for real-time progress with proper error handling
      try {
        const eventSource = new EventSource(`${API_URL}/api/v1/analyze/${analysisData.analysis_id}/progress`)
        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📡 Progress update:', data)

            if (data.type === 'connected') {
              console.log('✅ Connected to progress stream')
            } else if (data.type === 'progress') {
              setCurrentAnalysis(prev => {
                if (!prev) return prev
                return {
                  ...prev,
                  status: data.status,
                  processing_time_seconds: data.processing_time || prev.processing_time_seconds,
                  weather: data.weather || prev.weather,
                  satellite: data.satellite || prev.satellite,
                  power_lines: data.power_lines || prev.power_lines,
                  risk_assessment: data.risk_assessment || prev.risk_assessment,
                  jira_ticket_url: data.jira_ticket_url || prev.jira_ticket_url
                }
              })
            } else if (data.type === 'complete') {
              console.log('✅ Analysis complete')
              setIsAnalyzing(false)
              eventSource.close()
              eventSourceRef.current = null
              
              if (data.status === 'completed') {
                showNotification('🔥 Wildfire risk analysis completed successfully!', 'success')
              } else {
                showNotification('Analysis completed with errors', 'error')
              }
            } else if (data.type === 'timeout') {
              console.log('⏰ Analysis timeout')
              setIsAnalyzing(false)
              eventSource.close()
              eventSourceRef.current = null
              showNotification('Analysis taking longer than expected. Please try again.', 'error')
            } else if (data.type === 'error') {
              console.error('❌ Progress stream error:', data.message)
              setIsAnalyzing(false)
              eventSource.close()
              eventSourceRef.current = null
              showNotification('Analysis stream error occurred', 'error')
            }
          } catch (error) {
            console.error('Failed to parse progress data:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.warn('EventSource connection lost, attempting fallback...')
          setIsAnalyzing(false)
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }
          showNotification('Connection to analysis stream lost', 'error')
        }
      } catch (eventSourceError) {
        console.error('Failed to create EventSource:', eventSourceError)
        setIsAnalyzing(false)
        showNotification('Unable to establish real-time connection', 'error')
      }

    } catch (error) {
      console.error('Analysis failed:', error)
      setIsAnalyzing(false)
      showNotification(error instanceof Error ? error.message : 'Failed to start analysis', 'error')
    }
  }

  const handleDemoLocationClick = (location: DemoLocation) => {
    handleMapClick(location.latitude, location.longitude)
  }

  const stopAnalysis = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    setIsAnalyzing(false)
    showNotification('Analysis stopped', 'info')
  }

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'  
      case 'HIGH': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'EXTREME': return 'text-red-400 bg-red-400/10 border-red-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      {/* Modern Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-white">PyroGuard Sentinel</h1>
            </div>
            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
              AWS MCP Agents Hackathon 2025
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge 
              variant="outline" 
              className={`text-xs ${demoMode ? 'text-blue-400 border-blue-400/30' : 'text-slate-400 border-slate-600'}`}
            >
              {demoMode ? 'Demo Mode' : 'Live Mode'}
            </Badge>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`} />
              <span className="text-xs text-slate-400">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 'Offline'}
              </span>
            </div>

            {currentAnalysis && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  currentAnalysis.status === 'processing' ? 'text-blue-400 border-blue-400/30' :
                  currentAnalysis.status === 'completed' ? 'text-green-400 border-green-400/30' :
                  'text-slate-400 border-slate-600'
                }`}
              >
                {currentAnalysis.status === 'processing' ? 'Analysis Running...' :
                 currentAnalysis.status === 'completed' ? 'Analysis Complete' :
                 'Ready'}
              </Badge>
            )}

            {/* Made with Aloha accent */}
            <div className="flex items-center space-x-1 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-slate-600/30">
              <span>🌺</span>
              <span>Made with Aloha</span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-slate-400 border-slate-600 hover:bg-slate-700"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-md ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500/50 text-green-100' :
          notification.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-red-100' :
          'bg-blue-900/90 border-blue-500/50 text-blue-100'
        } transition-all duration-300 animate-in slide-in-from-top-4`}>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Demo Locations */}
        <div className="w-72 bg-slate-800/50 border-r border-slate-700/50 p-3 overflow-y-auto flex-shrink-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white mb-2">Demo Locations</h2>
            <p className="text-sm text-slate-400 mb-4">
              Select a location for wildfire risk analysis
            </p>
          </div>

          <div className="space-y-2">
            {demoLocations.map((location, index) => (
              <Card 
                key={index}
                className="bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => handleDemoLocationClick(location)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <h3 className="font-medium text-white text-sm">{location.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{location.description}</p>
                  <div className="text-xs text-slate-500 font-mono">
                    {location.latitude.toFixed(4)}°N, {Math.abs(location.longitude).toFixed(4)}°W
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Analysis Button for West Maui */}
          <Card className="bg-orange-500/10 border-orange-500/30 mt-4">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="font-medium text-orange-400 text-sm">Quick Analysis</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Start analysis at West Maui (high-risk area)
              </p>
              <Button 
                onClick={() => handleMapClick(20.8783, -156.6825)}
                disabled={isAnalyzing}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs py-2"
              >
                {isAnalyzing ? 'Running...' : 'Analyze West Maui'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center - Map */}
        <div className="flex-1 relative min-w-0">
          <MapComponent 
            onLocationClick={handleMapClick} 
            demoMode={demoMode}
            isAnalyzing={isAnalyzing}
            currentAnalysis={currentAnalysis}
            demoLocations={demoLocations}
          />

          {/* Chain of Thought Reasoning - Shows API calls and reasoning */}
          {currentAnalysis && (
            <div className="absolute top-4 left-4 z-[1000] max-w-sm">
              <ChainOfThought 
                analysisId={currentAnalysis.analysis_id}
                coordinates={currentAnalysis.coordinates}
                realTime={true}
              />
            </div>
          )}

          {/* Map Instructions Overlay */}
          {!currentAnalysis && !isAnalyzing && (
            <div className="absolute top-4 left-4 z-[1000]">
              <Card className="bg-slate-800/90 backdrop-blur-md border-slate-600/50 max-w-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Map Instructions</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Click anywhere on the Hawaiian Islands to start real-time wildfire risk analysis.
                    Focus area: West Maui (Lahaina region)
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Loading Overlay */}
          {isAnalyzing && !currentAnalysis && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
              <Card className="bg-slate-800/90 backdrop-blur-md border-slate-600/50">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-white mb-2">Analyzing Wildfire Risk</h3>
                  <p className="text-slate-400 mb-4">Processing real-time satellite data...</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={stopAnalysis}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <StopCircle className="w-4 h-4 mr-1" />
                    Stop Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Right Panel - Analysis Results */}
        <div className="w-80 bg-slate-800/50 border-l border-slate-700/50 p-3 overflow-y-auto flex-shrink-0">
          {currentAnalysis ? (
            <div className="space-y-4">
              {/* Analysis Header */}
              <Card className="bg-slate-700/30 border-slate-600/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">West Maui Analysis</CardTitle>
                    {isAnalyzing ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={stopAnalysis}
                        className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      >
                        <StopCircle className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-white font-mono text-xs">
                        {currentAnalysis.coordinates.latitude.toFixed(4)}°N, {Math.abs(currentAnalysis.coordinates.longitude).toFixed(4)}°W
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Status:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          currentAnalysis.status === 'processing' ? 'text-blue-400 border-blue-400/30' :
                          'text-green-400 border-green-400/30'
                        }`}
                      >
                        {currentAnalysis.status === 'processing' ? (
                          <>
                            <Activity className="w-3 h-3 mr-1 animate-pulse" />
                            Processing
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </>
                        )}
                      </Badge>
                    </div>
                    {currentAnalysis.processing_time_seconds && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Time:</span>
                        <span className="text-white font-mono text-xs">
                          {currentAnalysis.processing_time_seconds.toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              {currentAnalysis.risk_assessment && (
                <Card className="bg-slate-700/30 border-slate-600/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Risk Level:</span>
                        <Badge 
                          variant="outline" 
                          className={getRiskColor(currentAnalysis.risk_assessment.severity)}
                        >
                          {currentAnalysis.risk_assessment.severity}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-400">Probability:</span>
                          <span className="text-white font-semibold">
                            {(currentAnalysis.risk_assessment.risk_level * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${currentAnalysis.risk_assessment.risk_level * 100}%`,
                              backgroundColor: currentAnalysis.risk_assessment.severity === 'LOW' ? '#10b981' :
                                             currentAnalysis.risk_assessment.severity === 'MEDIUM' ? '#f59e0b' :
                                             currentAnalysis.risk_assessment.severity === 'HIGH' ? '#f97316' : '#ef4444'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-sm">Analysis:</span>
                        <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                          {currentAnalysis.risk_assessment.rationale}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weather Conditions */}
              {currentAnalysis.weather && (
                <Card className="bg-slate-700/30 border-slate-600/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <CloudSun className="w-5 h-5 mr-2 text-yellow-400" />
                      Weather Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <div>
                          <div className="text-slate-400">Temperature</div>
                          <div className="text-white font-semibold">{currentAnalysis.weather.temperature_f}°F</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <div>
                          <div className="text-slate-400">Humidity</div>
                          <div className="text-white font-semibold">{currentAnalysis.weather.humidity_percent}%</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-slate-400">Wind Speed</div>
                          <div className="text-white font-semibold">{currentAnalysis.weather.wind_speed_mph} mph</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CloudSun className="w-4 h-4 text-yellow-400" />
                        <div>
                          <div className="text-slate-400">Conditions</div>
                          <div className="text-white font-semibold">{currentAnalysis.weather.conditions}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Satellite Data */}
              {currentAnalysis.satellite && (
                <Card className="bg-slate-700/30 border-slate-600/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <Satellite className="w-5 h-5 mr-2 text-purple-400" />
                      Satellite Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Dryness Score:</span>
                        <span className="text-white font-semibold">
                          {(currentAnalysis.satellite.dryness_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="text-white font-semibold">
                          {(currentAnalysis.satellite.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      {currentAnalysis.satellite.tile_date && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Image Date:</span>
                          <span className="text-white font-mono text-xs">
                            {currentAnalysis.satellite.tile_date}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Power Infrastructure */}
              {currentAnalysis.power_lines && (
                <Card className="bg-slate-700/30 border-slate-600/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-white flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                      Power Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lines Detected:</span>
                        <span className="text-white font-semibold">
                          {currentAnalysis.power_lines.count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nearest Distance:</span>
                        <span className="text-white font-semibold">
                          {currentAnalysis.power_lines.nearest_distance_m}m
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">Agent Ready</h3>
              <p className="text-sm text-slate-500">
                Start an analysis to see the PyroGuard agent's reasoning process in real-time
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 