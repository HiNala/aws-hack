import React from 'react'
import { MapPin, Activity, Wifi, WifiOff } from 'lucide-react'

interface AnalysisData {
  analysis_id: string
  status: string
  risk_assessment?: {
    severity: string
    risk_level: number
  }
  processing_time_seconds?: number
}

interface HeaderProps {
  demoMode: boolean
  onDemoModeToggle: (enabled: boolean) => void
  connectionStatus: 'connecting' | 'connected' | 'error'
  currentAnalysis: AnalysisData | null
}

export default function Header({ demoMode, onDemoModeToggle, connectionStatus, currentAnalysis }: HeaderProps) {
  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'text-green-400'
      case 'MEDIUM': return 'text-yellow-400'
      case 'HIGH': return 'text-orange-400'
      case 'EXTREME': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <header className="bg-dark-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🔥</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">PyroGuard Sentinel</h1>
            <p className="text-xs text-gray-400">AI-Powered Wildfire Risk Assessment</p>
          </div>
        </div>

        {/* Location Indicator */}
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>Hawaiian Islands</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Current Analysis Status */}
        {currentAnalysis && (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                {currentAnalysis.status === 'processing' ? 'Analyzing...' : 'Analysis Complete'}
              </span>
            </div>
            
            {currentAnalysis.risk_assessment && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                currentAnalysis.risk_assessment.severity === 'LOW' ? 'border-green-500 bg-green-900/20 text-green-400' :
                currentAnalysis.risk_assessment.severity === 'MEDIUM' ? 'border-yellow-500 bg-yellow-900/20 text-yellow-400' :
                currentAnalysis.risk_assessment.severity === 'HIGH' ? 'border-orange-500 bg-orange-900/20 text-orange-400' :
                'border-red-500 bg-red-900/20 text-red-400'
              }`}>
                {currentAnalysis.risk_assessment.severity} RISK
              </div>
            )}
            
            {currentAnalysis.processing_time_seconds && (
              <span className="text-xs text-gray-500 font-mono">
                {currentAnalysis.processing_time_seconds.toFixed(1)}s
              </span>
            )}
          </div>
        )}

        {/* Demo Mode Toggle */}
        <div className="flex items-center space-x-3">
          <label className="text-sm text-gray-300">Demo Mode</label>
          <button
            onClick={() => onDemoModeToggle(!demoMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-dark-800 ${
              demoMode ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {connectionStatus === 'connected' ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : connectionStatus === 'connecting' ? (
            <Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            connectionStatus === 'connected' ? 'text-green-400' :
            connectionStatus === 'connecting' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting' :
             'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
} 