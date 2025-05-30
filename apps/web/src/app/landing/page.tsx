"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PyroGuardHero from '@/components/LandingHero';
import PyroGuardFeatures from '@/components/FeaturesSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // For hackathon purposes - simulate OAuth but allow bypass
      // In production, this would redirect to Auth0 or other OAuth provider
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate auth delay
      
      // Store auth state (in production this would be handled by OAuth provider)
      localStorage.setItem('pyroguard_auth', 'true');
      localStorage.setItem('pyroguard_user', JSON.stringify({
        name: 'Hackathon User',
        email: 'nalamaui30@gmail.com',
        role: 'emergency_coordinator'
      }));
      
      // Redirect to main application
      router.push('/app?demo=1');
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = () => {
    // Direct access to demo without auth
    router.push('/app?demo=1');
  };

  const handleBypassAuth = () => {
    // Hackathon bypass - direct access
    localStorage.setItem('pyroguard_auth', 'bypass');
    localStorage.setItem('pyroguard_user', JSON.stringify({
      name: 'Demo User',
      email: 'demo@pyroguard.ai',
      role: 'demo'
    }));
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <PyroGuardHero
        title="Detect Wildfires Before They Spread"
        subtitle="PyroGuard Sentinel uses advanced AI to identify wildfire risks, provide early warnings, and help emergency services respond faster. Protect Hawaii's communities with cutting-edge technology."
        onLoginClick={handleLogin}
        onDemoClick={handleDemo}
        actions={[
          {
            label: "Try Demo",
            href: "#",
            variant: "outline"
          },
          {
            label: "Emergency Login",
            href: "#",
            variant: "default"
          }
        ]}
      />

      {/* Features Section */}
      <PyroGuardFeatures />

      {/* Solutions Section */}
      <section id="solutions" className="py-16 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Wildfire Solutions for Hawaii</h2>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              Tailored for Hawaii's unique environment, terrain, and emergency response needs.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Emergency Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time incident management, resource coordination, and automated response protocols 
                  for fire departments, emergency management, and first responders.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-yellow-600 mb-4" />
                <CardTitle>Utility Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Power line monitoring, equipment health assessment, and predictive maintenance 
                  to prevent utility-caused ignitions and ensure grid safety.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Community Safety</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Public alert systems, evacuation planning, and community preparedness tools 
                  to keep residents informed and safe during wildfire events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-muted/50 py-16 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Emergency Response Pricing</h2>
            <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
              Flexible pricing for emergency services, utility companies, and government agencies.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Basic Monitoring</CardTitle>
                <div className="text-3xl font-bold">$5,000<span className="text-lg text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Satellite imagery analysis</li>
                  <li>• Basic weather integration</li>
                  <li>• Email alerts</li>
                  <li>• Monthly reports</li>
                  <li>• Standard support</li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Contact Sales</Button>
              </CardContent>
            </Card>

            <Card className="ring-2 ring-primary">
              <CardHeader>
                <CardTitle>Emergency Response</CardTitle>
                <div className="text-3xl font-bold">$15,000<span className="text-lg text-muted-foreground">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• All Basic features</li>
                  <li>• Real-time AI analysis</li>
                  <li>• Automated incident management</li>
                  <li>• 24/7 monitoring</li>
                  <li>• Priority support</li>
                  <li>• Custom integrations</li>
                </ul>
                <Button className="w-full mt-6" onClick={handleLogin}>
                  {isLoading ? 'Connecting...' : 'Start Emergency Access'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-3xl font-bold">Custom<span className="text-lg text-muted-foreground">/pricing</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• All Emergency features</li>
                  <li>• Multi-region coverage</li>
                  <li>• Advanced analytics</li>
                  <li>• Dedicated support team</li>
                  <li>• Custom AI models</li>
                  <li>• White-label solutions</li>
                </ul>
                <Button className="w-full mt-6" variant="outline">Contact Enterprise</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">About PyroGuard Sentinel</h2>
            <div className="mt-8 max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
              <p>
                PyroGuard Sentinel was developed in response to Hawaii's increasing wildfire risks, 
                combining cutting-edge AI technology with comprehensive environmental monitoring.
              </p>
              <p>
                Our system integrates multiple data sources including AWS satellite imagery, NOAA weather data, 
                OpenStreetMap infrastructure mapping, and advanced AI analysis from Anthropic and Clarifai 
                to provide the most accurate wildfire risk assessment available.
              </p>
              <p>
                Built for emergency responders, utility companies, and community safety coordinators, 
                PyroGuard Sentinel delivers actionable intelligence in under 20 seconds to help prevent 
                disasters before they happen.
              </p>
            </div>

            {/* Hackathon Auth Options */}
            <div className="mt-12 p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
              <h3 className="text-xl font-semibold mb-4">🏆 Hackathon Access Options</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Button onClick={handleDemo} variant="outline" size="lg">
                  Demo Mode (No Auth)
                </Button>
                <Button onClick={handleLogin} size="lg" disabled={isLoading}>
                  {isLoading ? 'Authenticating...' : 'Emergency Login (OAuth)'}
                </Button>
                <Button onClick={handleBypassAuth} variant="secondary" size="lg">
                  🛠️ Hackathon Bypass
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                For the hackathon demonstration. In production, only OAuth authentication would be available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold">PyroGuard Sentinel</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 PyroGuard Sentinel. Protecting Hawaii's communities with AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 