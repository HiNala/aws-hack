import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils";
import { 
  Satellite, 
  Brain, 
  Bell, 
  Zap, 
  CloudSun, 
  ShieldAlert 
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const CardDecorator = ({ children }: { children: React.ReactNode }) => (
  <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
    <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"/>
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">{children}</div>
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <Card className="group shadow-black-950/5">
    <CardHeader className="pb-3">
      <CardDecorator>
        {icon}
      </CardDecorator>
      <h3 className="mt-6 font-medium">{title}</h3>
    </CardHeader>
    <CardContent>
      <p className="text-sm">{description}</p>
    </CardContent>
  </Card>
);

function PyroGuardFeatures() {
  const features: FeatureCardProps[] = [
    {
      icon: <Satellite className="size-6" aria-hidden />,
      title: "Satellite Monitoring",
      description: "Advanced satellite imagery analysis using AWS S3 and Sentinel-2 data for early wildfire detection and continuous monitoring of high-risk areas."
    },
    {
      icon: <Brain className="size-6" aria-hidden />,
      title: "AI Risk Assessment",
      description: "Machine learning algorithms powered by Anthropic and Clarifai that predict wildfire risks based on historical data, vegetation patterns, and environmental conditions."
    },
    {
      icon: <Bell className="size-6" aria-hidden />,
      title: "Real-Time Alerts",
      description: "Immediate notification system with Make.com and Jira integration that delivers critical information to emergency services and affected communities."
    },
    {
      icon: <Zap className="size-6" aria-hidden />,
      title: "Power Infrastructure Analysis",
      description: "Specialized monitoring of electrical grids and power lines using OpenStreetMap data to identify potential ignition sources and vulnerabilities."
    },
    {
      icon: <CloudSun className="size-6" aria-hidden />,
      title: "Weather Integration",
      description: "Comprehensive NOAA weather data integration to factor wind patterns, humidity levels, and temperature forecasts into risk calculations."
    },
    {
      icon: <ShieldAlert className="size-6" aria-hidden />,
      title: "Automated Incident Response",
      description: "Pre-programmed response protocols that activate based on threat levels, coordinating resources and evacuation plans with sub-20 second analysis."
    }
  ];

  return (
    <section id="features" className="bg-muted/50 py-16 md:py-32 dark:bg-transparent">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">PyroGuard Sentinel</h2>
          <p className="mt-4 text-muted-foreground max-w-3xl mx-auto">
            Advanced wildfire detection and prevention system that combines cutting-edge technology with comprehensive risk management for Hawaii&apos;s unique environment.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PyroGuardFeatures; 