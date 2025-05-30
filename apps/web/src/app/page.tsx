'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import AnalysisProgress from '../components/AnalysisProgress'
import ChainOfThought from '@/components/ChainOfThought'

// Dynamic imports to avoid SSR issues
const MapComponent = dynamic(() => import('../components/MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-dark-900">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading PyroGuard Sentinel...</p>
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

export default function Home() {
  const searchParams = useSearchParams()
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [demoLocations, setDemoLocations] = useState<DemoLocation[]>([])
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

  // Check for demo mode in URL params
  useEffect(() => {
    const demo = searchParams?.get('demo') === '1' || false
    setDemoMode(demo)
    if (demo) {
      showNotification('Demo mode enabled - Using cached data for faster analysis', 'info')
    }
  }, [searchParams])

  // Test API connection on mount
  useEffect(() => {
    checkConnection()
    loadDemoLocations()
  }, [])

  const checkConnection = async () => {
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
  }

  const loadDemoLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/demo-locations`)
      if (response.ok) {
        const data = await response.json()
        setDemoLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to load demo locations:', error)
    }
  }

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
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

      // Set up Server-Sent Events for real-time progress
      const eventSource = new EventSource(`${API_URL}/api/v1/analyze/${analysisData.analysis_id}/progress`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Progress update:', data)

          if (data.type === 'connected') {
            console.log('✅ Connected to progress stream')
          } else if (data.type === 'progress') {
            // Update current analysis with new data
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
        console.error('EventSource error:', error)
        setIsAnalyzing(false)
        eventSource.close()
        eventSourceRef.current = null
        showNotification('Connection to analysis stream lost', 'error')
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

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <main className="flex flex-col h-screen bg-dark-900 text-white overflow-hidden">
      {/* Header */}
      <Header 
        demoMode={demoMode} 
        onDemoModeToggle={setDemoMode}
        connectionStatus={connectionStatus}
        currentAnalysis={currentAnalysis}
      />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg border ${
          notification.type === 'success' ? 'bg-green-900 border-green-500 text-green-100' :
          notification.type === 'error' ? 'bg-red-900 border-red-500 text-red-100' :
          'bg-blue-900 border-blue-500 text-blue-100'
        } transition-all duration-300 transform animate-in slide-in-from-top-4`}>
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          demoLocations={demoLocations}
          onLocationSelect={handleDemoLocationClick}
          isAnalyzing={isAnalyzing}
          currentAnalysis={currentAnalysis}
        />

        {/* Main content area */}
        <div className="flex-1 relative">
          {/* Map */}
          <MapComponent 
            onLocationClick={handleMapClick} 
            demoMode={demoMode}
            isAnalyzing={isAnalyzing}
            currentAnalysis={currentAnalysis}
            demoLocations={demoLocations}
          />

          {/* Enhanced Chain of Thought Reasoning */}
          {currentAnalysis && (
            <div className="mt-8">
              <ChainOfThought 
                analysisId={currentAnalysis.analysis_id}
                coordinates={currentAnalysis.coordinates}
                realTime={true}
              />
            </div>
          )}

          {/* Analysis Progress Overlay */}
          {currentAnalysis && (
            <div className="absolute top-4 right-4 z-[1000] max-h-[calc(100vh-120px)] overflow-y-auto">
              <AnalysisProgress 
                analysis={currentAnalysis} 
                demoMode={demoMode}
              />
            </div>
          )}

          {/* Quick Action Panel */}
          {!currentAnalysis && !isAnalyzing && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <div className="bg-dark-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-4 max-w-sm">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🔥 PyroGuard Sentinel
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Click anywhere on the Hawaiian Islands to start real-time wildfire risk analysis
                </p>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-400' :
                    connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                    'bg-red-400'
                  }`}></div>
                  <span className="text-gray-500">
                    {connectionStatus === 'connected' ? 'API Connected' :
                     connectionStatus === 'connecting' ? 'Connecting...' :
                     'API Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isAnalyzing && !currentAnalysis && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center">
              <div className="bg-dark-900 border border-gray-700 rounded-lg p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Initializing Analysis
                </h3>
                <p className="text-gray-400">
                  Preparing wildfire risk assessment...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 