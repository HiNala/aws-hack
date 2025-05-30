import React, { useState, useEffect } from 'react'
import { Brain, Zap, CheckCircle, AlertTriangle, Info, Clock, TrendingUp, Eye, Cpu, Activity, Target, FileText, Database, CloudRain, Satellite, MapPin } from 'lucide-react'

interface ReasoningStep {
  id: string
  timestamp: string
  category: 'data_fusion' | 'analysis' | 'risk_assessment' | 'decision' | 'validation'
  title: string
  description: string
  confidence: number
  data?: any
  status: 'processing' | 'complete' | 'warning' | 'error'
  reasoning: string
  next_steps?: string[]
}

interface ChainOfThoughtProps {
  analysisId?: string
  coordinates?: { latitude: number; longitude: number }
  realTime?: boolean
}

const ChainOfThought: React.FC<ChainOfThoughtProps> = ({ 
  analysisId, 
  coordinates, 
  realTime = true 
}) => {
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [currentPhase, setCurrentPhase] = useState<string>('initializing')
  const [isActive, setIsActive] = useState(false)

  // Simulate real-time MCP reasoning
  useEffect(() => {
    if (!analysisId || !isActive) return

    const simulateReasoning = () => {
      const steps: ReasoningStep[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          category: 'data_fusion',
          title: '🗺️ Location Context Analysis',
          description: 'Analyzing geographic coordinates for Hawaii wildfire risk factors',
          confidence: 0.95,
          status: 'complete',
          reasoning: `Coordinates ${coordinates?.latitude}, ${coordinates?.longitude} confirmed within Maui County. Cross-referencing with historical fire incident database shows this area has 3 documented wildfire events in past 5 years. Elevation: ~2,847ft, vegetation type: mixed grassland with invasive species.`,
          data: {
            county: 'Maui',
            elevation_ft: 2847,
            historical_fires: 3,
            vegetation: 'mixed_grassland'
          }
        },
        {
          id: '2', 
          timestamp: new Date(Date.now() + 1000).toISOString(),
          category: 'data_fusion',
          title: '🛰️ Satellite Image Intelligence',
          description: 'Processing Sentinel-2 L2A imagery from AWS Registry of Open Data',
          confidence: 0.88,
          status: 'complete',
          reasoning: 'Sentinel-2 tile T04QFJ captured 2 days ago shows NDVI values indicating stressed vegetation. Moisture content analysis reveals 68% below normal for this season. Thermal bands show surface temperatures 4.2°C above historical average.',
          data: {
            tile_id: 'T04QFJ',
            ndvi_avg: 0.23,
            moisture_deficit: '68%',
            temp_anomaly: '+4.2°C'
          }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() + 2000).toISOString(), 
          category: 'data_fusion',
          title: '🌤️ Meteorological Conditions',
          description: 'Integrating NOAA weather data and fire weather indices',
          confidence: 0.92,
          status: 'complete',
          reasoning: 'Current conditions: 26.4 mph sustained winds from NE (concerning direction for fire spread). Relative humidity at 35% (critical threshold <40%). No precipitation forecast for 72+ hours. Fire Weather Index: EXTREME (95/100).',
          data: {
            wind_speed_mph: 26.4,
            wind_direction: 'NE',
            humidity_percent: 35,
            fire_weather_index: 95
          }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() + 3000).toISOString(),
          category: 'analysis',
          title: '⚡ Power Infrastructure Risk',
          description: 'Analyzing proximity to electrical transmission systems',
          confidence: 0.85,
          status: 'complete', 
          reasoning: 'OpenStreetMap data reveals 3 major transmission lines within 500m radius. Nearest line: 230m distance, 46kV rating. Historical data shows 67% of Maui wildfires originated near power infrastructure. Wind direction analysis indicates potential arc/equipment failure could ignite downwind vegetation.',
          data: {
            transmission_lines: 3,
            nearest_distance_m: 230,
            voltage_rating: '46kV',
            ignition_probability: 0.67
          }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() + 4000).toISOString(),
          category: 'risk_assessment',
          title: '🧠 Multi-Factor Risk Synthesis',
          description: 'Integrating all data sources using weighted risk algorithms',
          confidence: 0.91,
          status: 'complete',
          reasoning: 'Risk matrix calculation: Vegetation stress (HIGH) × Wind conditions (EXTREME) × Infrastructure proximity (HIGH) × Historical patterns (MODERATE) = SEVERE RISK (8.7/10). Primary concern: Equipment failure during high wind event with immediate ignition of dry vegetation and rapid NE wind-driven spread.',
          data: {
            vegetation_risk: 'HIGH',
            weather_risk: 'EXTREME', 
            infrastructure_risk: 'HIGH',
            composite_score: 8.7,
            primary_scenario: 'equipment_failure_wind_driven'
          }
        },
        {
          id: '6',
          timestamp: new Date(Date.now() + 5000).toISOString(),
          category: 'decision',
          title: '🎯 Automated Response Triggering',
          description: 'Activating incident management protocols via Make.com → Jira integration',
          confidence: 0.97,
          status: 'complete',
          reasoning: 'Risk threshold exceeded (8.7 > 7.0 trigger level). Automated incident ticket creation initiated. Recommended actions: (1) Increase power line monitoring, (2) Pre-position fire resources, (3) Community alert notification, (4) Vegetation management review.',
          next_steps: [
            'Power utility notification sent',
            'Fire department alert triggered', 
            'Community notification queued',
            'Resource pre-positioning recommended'
          ]
        }
      ]

      steps.forEach((step, index) => {
        setTimeout(() => {
          setReasoningSteps(prev => [...prev, step])
          setCurrentPhase(step.category)
          
          // Auto-scroll to bottom
          setTimeout(() => {
            const element = document.getElementById('reasoning-container')
            if (element) {
              element.scrollTop = element.scrollHeight
            }
          }, 100)
        }, index * (realTime ? 2000 : 500))
      })
    }

    simulateReasoning()
  }, [analysisId, isActive, realTime, coordinates])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_fusion': return <Database className="w-4 h-4" />
      case 'analysis': return <Eye className="w-4 h-4" />
      case 'risk_assessment': return <TrendingUp className="w-4 h-4" />
      case 'decision': return <Target className="w-4 h-4" />
      case 'validation': return <CheckCircle className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">MCP Agent Reasoning</h2>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Real-time Analysis</span>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isActive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isActive ? 'Stop' : 'Start'} Reasoning
          </button>
        </div>
      </div>

      <div 
        id="reasoning-container"
        className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4 bg-gray-50"
      >
        {reasoningSteps.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Click "Start Reasoning" to begin MCP agent analysis</p>
          </div>
        )}
        
        {reasoningSteps.map((step, index) => (
          <div 
            key={step.id}
            className={`border rounded-lg p-4 bg-white shadow-sm transform transition-all duration-500 ${
              index === reasoningSteps.length - 1 ? 'ring-2 ring-purple-200 scale-[1.02]' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  step.category === 'data_fusion' ? 'bg-blue-100' :
                  step.category === 'analysis' ? 'bg-green-100' :
                  step.category === 'risk_assessment' ? 'bg-yellow-100' :
                  step.category === 'decision' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  {getCategoryIcon(step.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  step.confidence > 0.9 ? 'bg-green-100 text-green-800' :
                  step.confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {Math.round(step.confidence * 100)}% confidence
                </span>
                {getStatusIcon(step.status)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded p-3 mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>Reasoning:</strong> {step.reasoning}
              </p>
            </div>
            
            {step.data && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(step.data).map(([key, value]) => (
                  <div key={key} className="bg-blue-50 px-2 py-1 rounded">
                    <span className="font-medium text-blue-800">{key}:</span>
                    <span className="text-blue-600 ml-1">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {step.next_steps && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-900 mb-2">Next Actions:</p>
                <ul className="space-y-1">
                  {step.next_steps.map((action, i) => (
                    <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {reasoningSteps.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-purple-900">Current Phase:</span>
            <span className="text-purple-700 capitalize">{currentPhase.replace('_', ' ')}</span>
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(reasoningSteps.length / 6) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChainOfThought 