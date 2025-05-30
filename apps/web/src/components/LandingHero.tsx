"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Flame, AlertTriangle, ArrowRight } from "lucide-react";

interface HeroProps {
  className?: string;
  title: string;
  subtitle: string;
  actions?: {
    label: string;
    href: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  }[];
  titleClassName?: string;
  subtitleClassName?: string;
  actionsClassName?: string;
  onLoginClick?: () => void;
  onDemoClick?: () => void;
}

const PyroGuardHero = React.forwardRef<HTMLElement, HeroProps>(
  (
    {
      className,
      title = "AI-Powered Wildfire Risk Assessment",
      subtitle = "Detect, predict, and prevent wildfires with advanced AI technology. Protect your community with real-time monitoring and early warning systems.",
      actions = [
        {
          label: "Try Demo",
          href: "#",
          variant: "outline"
        },
        {
          label: "Login",
          href: "#",
          variant: "default"
        }
      ],
      titleClassName,
      subtitleClassName,
      actionsClassName,
      onLoginClick,
      onDemoClick,
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          "relative z-0 flex min-h-[80vh] w-full flex-col overflow-hidden bg-background",
          className,
        )}
      >
        {/* Navigation */}
        <header className="container z-50 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-red-500" />
            <span className="text-xl font-bold">PyroGuard Sentinel</span>
          </div>
          <nav className="hidden md:block">
            <ul className="flex gap-8">
              <li><Link href="#features" className="text-sm font-medium hover:text-primary">Features</Link></li>
              <li><Link href="#solutions" className="text-sm font-medium hover:text-primary">Solutions</Link></li>
              <li><Link href="#pricing" className="text-sm font-medium hover:text-primary">Pricing</Link></li>
              <li><Link href="#about" className="text-sm font-medium hover:text-primary">About</Link></li>
            </ul>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onLoginClick}>
              Login
            </Button>
            <Button size="sm" onClick={onDemoClick}>
              Try Demo
            </Button>
          </div>
        </header>

        {/* Gradient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-400 opacity-10" />
          
          {/* Main glow */}
          <div className="absolute left-1/2 top-1/3 z-10 h-56 w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/30 opacity-70 blur-[100px]" />
          
          {/* Secondary glow */}
          <div className="absolute right-1/4 top-2/3 z-10 h-32 w-[20rem] -translate-y-1/2 rounded-full bg-orange-500/20 opacity-70 blur-[80px]" />
        </div>

        <motion.div
          initial={{ y: 100, opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeInOut", duration: 0.8 }}
          className="relative z-10 container flex flex-1 flex-col items-center justify-center px-5 md:px-10 gap-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Wildfire season is here. Be prepared.</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>

          <h1
            className={cn(
              "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight",
              titleClassName,
            )}
          >
            {title}
          </h1>
          
          <p
            className={cn(
              "text-xl text-muted-foreground max-w-[800px]",
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
          
          {actions && actions.length > 0 && (
            <div className={cn("flex flex-wrap justify-center gap-4 mt-8", actionsClassName)}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  size="lg"
                  onClick={action.label === "Try Demo" ? onDemoClick : onLoginClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    );
  },
);

PyroGuardHero.displayName = "PyroGuardHero";

export default PyroGuardHero; 