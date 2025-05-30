import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils";
import { 
  Satellite, 
  Brain, 
  Bell, 
  Zap, 
  CloudSun, 
  ShieldAlert,
  MapPin,
  Activity,
  Eye
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  sponsor?: string;
}

const CardDecorator = ({ children }: { children: React.ReactNode }) => (
  <div aria-hidden className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
    <div className="absolute inset-0 [--border:black] dark:[--border:white] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"/>
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">{children}</div>
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, sponsor }) => (
  <Card className="group shadow-black-950/5 border-0 shadow-lg hover:shadow-xl transition-shadow">
    <CardHeader className="pb-3">
      <CardDecorator>
        {icon}
      </CardDecorator>
      <h3 className="mt-6 font-medium text-xl">{title}</h3>
      {sponsor && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit">
          {sponsor}
        </div>
      )}
    </CardHeader>
    <CardContent>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

function PyroGuardFeatures() {
  const features: FeatureCardProps[] = [
    {
      icon: <Satellite className="size-6" aria-hidden />,
      title: "Satellite Data Pipeline",
      description: "AWS S3 Sentinel-2 imagery processed through Clarifai's NDVI models for real-time vegetation dryness analysis across Hawaiian Islands.",
      sponsor: "AWS + Clarifai"
    },
    {
      icon: <Brain className="size-6" aria-hidden />,
      title: "AI Risk Synthesis",
      description: "AWS Bedrock Claude 3 Sonnet combines multi-source data into comprehensive risk assessments with natural language rationale and confidence scoring.",
      sponsor: "AWS Bedrock"
    },
    {
      icon: <CloudSun className="size-6" aria-hidden />,
      title: "Live Weather Integration",
      description: "NOAA Weather Service API provides real-time wind patterns, humidity levels, and temperature data for Fire Weather Index calculations.",
      sponsor: "NOAA Weather Service"
    },
    {
      icon: <Zap className="size-6" aria-hidden />,
      title: "Power Infrastructure Analysis",
      description: "OpenStreetMap Overpass API maps electrical grid density within 500m radius to identify potential ignition sources and vulnerabilities.",
      sponsor: "OpenStreetMap"
    },
    {
      icon: <Eye className="size-6" aria-hidden />,
      title: "MCP Chain of Thought",
      description: "Transparent agent reasoning visualization showing real-time API calls, sponsor tool integrations, and decision-making process for judges.",
      sponsor: "MCP Standards"
    },
    {
      icon: <ShieldAlert className="size-6" aria-hidden />,
      title: "Automated Incident Response",
      description: "Make.com webhook integration creates structured Jira tickets with complete analysis context for emergency services coordination.",
      sponsor: "Make.com + Jira"
    }
  ];

  return (
    <section id="features" className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-balance text-4xl font-bold lg:text-5xl text-gray-900 mb-4">PyroGuard Sentinel</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Advanced wildfire detection and prevention system combining 6 sponsor tools for comprehensive risk management in Hawaii&apos;s unique environment.
          </p>
          <div className="mt-6 inline-flex items-center space-x-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
            <MapPin className="w-4 h-4" />
            <span>Hawaiian Islands Focus • AWS MCP Agents Hackathon 2025</span>
          </div>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              sponsor={feature.sponsor}
            />
          ))}
        </div>
        
        {/* Performance Metrics */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-orange-600 mb-2">{"< 20s"}</div>
              <div className="text-sm text-gray-600">End-to-end analysis time</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-blue-600 mb-2">6</div>
              <div className="text-sm text-gray-600">Live API integrations</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Real-time data sources</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-purple-600 mb-2">MCP</div>
              <div className="text-sm text-gray-600">Standards compliant</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PyroGuardFeatures; 