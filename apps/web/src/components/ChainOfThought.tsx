'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Satellite, 
  CloudSun, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Activity,
  Flame,
  Wind,
  Thermometer,
  Droplets
} from 'lucide-react'

interface ChainOfThoughtProps {
  analysisId: string
  coordinates: { latitude: number; longitude: number }
  realTime?: boolean
  className?: string
}

interface ReasoningStep {
  id: string
  phase: string
  title: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  confidence: number
  details: string[]
  sponsorTool?: string
  data?: any
  processing_time?: number
  timestamp: Date
  reasoning?: string
  critical_factors?: string[]
}

const REASONING_PHASES = [
  {
    id: 'data_fusion',
    title: 'Multi-Source Data Fusion',
    icon: Satellite,
    color: 'text-blue-500',
    description: 'Integrating satellite imagery, weather data, and power infrastructure'
  },
  {
    id: 'vegetation_analysis', 
    title: 'Vegetation Intelligence',
    icon: Activity,
    color: 'text-green-500',
    description: 'Analyzing vegetation moisture and fuel load conditions'
  },
  {
    id: 'weather_synthesis',
    title: 'Weather Pattern Analysis', 
    icon: CloudSun,
    color: 'text-yellow-500',
    description: 'Processing meteorological conditions and fire weather index'
  },
  {
    id: 'infrastructure_assessment',
    title: 'Infrastructure Risk Assessment',
    icon: Zap,
    color: 'text-purple-500', 
    description: 'Evaluating power line proximity and ignition sources'
  },
  {
    id: 'fire_behavior_prediction',
    title: 'Fire Behavior Modeling',
    icon: Flame,
    color: 'text-red-500',
    description: 'Predicting fire spread characteristics and suppression difficulty'
  },
  {
    id: 'risk_synthesis',
    title: 'Comprehensive Risk Synthesis',
    icon: Brain,
    color: 'text-indigo-500',
    description: 'Multi-factor wildfire risk assessment and recommendations'
  }
]

