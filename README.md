# 🚀 PyroGuard Sentinel

AI-powered wildfire risk assessment system delivering comprehensive analysis in under 20 seconds.

## Features

- **Real-time Risk Assessment**: Click any location on the map to get immediate wildfire risk analysis
- **Multi-source Data Integration**: Combines satellite imagery, weather data, and power infrastructure analysis
- **AI-powered Analysis**: Uses AWS Bedrock (Claude Sonnet) and Clarifai satellite vision models
- **Automated Incident Response**: Creates Jira tickets automatically for high-risk areas
- **Live Progress Tracking**: Real-time pipeline monitoring via Operant AI

## Architecture

- **Frontend**: Next.js 15 with interactive mapping
- **Backend**: FastAPI orchestration layer  
- **Worker**: Inngest-powered 7-phase analysis pipeline
- **AI Models**: AWS Bedrock + Clarifai satellite analysis
- **Data Sources**: NOAA weather, AWS Sentinel-2 imagery, OpenStreetMap power lines

## Quick Start

1. Copy environment variables:
   ```powershell
   Copy-Item .env.example .env
   # Fill in your API keys in .env
   ```

2. Start development services:
   ```powershell
   .\scripts\start-dev.ps1
   ```

3. Open http://localhost:3000 and click anywhere on the Hawaiian Islands to analyze wildfire risk.

## Demo Mode

Add `?demo=1` to the URL for faster cached responses during demonstrations.

## Service Integration

| Service | Purpose | Evidence |
|---------|---------|----------|
| AWS Bedrock | Final risk verdict | Bedrock console logs |
| Clarifai | Satellite NDVI analysis | App activity dashboard |
| Operant AI | Timeline tracking | Live timeline view |
| Inngest | Job orchestration | Function execution graph |
| Make.com → Jira | Ticket automation | Webhook logs + Jira issues |

## Geographic Scope

Currently optimized for Hawaiian Islands (20.5°-21.5°N, -157.5°--155.9°W).

---

**Built for AWS Hackathon 2025** - End-to-end wildfire risk assessment in under 20 seconds. 