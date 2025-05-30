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
        subtitle="PyroGuard Sentinel uses advanced AI to identify wildfire risks, provide early warnings, and help emergency services respond faster. Protect Hawaii&apos;s communities with cutting-edge technology."
        onLoginClick={handleLogin}
        onDemoClick={handleDemo}
        actions={[
          {
            label: "Try Demo",
            href: "#",
            variant: "outline"
          },
          {
            label: "Bypass Login",
            href: "#",
            variant: "default"
          }
        ]}
      />

      {/* Features Section */}
      <PyroGuardFeatures />

      {/* Solutions Section */}
      <section id="solutions" className="py-20 md:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-balance text-4xl font-semibold tracking-tight lg:text-5xl mb-6">Wildfire Solutions for Hawaii</h2>
            <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Tailored for Hawaii&apos;s unique environment, terrain, and emergency response needs.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-6">
                <Shield className="h-14 w-14 text-blue-600 mb-6" />
                <CardTitle className="text-xl">Emergency Services</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground leading-relaxed">
                  Real-time incident management, resource coordination, and automated response protocols 
                  for fire departments, emergency management, and first responders.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-6">
                <Zap className="h-14 w-14 text-yellow-600 mb-6" />
                <CardTitle className="text-xl">Utility Companies</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground leading-relaxed">
                  Power line monitoring, equipment health assessment, and predictive maintenance 
                  to prevent utility-caused ignitions and ensure grid safety.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-6">
                <AlertTriangle className="h-14 w-14 text-red-600 mb-6" />
                <CardTitle className="text-xl">Community Safety</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground leading-relaxed">
                  Public alert systems, evacuation planning, and community preparedness tools 
                  to keep residents informed and safe during wildfire events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-balance text-4xl font-semibold tracking-tight lg:text-5xl mb-8">About PyroGuard Sentinel</h2>
            <div className="mt-8 space-y-8 text-lg text-muted-foreground leading-relaxed">
              <p>
                PyroGuard Sentinel was developed in response to Hawaii&apos;s increasing wildfire risks, 
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
            <div className="mt-16 p-8 border border-dashed border-primary/30 rounded-xl bg-primary/5 backdrop-blur-sm">
              <h3 className="text-2xl font-semibold mb-6 text-primary">🏆 Hackathon Access Options</h3>
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Button onClick={handleDemo} variant="outline" size="lg" className="min-w-[160px]">
                  Demo Mode (No Auth)
                </Button>
                <Button onClick={handleLogin} size="lg" disabled={isLoading} className="min-w-[160px]">
                  {isLoading ? 'Authenticating...' : 'Bypass Login (OAuth)'}
                </Button>
                <Button onClick={handleBypassAuth} variant="secondary" size="lg" className="min-w-[160px]">
                  🛠️ Hackathon Bypass
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                For the hackathon demonstration. In production, only OAuth authentication would be available.
              </p>
            </div>

            {/* Technology Stack */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary mb-1">AWS S3</div>
                <div className="text-sm text-muted-foreground">Satellite Imagery</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary mb-1">Clarifai</div>
                <div className="text-sm text-muted-foreground">AI Analysis</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary mb-1">NOAA</div>
                <div className="text-sm text-muted-foreground">Weather Data</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary mb-1">Make.com</div>
                <div className="text-sm text-muted-foreground">Automation</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-xl font-bold">PyroGuard Sentinel</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 PyroGuard Sentinel. Protecting Hawaii&apos;s communities with AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 