export default function ChainOfThought({ 
  analysisId, 
  coordinates, 
  realTime = true, 
  className = "" 
}: ChainOfThoughtProps) {
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [isActive, setIsActive] = useState(realTime)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const initializeReasoning = () => {
    const initialSteps: ReasoningStep[] = REASONING_PHASES.map((phase, index) => ({
      id: phase.id,
      phase: phase.id,
      title: phase.title,
      status: index === 0 ? 'processing' : 'pending',
      confidence: 0,
      details: [`Initializing ${phase.description.toLowerCase()}...`],
      timestamp: new Date(),
      sponsorTool: getSponsorTool(phase.id)
    }))
    
    setReasoningSteps(initialSteps)
    setCurrentPhase(0)
  }

  const getSponsorTool = (phaseId: string): string => {
    const toolMap: Record<string, string> = {
      'data_fusion': 'AWS S3 + Clarifai + NOAA + OpenStreetMap',
      'vegetation_analysis': 'Clarifai NDVI Model',
      'weather_synthesis': 'NOAA Weather Service',
      'infrastructure_assessment': 'OpenStreetMap Overpass API',
      'fire_behavior_prediction': 'Advanced Fire Modeling Engine',
      'risk_synthesis': 'Multi-Agent Reasoning System'
    }
    return toolMap[phaseId] || 'Unknown Tool'
  }

  const updateReasoningStep = (phaseId: string, updates: Partial<ReasoningStep>) => {
    setReasoningSteps(prev => prev.map(step => 
      step.id === phaseId ? { ...step, ...updates, timestamp: new Date() } : step
    ))
  }

  const simulateAdvancedReasoning = async () => {
    if (!isActive) return

    for (let i = 0; i < REASONING_PHASES.length; i++) {
      const phase = REASONING_PHASES[i]
      setCurrentPhase(i)

      // Start processing phase
      updateReasoningStep(phase.id, {
        status: 'processing',
        details: [`🔄 Initiating ${phase.description.toLowerCase()}...`]
      })

      await new Promise(resolve => setTimeout(resolve, 800))

      // Simulate detailed reasoning for each phase
      await simulatePhaseReasoning(phase.id, i)

      // Complete phase
      updateReasoningStep(phase.id, {
        status: 'complete',
        confidence: 0.85 + Math.random() * 0.12
      })

      await new Promise(resolve => setTimeout(resolve, 300))

      // Start next phase
      if (i < REASONING_PHASES.length - 1) {
        updateReasoningStep(REASONING_PHASES[i + 1].id, {
          status: 'processing'
        })
      }
    }
  }

  const simulatePhaseReasoning = async (phaseId: string, phaseIndex: number) => {
    const reasoningData = getPhaseReasoningData(phaseId, coordinates)
    
    for (let step = 0; step < reasoningData.length; step++) {
      if (!isActive) break
      
      updateReasoningStep(phaseId, {
        details: reasoningData.slice(0, step + 1),
        confidence: Math.min(0.95, 0.60 + (step / reasoningData.length) * 0.35)
      })
      
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))
    }
  }

  const getPhaseReasoningData = (phaseId: string, coords: { latitude: number; longitude: number }): string[] => {
    const lat = coords.latitude.toFixed(4)
    const lon = Math.abs(coords.longitude).toFixed(4)
    
    switch (phaseId) {
      case 'data_fusion':
        return [
          `📍 Location verified: ${lat}°N, ${lon}°W (Hawaiian Islands)`,
          `🛰️ Retrieving Sentinel-2 satellite imagery from AWS S3`,
          `🌤️ Fetching current weather conditions from NOAA Weather Service`,
          `⚡ Querying power infrastructure from OpenStreetMap database`,
          `🔗 Cross-referencing data sources for temporal alignment`,
          `✅ Multi-source data fusion complete: 4/4 systems operational`
        ]

      case 'vegetation_analysis':
        return [
          `🌿 Analyzing vegetation spectral signature via Clarifai NDVI model`,
          `📊 NDVI calculation: Moderate vegetation stress detected (0.72 dryness)`,
          `🔥 Fuel moisture estimation: 12.3% (Below critical threshold of 15%)`,
          `🌱 Vegetation type classification: Stressed shrubland ecosystem`,
          `⚠️ Fire susceptibility: HIGH - Low moisture content increases ignition risk`,
          `🎯 Confidence assessment: 94% (High-quality satellite data)`
        ]

      case 'weather_synthesis':
        return [
          `🌡️ Temperature analysis: 82°F (Above fire weather threshold)`,
          `💨 Wind conditions: 18 mph from northeast (Elevated fire spread risk)`,
          `💧 Relative humidity: 31% (Below safe threshold of 60%)`,
          `☀️ Weather pattern: Dry conditions with clear skies`,
          `📈 Fire Weather Index: 7.2/10 (HIGH - Critical fire weather conditions)`,
          `🚨 Red Flag conditions present: High temperature, low humidity, strong winds`
        ]

      case 'infrastructure_assessment':
        return [
          `🔍 Power infrastructure scan: 500m radius analysis`,
          `⚡ Power lines detected: 3 transmission lines within assessment area`,
          `📏 Proximity analysis: Nearest line at 230m (MODERATE risk distance)`,
          `🏗️ Infrastructure density: Medium (3 lines per km²)`,
          `💨 Wind-power interaction: 18 mph winds increase arcing potential`,
          `⚖️ Ignition risk assessment: 0.42 probability (Wind + proximity factors)`
        ]

      case 'fire_behavior_prediction':
        return [
          `🔥 Rate of spread calculation: 2.1 mph (Rapid spread expected)`,
          `📏 Flame length estimate: 6.8 feet (Moderate to high intensity)`,
          `🌪️ Spotting potential: 900 feet (Ember transport risk)`,
          `🚁 Suppression difficulty: DIFFICULT (Wind + terrain + fuel load)`,
          `⏰ Evacuation timeline: 2-4 hours if fire reaches populated areas`,
          `📊 Fire behavior class: Type 4 - Fast-moving grass/shrub fire`
        ]

      case 'risk_synthesis':
        return [
          `🧠 Integrating vegetation (72% risk) + weather (81% risk) + infrastructure (42% risk)`,
          `⚖️ Weighted risk calculation: Vegetation 30% + Weather 40% + Infrastructure 30%`,
          `📊 Composite risk score: 7.2/10 (HIGH RISK - Immediate attention required)`,
          `🎯 Confidence assessment: 91% (High-quality multi-source analysis)`,
          `📋 Recommendation: Issue fire weather watch, pre-position resources`,
          `🎫 Automated response: Creating incident ticket for emergency services`
        ]

      default:
        return [`Processing ${phaseId}...`]
    }
  }

  const handleToggleReasoning = () => {
    setIsActive(!isActive)
    if (!isActive) {
      initializeReasoning()
      simulateAdvancedReasoning()
    }
  }

  const handleRestart = () => {
    setIsActive(false)
    setCurrentPhase(0)
    initializeReasoning()
    setTimeout(() => {
      setIsActive(true)
      simulateAdvancedReasoning()
    }, 500)
  }

  useEffect(() => {
    if (realTime && analysisId) {
      initializeReasoning()
      simulateAdvancedReasoning()
    }
  }, [realTime, analysisId])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [reasoningSteps, autoScroll])

  const getRiskColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-red-500'
    if (confidence > 0.6) return 'text-orange-500'
    if (confidence > 0.4) return 'text-yellow-500'
    return 'text-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />
    }
  }

  return (
    <Card className={`w-full max-w-md bg-dark-900/95 backdrop-blur-md border-gray-700 text-white ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-lg">MCP Chain of Thought</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleReasoning}
              className="h-8 w-8 p-0"
            >
              {isActive ? 
                <Pause className="w-4 h-4" /> : 
                <Play className="w-4 h-4" />
              }
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Location: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Auto-scroll:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-5 text-xs px-2 ${autoScroll ? 'text-blue-400' : 'text-gray-500'}`}
          >
            {autoScroll ? 'ON' : 'OFF'}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-0">
              <div 
                ref={scrollRef}
                className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
              >
                {reasoningSteps.map((step, index) => {
                  const PhaseIcon = REASONING_PHASES[index]?.icon || Brain
                  const phaseColor = REASONING_PHASES[index]?.color || 'text-gray-500'
                  
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border rounded-lg p-3 transition-all duration-300 ${
                        step.status === 'processing' 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : step.status === 'complete'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-gray-600 bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <PhaseIcon className={`w-4 h-4 ${phaseColor}`} />
                        <span className="font-medium text-sm">{step.title}</span>
                        {getStatusIcon(step.status)}
                        {step.confidence > 0 && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ml-auto ${getRiskColor(step.confidence)}`}
                          >
                            {(step.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      
                      {step.sponsorTool && (
                        <div className="text-xs text-blue-400 mb-2">
                          🔧 {step.sponsorTool}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <motion.div
                            key={detailIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: detailIndex * 0.2 }}
                            className="text-xs text-gray-300 leading-relaxed"
                          >
                            {detail}
                          </motion.div>
                        ))}
                      </div>
                      
                      {step.processing_time && (
                        <div className="text-xs text-gray-500 mt-2">
                          ⏱️ {step.processing_time.toFixed(1)}s
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
              
              {reasoningSteps.length > 0 && (
                <div className="mt-4 p-2 bg-gray-800/50 rounded border border-gray-600">
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span className="text-gray-300">
                      Analysis Progress: {currentPhase + 1}/{REASONING_PHASES.length}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-20 bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${((currentPhase + 1) / REASONING_PHASES.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 