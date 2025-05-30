import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// Components
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import AnalysisProgress from '@/components/AnalysisProgress'

// Types
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
  }
  power_lines?: {
    count: number
    nearest_distance_m: number
  }
  risk_assessment?: {
    risk_level: number
    severity: string
    rationale: string
  }
  jira_ticket_url?: string
  processing_time_seconds?: number
}

// Dynamic import of Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading interactive map...</p>
      </div>
    </div>
  )
})

export default function Home() {
  const router = useRouter()
  const [demoMode, setDemoMode] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([])

  // Check for demo mode in URL
  useEffect(() => {
    const demo = router.query.demo === '1'
    setDemoMode(demo)
  }, [router.query.demo])

  const startAnalysis = useCallback(async (latitude: number, longitude: number) => {
    try {
      setIsAnalyzing(true)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      
      const response = await fetch(`${apiUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          demo_mode: demoMode
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const analysisData: AnalysisData = await response.json()
      setCurrentAnalysis(analysisData)
      
      // Start listening for progress updates
      startProgressUpdates(analysisData.analysis_id)
      
    } catch (error) {
      console.error('Failed to start analysis:', error)
      setIsAnalyzing(false)
      // Show error notification
      alert('Failed to start analysis. Please check the API connection.')
    }
  }, [demoMode])

  const startProgressUpdates = useCallback((analysisId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    const eventSource = new EventSource(`${apiUrl}/api/v1/analyze/${analysisId}/progress`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'progress') {
          // Update current analysis with new data
          setCurrentAnalysis((prev: AnalysisData | null) => {
            if (!prev || prev.analysis_id !== analysisId) return prev
            
            return {
              ...prev,
              status: data.status,
              processing_time_seconds: data.processing_time,
              weather: data.weather || prev.weather,
              satellite: data.satellite || prev.satellite,
              power_lines: data.power_lines || prev.power_lines,
              risk_assessment: data.risk_assessment || prev.risk_assessment,
              jira_ticket_url: data.jira_ticket_url || prev.jira_ticket_url,
            }
          })
        } else if (data.type === 'complete') {
          // Analysis completed
          setIsAnalyzing(false)
          eventSource.close()
          
          // Add to history
          setCurrentAnalysis((prev: AnalysisData | null) => {
            if (prev) {
              setAnalysisHistory((history: AnalysisData[]) => [prev, ...history.slice(0, 4)]) // Keep last 5
            }
            return prev
          })
        } else if (data.type === 'error' || data.type === 'timeout') {
          setIsAnalyzing(false)
          eventSource.close()
          console.error('Analysis failed:', data.message)
        }
      } catch (error) {
        console.error('Failed to parse progress data:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Progress stream error:', error)
      setIsAnalyzing(false)
      eventSource.close()
    }

    // Cleanup on unmount or new analysis
    return () => eventSource.close()
  }, [])

  const handleMapClick = useCallback((lat: number, lng: number) => {
    // Only allow new analysis if not currently analyzing
    if (!isAnalyzing) {
      startAnalysis(lat, lng)
    }
  }, [startAnalysis, isAnalyzing])

  const toggleDemoMode = useCallback(() => {
    const newDemoMode = !demoMode
    setDemoMode(newDemoMode)
    
    // Update URL
    if (newDemoMode) {
      router.push('/?demo=1', undefined, { shallow: true })
    } else {
      router.push('/', undefined, { shallow: true })
    }
  }, [demoMode, router])

  return (
    <>
      <Head>
        <title>
          {demoMode ? 'PyroGuard Sentinel - Demo Mode' : 'PyroGuard Sentinel - Live Analysis'}
        </title>
      </Head>
      
      <div className="h-screen bg-dark-950 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          demoMode={demoMode}
          onToggleDemoMode={toggleDemoMode}
          currentAnalysis={currentAnalysis}
          isAnalyzing={isAnalyzing}
        />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Map Area */}
          <div className="flex-1 relative">
            <MapComponent onMapClick={handleMapClick} analysisData={currentAnalysis} />
            
            {/* Analysis Progress Overlay */}
            {isAnalyzing && currentAnalysis && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <AnalysisProgress 
                  analysis={currentAnalysis}
                  demoMode={demoMode}
                />
              </div>
            )}
          </div>
          
          {/* Right Sidebar */}
          <Sidebar 
            currentAnalysis={currentAnalysis}
            analysisHistory={analysisHistory}
            isAnalyzing={isAnalyzing}
            demoMode={demoMode}
          />
        </div>
      </div>
    </>
  )
} 