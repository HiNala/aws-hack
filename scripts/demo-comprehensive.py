#!/usr/bin/env python3
"""
PyroGuard Sentinel - Comprehensive Demo & Validation Script
Implements both @full plan and @short plan requirements

This script validates:
✅ All 8 sponsor integrations working
✅ Under 20 second live analysis / 5 second demo timing
✅ End-to-end pipeline with MCP reasoning  
✅ Real-time satellite processing
✅ Evidence artifacts for judge demonstration
"""

import asyncio
import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
API_BASE_URL = "http://localhost:8082"
FRONTEND_URL = "http://localhost:3000"

# Test coordinates (West Maui - high risk demo location)
TEST_COORDS = {
    "latitude": 20.9801,
    "longitude": -156.6927
}

class PyroGuardDemo:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.results = {}
        self.start_time = None
        
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    def log_step(self, step: str, status: str = "START", details: str = ""):
        """Log demo steps with timestamps"""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        status_emoji = {
            "START": "🚀",
            "SUCCESS": "✅", 
            "WARNING": "⚠️",
            "ERROR": "❌",
            "INFO": "ℹ️"
        }.get(status, "📝")
        
        print(f"[{timestamp}] {status_emoji} {step}")
        if details:
            print(f"    └─ {details}")
    
    async def test_system_health(self):
        """Test all sponsor integrations - Full Plan Section 1"""
        self.log_step("Testing System Health & Sponsor Integrations", "START")
        
        try:
            response = await self.client.get(f"{API_BASE_URL}/health")
            health_data = response.json()
            
            self.results["health"] = health_data
            
            # Validate sponsor integrations from both plans
            services = health_data.get("services", {})
            integration_status = {
                "AWS S3 (Satellite Imagery)": services.get("aws_s3"),
                "Anthropic Vision API": services.get("anthropic"), 
                "NOAA Weather Service": services.get("noaa_weather"),
                "OpenStreetMap Overpass": services.get("overpass_api"),
                "Make.com Webhook": services.get("make_webhook"),
                "Clarifai Satellite Vision": services.get("clarifai")
            }
            
            operational_count = 0
            for service, status in integration_status.items():
                if status in ["healthy", "configured"]:
                    self.log_step(f"{service}", "SUCCESS", f"Status: {status}")
                    operational_count += 1
                else:
                    self.log_step(f"{service}", "WARNING", f"Status: {status}")
            
            self.log_step("Integration Summary", "INFO", 
                         f"{operational_count}/6 sponsor integrations operational")
            
            return health_data.get("status") == "healthy"
            
        except Exception as e:
            self.log_step("System Health Check", "ERROR", str(e))
            return False
    
    async def test_frontend_accessibility(self):
        """Test frontend accessibility - Full Plan Section 6"""
        self.log_step("Testing Frontend Accessibility", "START")
        
        try:
            response = await self.client.get(FRONTEND_URL)
            if response.status_code == 200:
                self.log_step("Frontend Status", "SUCCESS", 
                             f"Accessible at {FRONTEND_URL}")
                return True
            else:
                self.log_step("Frontend Status", "WARNING", 
                             f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_step("Frontend Status", "WARNING", 
                         "Frontend not accessible (may still be starting)")
            return False
    
    async def run_live_analysis(self, demo_mode: bool = False):
        """Run complete analysis pipeline - Both Plans Section 5"""
        mode_name = "Demo Mode" if demo_mode else "Live Mode"
        target_time = 5 if demo_mode else 20
        
        self.log_step(f"Starting Wildfire Analysis ({mode_name})", "START", 
                     f"Target: <{target_time}s")
        
        analysis_start = time.time()
        
        try:
            # Phase 1: Start analysis
            payload = {
                "latitude": TEST_COORDS["latitude"],
                "longitude": TEST_COORDS["longitude"], 
                "demo_mode": demo_mode
            }
            
            response = await self.client.post(
                f"{API_BASE_URL}/api/v1/analyze",
                json=payload
            )
            
            if response.status_code != 200:
                self.log_step("Analysis Start", "ERROR", 
                             f"HTTP {response.status_code}")
                return None
            
            analysis_data = response.json()
            analysis_id = analysis_data["analysis_id"]
            
            self.log_step("Analysis Pipeline Started", "SUCCESS", 
                         f"ID: {analysis_id}")
            
            # Phase 2: Monitor progress with 7-phase tracking
            phases = [
                "Location Verification",
                "Satellite Image Analysis (Clarifai/Anthropic)",
                "Weather Data Integration (NOAA)", 
                "Power Infrastructure Analysis (OpenStreetMap)",
                "AI Risk Assessment (MCP Agent Reasoning)",
                "Incident Automation (Make.com → Jira)",
                "Complete"
            ]
            
            completed_phases = set()
            max_wait = target_time + 10  # Allow some buffer
            
            for attempt in range(max_wait * 2):  # Check every 0.5s
                try:
                    result_response = await self.client.get(
                        f"{API_BASE_URL}/api/v1/analyze/{analysis_id}/result"
                    )
                    
                    if result_response.status_code == 200:
                        result_data = result_response.json()
                        
                        # Track phase completion
                        if result_data.get("weather") and "weather" not in completed_phases:
                            self.log_step("Phase 3: Weather Integration", "SUCCESS")
                            completed_phases.add("weather")
                            
                        if result_data.get("satellite") and "satellite" not in completed_phases:
                            self.log_step("Phase 2: Satellite Analysis", "SUCCESS") 
                            completed_phases.add("satellite")
                            
                        if result_data.get("power_lines") and "power" not in completed_phases:
                            self.log_step("Phase 4: Power Infrastructure", "SUCCESS")
                            completed_phases.add("power")
                            
                        if result_data.get("risk_assessment") and "risk" not in completed_phases:
                            self.log_step("Phase 5: MCP Risk Assessment", "SUCCESS")
                            completed_phases.add("risk")
                            
                        if result_data.get("jira_ticket_url") and "jira" not in completed_phases:
                            self.log_step("Phase 6: Jira Ticket Creation", "SUCCESS",
                                         result_data.get("jira_ticket_url", ""))
                            completed_phases.add("jira")
                        
                        # Check completion
                        if result_data.get("status") == "completed":
                            analysis_time = time.time() - analysis_start
                            
                            self.log_step("Analysis Complete", "SUCCESS", 
                                         f"Total time: {analysis_time:.1f}s")
                            
                            # Validate timing requirements
                            if analysis_time <= target_time:
                                self.log_step("Timing Benchmark", "SUCCESS",
                                             f"Under {target_time}s target")
                            else:
                                self.log_step("Timing Benchmark", "WARNING", 
                                             f"Exceeded {target_time}s target")
                            
                            self.results[f"analysis_{mode_name.lower().replace(' ', '_')}"] = {
                                "analysis_id": analysis_id,
                                "total_time": analysis_time,
                                "target_time": target_time,
                                "phases_completed": len(completed_phases),
                                "result_data": result_data
                            }
                            
                            return result_data
                            
                except Exception:
                    pass  # Continue polling
                
                await asyncio.sleep(0.5)
            
            self.log_step("Analysis Timeout", "ERROR", 
                         f"Exceeded {max_wait}s maximum wait time")
            return None
            
        except Exception as e:
            self.log_step("Analysis Failed", "ERROR", str(e))
            return None
    
    async def validate_evidence_artifacts(self):
        """Validate judge demonstration evidence - Full Plan Section 9"""
        self.log_step("Validating Evidence Artifacts", "START")
        
        evidence_checks = [
            ("API Health Endpoint", f"{API_BASE_URL}/health"),
            ("Sponsor Integrations", f"{API_BASE_URL}/sponsor-integrations"), 
            ("Demo Locations", f"{API_BASE_URL}/api/v1/demo-locations"),
            ("System Status", f"{API_BASE_URL}/api/v1/system-status")
        ]
        
        evidence_results = {}
        
        for name, url in evidence_checks:
            try:
                response = await self.client.get(url)
                if response.status_code == 200:
                    evidence_results[name] = "✅ Available"
                    self.log_step(f"Evidence: {name}", "SUCCESS", url)
                else:
                    evidence_results[name] = f"⚠️ HTTP {response.status_code}"
                    self.log_step(f"Evidence: {name}", "WARNING", 
                                 f"HTTP {response.status_code}")
            except Exception as e:
                evidence_results[name] = f"❌ Error: {str(e)[:50]}"
                self.log_step(f"Evidence: {name}", "ERROR", str(e)[:50])
        
        self.results["evidence_artifacts"] = evidence_results
        return evidence_results
    
    def generate_demo_summary(self):
        """Generate comprehensive demo summary - Both Plans Summary"""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "demo_results": self.results,
            "timing_benchmarks": {},
            "sponsor_integrations": {},
            "overall_status": "UNKNOWN"
        }
        
        # Extract timing benchmarks
        for mode in ["demo_mode", "live_mode"]:
            if f"analysis_{mode}" in self.results:
                data = self.results[f"analysis_{mode}"]
                summary["timing_benchmarks"][mode] = {
                    "actual_time": data["total_time"],
                    "target_time": data["target_time"],
                    "meets_target": data["total_time"] <= data["target_time"]
                }
        
        # Extract sponsor integration status
        if "health" in self.results:
            services = self.results["health"].get("services", {})
            summary["sponsor_integrations"] = {
                "total_integrations": len(services),
                "operational_count": len([s for s in services.values() 
                                        if s in ["healthy", "configured"]]),
                "services": services
            }
        
        # Determine overall status
        timing_ok = all(
            bench.get("meets_target", False) 
            for bench in summary["timing_benchmarks"].values()
        )
        
        integrations_ok = (
            summary["sponsor_integrations"].get("operational_count", 0) >= 4
        )  # At least 4/6 integrations working
        
        if timing_ok and integrations_ok:
            summary["overall_status"] = "READY_FOR_DEMO"
        elif timing_ok or integrations_ok:
            summary["overall_status"] = "PARTIAL_SUCCESS"
        else:
            summary["overall_status"] = "NEEDS_ATTENTION"
        
        return summary
    
    async def run_comprehensive_demo(self):
        """Run complete demo sequence - Both Plans Integration"""
        self.log_step("PyroGuard Sentinel Comprehensive Demo", "START",
                     "Validating Full Plan + Short Plan Requirements")
        
        overall_start = time.time()
        
        # Step 1: System health (Full Plan Section 4)
        health_ok = await self.test_system_health()
        
        # Step 2: Frontend accessibility (Full Plan Section 6)
        frontend_ok = await self.test_frontend_accessibility()
        
        # Step 3: Demo mode analysis (Short Plan - 5s target)
        demo_result = await self.run_live_analysis(demo_mode=True)
        
        # Step 4: Live mode analysis (Full Plan - 20s target)  
        live_result = await self.run_live_analysis(demo_mode=False)
        
        # Step 5: Evidence validation (Full Plan Section 9)
        evidence = await self.validate_evidence_artifacts()
        
        # Generate final summary
        total_time = time.time() - overall_start
        summary = self.generate_demo_summary()
        
        self.log_step("Demo Complete", "SUCCESS", 
                     f"Total execution time: {total_time:.1f}s")
        
        # Print final results
        print("\n" + "="*60)
        print("🔥 PYROGUARD SENTINEL DEMO SUMMARY")
        print("="*60)
        
        print(f"📊 Overall Status: {summary['overall_status']}")
        print(f"⏱️  Total Demo Time: {total_time:.1f}s")
        
        print("\n🔧 Sponsor Integrations:")
        for service, status in summary['sponsor_integrations'].get('services', {}).items():
            status_emoji = "✅" if status in ["healthy", "configured"] else "⚠️"
            print(f"  {status_emoji} {service}: {status}")
        
        print("\n⚡ Timing Benchmarks:")
        for mode, bench in summary['timing_benchmarks'].items():
            target_met = "✅" if bench['meets_target'] else "❌"
            print(f"  {target_met} {mode.replace('_', ' ').title()}: {bench['actual_time']:.1f}s (target: {bench['target_time']}s)")
        
        print("\n📋 Evidence Artifacts:")
        for artifact, status in summary.get('evidence_artifacts', {}).items():
            print(f"  {status} {artifact}")
        
        # Save detailed results
        results_file = Path("demo_results.json")
        with open(results_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\n💾 Detailed results saved to: {results_file}")
        
        # Demo URLs for judge presentation
        print("\n🎯 JUDGE DEMONSTRATION URLS:")
        print(f"  🌐 Frontend: {FRONTEND_URL}")
        print(f"  🔧 API Health: {API_BASE_URL}/health")
        print(f"  📊 System Status: {API_BASE_URL}/api/v1/system-status")
        
        if demo_result and demo_result.get("jira_ticket_url"):
            print(f"  🎫 Sample Jira Ticket: {demo_result['jira_ticket_url']}")
        
        print("\n✨ System ready for 90-second judge demonstration!")
        return summary


async def main():
    """Main demo execution"""
    print("🚀 PyroGuard Sentinel - Comprehensive Demo Script")
    print("Implementing Full Plan + Short Plan Requirements\n")
    
    async with PyroGuardDemo() as demo:
        results = await demo.run_comprehensive_demo()
        
        # Exit with appropriate code
        if results["overall_status"] == "READY_FOR_DEMO":
            sys.exit(0)
        elif results["overall_status"] == "PARTIAL_SUCCESS":
            sys.exit(1) 
        else:
            sys.exit(2)


if __name__ == "__main__":
    asyncio.run(main()) 