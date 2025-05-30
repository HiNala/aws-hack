"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Satellite,
  Zap,
  Shield,
  Clock,
  Database,
  Brain,
  GitBranch,
  Eye,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Globe,
  Wind,
  Thermometer,
  Flame,
  CloudSun,
  MapPin,
  Activity
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => {
    localStorage.setItem('pyroguard_auth', 'true');
    localStorage.setItem('pyroguard_user', JSON.stringify({
      name: 'Hackathon User',
      email: 'nalamaui30@gmail.com',
      role: 'emergency_coordinator'
    }));
    router.push('/app?demo=1');
  };

  const handleDemo = () => {
    router.push('/app?demo=1');
  };

  const handleBypassAuth = () => {
    localStorage.setItem('pyroguard_auth', 'bypass');
    localStorage.setItem('pyroguard_user', JSON.stringify({
      name: 'Demo User',
      email: 'demo@pyroguard.ai',
      role: 'demo'
    }));
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">PyroGuard Sentinel</span>
            <Badge variant="outline" className="ml-2 text-xs">AWS MCP 2025</Badge>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#technology" className="text-gray-600 hover:text-gray-900 transition-colors">
              Technology
            </a>
            <Button onClick={handleLogin}>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-100">
            Model-Context-Protocol Compliant • Hawaiian Islands Focus
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Live Wildfire Risk
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              {" "}
              Intelligence
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            PyroGuard Sentinel converts real-time satellite data into actionable wildfire risk assessments for Hawaii. Click anywhere on
            the map to trigger our MCP agent pipeline and get risk intelligence in under 20 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleDemo}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              Try Live Demo
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={handleBypassAuth}>
              🛠️ Hackathon Access
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Clock className="w-8 h-8 text-orange-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">{"< 20s"}</div>
              <div className="text-gray-600">Response Time</div>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="w-8 h-8 text-blue-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">6 APIs</div>
              <div className="text-gray-600">Live Integrations</div>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900">MCP</div>
              <div className="text-gray-600">Standards-Based</div>
            </div>
          </div>
          
          {/* Made with Aloha accent */}
          <div className="mt-8 flex items-center justify-center space-x-2 text-lg text-gray-600">
            <span>🌺</span>
            <span className="font-medium">Made with Aloha for AWS MCP Agents Hackathon 2025</span>
            <span>🌺</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Intelligent Risk Assessment for Hawaii</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Combining satellite imagery, weather data, and infrastructure mapping for comprehensive wildfire risk
              analysis tailored to Hawaiian Islands
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Satellite className="w-10 h-10 text-blue-500 mb-2" />
                <CardTitle>Satellite Intelligence</CardTitle>
                <CardDescription>
                  Real-time Sentinel-2 imagery from AWS S3 processed through Clarifai's NDVI model to assess vegetation
                  dryness across Hawaiian Islands
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Wind className="w-10 h-10 text-green-500 mb-2" />
                <CardTitle>NOAA Weather Integration</CardTitle>
                <CardDescription>
                  Live wind, humidity, and temperature data from NOAA Weather Service to understand current fire spread conditions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Zap className="w-10 h-10 text-yellow-500 mb-2" />
                <CardTitle>Power Infrastructure Mapping</CardTitle>
                <CardDescription>
                  Power-line density analysis via OpenStreetMap Overpass API to identify electrical ignition risk factors
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Brain className="w-10 h-10 text-purple-500 mb-2" />
                <CardTitle>AWS Bedrock Reasoning</CardTitle>
                <CardDescription>
                  Claude 3 Sonnet processes structured context to deliver comprehensive risk verdicts with natural language rationale
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Eye className="w-10 h-10 text-indigo-500 mb-2" />
                <CardTitle>MCP Chain of Thought</CardTitle>
                <CardDescription>
                  Transparent agent reasoning visualization showing real-time API calls and decision-making process
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                <CardTitle>Automated Response</CardTitle>
                <CardDescription>
                  Automatic Jira incident creation via Make.com webhook for immediate emergency response coordination
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">MCP Pipeline in Action</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A single map click on Hawaiian Islands triggers our Model-Context-Protocol pipeline: Plan → Reason → Act
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Plan</h3>
                <p className="text-gray-600">
                  Map click initiates data collection strategy. Inngest orchestrates parallel requests to satellite,
                  weather, and infrastructure APIs across 6 sponsor services.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Reason</h3>
                <p className="text-gray-600">
                  AWS Bedrock Claude 3 analyzes structured context from NDVI scores, NOAA weather conditions, and power-line density to
                  assess wildfire risk factors.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Act</h3>
                <p className="text-gray-600">
                  Generate risk assessment, visualize Chain of Thought reasoning, and automatically create incident tickets via Make.com for immediate
                  emergency response.
                </p>
              </div>
            </div>

            <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sponsor Tool Integration & Data Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Satellite className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">AWS S3 Sentinel-2 imagery</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">Clarifai NDVI vegetation analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Anthropic Vision API (fallback)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Wind className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">NOAA Weather Service conditions</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-700">OpenStreetMap power-line mapping</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">AWS Bedrock risk synthesis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-gray-700">Make.com → Jira automation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span className="text-gray-700">Real-time MCP reasoning chain</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section id="technology" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Built on Modern Standards</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transparent, standards-based AI architecture using live satellite data and sponsor APIs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Model-Context-Protocol</CardTitle>
                <CardDescription>Standards-compliant agent architecture</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <MapPin className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">West Maui Focus</CardTitle>
                <CardDescription>Lahaina region default analysis</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Zap className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Vercel + Render</CardTitle>
                <CardDescription>Scalable deployment infrastructure</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <Clock className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                <CardTitle className="text-lg">{"< 20 Second"}</CardTitle>
                <CardDescription>End-to-end response time</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Hackathon-specific section */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏆 AWS MCP Agents Hackathon 2025</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-2xl font-bold text-orange-600 mb-2">6</div>
                <div className="text-sm text-gray-600">Sponsor Tool Integrations</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-2xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Live Data Sources</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-2xl font-bold text-green-600 mb-2">MCP</div>
                <div className="text-sm text-gray-600">Compliant Architecture</div>
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button onClick={handleDemo} size="lg" className="bg-orange-500 hover:bg-orange-600">
                Demo Mode (No Auth)
              </Button>
              <Button onClick={handleLogin} size="lg" variant="outline">
                Bypass Login (OAuth)
              </Button>
              <Button onClick={handleBypassAuth} size="lg" variant="secondary">
                🛠️ Hackathon Bypass
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-500 to-red-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Predict Wildfire Risk in Hawaii?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Experience transparent, MCP-compliant AI that turns satellite data into actionable wildfire intelligence for Hawaiian Islands protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleDemo} className="bg-white text-orange-600 hover:bg-gray-100">
              Try West Maui Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLogin}
              className="border-white text-white hover:bg-white hover:text-orange-600"
            >
              Start Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">PyroGuard Sentinel</span>
              </div>
              <p className="text-gray-400">
                MCP-compliant wildfire risk intelligence for Hawaiian Islands using real-time satellite data and public APIs.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#technology" className="hover:text-white transition-colors">
                    Technology
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    MCP Standards
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    AWS Integration
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Architecture
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Hackathon 2025</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo Access
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PyroGuard Sentinel. Made with Aloha 🌺 for AWS MCP Agents Hackathon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 