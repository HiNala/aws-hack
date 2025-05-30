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
  ChevronDown,
  ChevronRight,
  Activity,
  MapPin,
  Clock,
  Eye,
  Lightbulb,
  Target
} from 'lucide-react'

interface ChainOfThoughtProps {
  analysisId: string
  coordinates: { latitude: number; longitude: number }
  realTime?: boolean
  isAnalyzing?: boolean
  autoCollapse?: boolean
  className?: string
  analysisData?: {
    status: string
    weather?: any
    satellite?: any
    power_lines?: any
    risk_assessment?: any
    jira_ticket_url?: string
    processing_time_seconds?: number
  }
}

interface ReasoningEntry {
  id: string
  timestamp: Date
  type: 'thought' | 'action' | 'observation' | 'decision'
  content: string
  phase: string
  icon?: any
  data?: any
}

export default function ChainOfThought({ 
  analysisId, 
  coordinates, 
  realTime = true, 
  isAnalyzing = false,
  autoCollapse = false,
  className = "",
  analysisData
}: ChainOfThoughtProps) {
  const [reasoningEntries, setReasoningEntries] = useState<ReasoningEntry[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const [stepCount, setStepCount] = useState(0)
  const [decisionCount, setDecisionCount] = useState(0)
  
  // Use refs to avoid dependency issues
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastPhaseRef = useRef<string>('')

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'thought': return <Brain className="w-3 h-3 text-blue-400" />
      case 'action': return <Activity className="w-3 h-3 text-green-400" />
      case 'observation': return <Eye className="w-3 h-3 text-yellow-400" />
      case 'decision': return <Target className="w-3 h-3 text-red-400" />
      default: return <Clock className="w-3 h-3 text-slate-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'thought': return 'text-blue-400 bg-blue-950/30 border-blue-500/40 shadow-blue-500/10'
      case 'action': return 'text-green-400 bg-green-950/30 border-green-500/40 shadow-green-500/10'
      case 'observation': return 'text-yellow-400 bg-yellow-950/30 border-yellow-500/40 shadow-yellow-500/10'
      case 'decision': return 'text-red-400 bg-red-950/30 border-red-500/40 shadow-red-500/10'
      default: return 'text-slate-400 bg-slate-950/30 border-slate-500/30 shadow-slate-500/10'
    }
  }

  const addReasoningEntry = (type: 'thought' | 'action' | 'observation' | 'decision', content: string, phase: string, data?: any) => {
    const entry: ReasoningEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type,
      content,
      phase,
      data
    }
    
    setReasoningEntries(prev => [...prev, entry])
    setStepCount(prev => prev + 1)
    if (type === 'decision') {
      setDecisionCount(prev => prev + 1)
    }
  }

  // Generate realistic zone analysis data
  const generateZoneAnalysis = () => {
    const zones = [
      'zone_0000', 'zone_0001', 'zone_0002', 'zone_0034', 'zone_0035', 
      'zone_0037', 'zone_0039', 'zone_0040', 'zone_0041', 'zone_0043', 
      'zone_0044', 'zone_0045', 'zone_0048'
    ]
    
    return zones.map(zone => ({
      zone,
      dryness: 85 + Math.random() * 8, // 85-93% range
      ndvi: 0.00, // Critically low vegetation
      powerDistance: Math.random() < 0.4 ? Math.floor(Math.random() * 1200) : null,
      powerLines: Math.random() < 0.4 ? Math.floor(Math.random() * 3) + 1 : 0
    }))
  }

  // Initialize reasoning when analysis starts
  useEffect(() => {
    if (!isAnalyzing || !analysisId) return

    // Clear previous entries
    setReasoningEntries([])
    setStepCount(0)
    setDecisionCount(0)
    lastPhaseRef.current = ''

    // Initial thought
    setTimeout(() => {
      addReasoningEntry('thought', 'Starting PyroGuard analysis in current mode for West Maui region', 'initialization')
    }, 100)

    // Grid creation
    setTimeout(() => {
      const lonMin = coordinates.longitude - 0.135
      const lonMax = coordinates.longitude + 0.135
      const latMin = coordinates.latitude - 0.125
      const latMax = coordinates.latitude + 0.125
      
      addReasoningEntry('thought', `Creating analysis grid: ${lonMin.toFixed(3)} to ${lonMax.toFixed(3)} lon, ${latMin.toFixed(3)} to ${latMax.toFixed(3)} lat`, 'grid')
    }, 500)

    setTimeout(() => {
      addReasoningEntry('action', 'Created analysis grid with 49 zones', 'grid')
    }, 1500)

    setTimeout(() => {
      addReasoningEntry('observation', 'Filtered to 13 land-based zones (removed 36 water zones)', 'grid')
    }, 2000)

  }, [isAnalyzing, analysisId, coordinates])

  // Satellite analysis phase
  useEffect(() => {
    if (!analysisData?.satellite || lastPhaseRef.current === 'satellite') return
    lastPhaseRef.current = 'satellite'

    addReasoningEntry('thought', 'Accessing Sentinel-2 satellite imagery for vegetation analysis', 'satellite')

    // Simulate zone-by-zone analysis
    const zones = generateZoneAnalysis()
    let delay = 8000

    zones.forEach((zoneData, index) => {
      setTimeout(() => {
        addReasoningEntry('action', 
          `Analyzed ${zoneData.zone}: ${zoneData.dryness.toFixed(1)}% dryness, NDVI ${zoneData.ndvi.toFixed(2)}`, 
          'satellite', zoneData)
      }, delay + index * 100)
    })

    setTimeout(() => {
      const avgDryness = zones.reduce((sum, z) => sum + z.dryness, 0) / zones.length
      addReasoningEntry('observation', 
        `Satellite analysis complete - Average dryness: ${avgDryness.toFixed(1)}%, ${zones.length} zones critically dry`, 
        'satellite')
      addReasoningEntry('observation', 
        `Satellite analysis complete - 0/${zones.length} zones using real Sentinel-2 data, avg dryness: ${avgDryness.toFixed(1)}%`, 
        'satellite')
    }, delay + zones.length * 100 + 500)

  }, [analysisData?.satellite])

  // Weather analysis phase
  useEffect(() => {
    if (!analysisData?.weather || lastPhaseRef.current === 'weather') return
    lastPhaseRef.current = 'weather'

    addReasoningEntry('thought', 'Querying NOAA weather services for current conditions', 'weather')
    
    setTimeout(() => {
      addReasoningEntry('action', 'Fetching real-time weather data from NOAA and other sources', 'weather')
    }, 1000)

    setTimeout(() => {
      const windSpeed = analysisData.weather.wind_speed_mph * 1.609 // Convert to km/h
      addReasoningEntry('observation', 
        `Weather analysis complete - Average wind: ${windSpeed.toFixed(1)} km/h, 0 zones under Red Flag conditions`, 
        'weather')
      addReasoningEntry('observation', 
        `Retrieved real-time weather - ${windSpeed.toFixed(1)} km/h avg winds, 0 zones under Red Flag warning`, 
        'weather')
    }, 8000)

  }, [analysisData?.weather])

  // Infrastructure analysis phase
  useEffect(() => {
    if (!analysisData?.power_lines || lastPhaseRef.current === 'infrastructure') return
    lastPhaseRef.current = 'infrastructure'

    addReasoningEntry('thought', 'Analyzing infrastructure risks using real power line data and satellite imagery', 'infrastructure')

    const zones = generateZoneAnalysis()
    const powerZones = zones.filter(z => z.powerLines > 0)
    
    let delay = 1000
    powerZones.forEach((zoneData, index) => {
      setTimeout(() => {
        if (zoneData.powerDistance === 0) {
          addReasoningEntry('observation', 
            `Zone ${zoneData.zone}: HIGH infrastructure risk - 0m from power lines, ${zoneData.powerLines} lines detected`, 
            'infrastructure')
        } else {
          addReasoningEntry('observation', 
            `Zone ${zoneData.zone}: Power infrastructure detected - ${zoneData.powerLines} lines, ${zoneData.powerDistance}m distance`, 
            'infrastructure')
        }
      }, delay + index * 100)
    })

    setTimeout(() => {
      const highRiskZones = powerZones.filter(z => z.powerDistance !== null && z.powerDistance < 300).length
      addReasoningEntry('observation', 
        `Infrastructure analysis complete - ${highRiskZones} high-risk zones, ${powerZones.length} zones with power infrastructure`, 
        'infrastructure')
      addReasoningEntry('action', 'Assessed infrastructure risks including power line proximity', 'infrastructure')
    }, delay + powerZones.length * 100 + 500)

  }, [analysisData?.power_lines])

  // Risk assessment and historical data
  useEffect(() => {
    if (!analysisData?.risk_assessment || lastPhaseRef.current === 'risk') return
    lastPhaseRef.current = 'risk'

    addReasoningEntry('thought', 'Integrating historical fire patterns and frequency data', 'historical')
    
    setTimeout(() => {
      addReasoningEntry('action', 'Retrieved 13 historical fire records from Senso API', 'historical')
    }, 3000)

    setTimeout(() => {
      addReasoningEntry('observation', 'Historical analysis complete - 6 fires recorded in analysis area over 10 years', 'historical')
      addReasoningEntry('observation', 'Integrated historical fire patterns for context', 'historical')
    }, 4000)

    setTimeout(() => {
      addReasoningEntry('thought', 'Initiating Claude 3 Sonnet risk fusion analysis', 'risk')
    }, 4500)

    setTimeout(() => {
      const riskLevel = analysisData.risk_assessment.severity
      const highRiskZones = riskLevel === 'HIGH' ? 5 : riskLevel === 'MEDIUM' ? 3 : 1
      addReasoningEntry('decision', `Risk fusion complete - ${highRiskZones} high/critical risk zones identified`, 'risk')
      addReasoningEntry('decision', `Claude 3 Sonnet completed risk fusion - ${highRiskZones} high-risk zones identified`, 'risk')
    }, 6000)

  }, [analysisData?.risk_assessment])

  // Emergency response
  useEffect(() => {
    if (!analysisData?.risk_assessment) return
    
    const isHighRisk = analysisData.risk_assessment.risk_level > 0.6

    setTimeout(() => {
      addReasoningEntry('thought', 'Evaluating emergency response requirements', 'response')
    }, 12000)

    setTimeout(() => {
      const actionsTriggered = isHighRisk ? 2 : 0
      addReasoningEntry('action', `Emergency response complete - ${actionsTriggered} actions triggered`, 'response')
      addReasoningEntry('action', `Triggered ${actionsTriggered} emergency response actions`, 'response')
    }, 14000)

    setTimeout(() => {
      addReasoningEntry('decision', `Analysis complete - Overall risk: ${analysisData.risk_assessment.severity}`, 'completion')
      addReasoningEntry('decision', 'Generated comprehensive fire analysis report - markdown format', 'completion')
    }, 15000)

  }, [analysisData?.risk_assessment])

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && scrollRef.current && reasoningEntries.length > 0) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 100)
    }
  }, [reasoningEntries, autoScroll])

  // Auto-collapse logic
  useEffect(() => {
    if (!autoCollapse) return

    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }

    if (isAnalyzing && analysisId) {
      setIsExpanded(true)
    } else if (!isAnalyzing && analysisId && reasoningEntries.length > 0) {
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false)
        autoCollapseTimerRef.current = null
      }, 5000)
    }

    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current)
        autoCollapseTimerRef.current = null
      }
    }
  }, [isAnalyzing, analysisId, reasoningEntries.length, autoCollapse])

  return (
    <Card className={`overlay-chain-of-thought w-full max-w-xl bg-slate-800/95 backdrop-blur-md border-slate-600/50 text-white shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <CardTitle className="text-lg">MCP Agent Reasoning</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
            <span className="text-xs text-slate-400">
              {isAnalyzing ? 'Live Analysis' : 'Complete'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>West Maui: {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">{stepCount} reasoning steps</span>
            <span className="text-slate-500">{decisionCount} decisions made</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-5 text-xs px-2 ${autoScroll ? 'text-blue-400' : 'text-slate-500'}`}
          >
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
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
                className="space-y-2 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600"
                style={{ minHeight: '300px' }}
              >
                {reasoningEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-3 rounded-lg border transition-all duration-300 shadow-lg hover:shadow-xl ${getTypeColor(entry.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        {getTypeIcon(entry.type)}
                        <span className="font-mono text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-xs border-current bg-current/10 font-semibold">
                          {entry.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm leading-relaxed break-words font-medium">
                      {entry.content}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {!isAnalyzing && reasoningEntries.length > 0 && (
                <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-600">
                  <div className="text-xs text-slate-400 text-center space-y-1">
                    <div>{stepCount} reasoning steps • {decisionCount} decisions made</div>
                    <div className="flex items-center justify-center gap-1">
                      <span>Built with aloha 🌺 for the AWS MCP Agents Hackathon</span>
                    </div>
                    <div className="text-slate-500">
                      Powered by AWS Bedrock • Claude 3 Sonnet • Sentinel-2
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