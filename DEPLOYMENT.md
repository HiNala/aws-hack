# 🚀 PyroGuard Sentinel - Deployment Guide

## AWS MCP Agents Hackathon 2025 🌺

This guide covers complete deployment of PyroGuard Sentinel, an AI-powered wildfire risk assessment system for the Hawaiian Islands, integrating multiple sponsor tools and services.

---

## 🎯 System Architecture

### Service Integration Overview

| Service | Purpose | Evidence |
|---------|---------|----------|
| **AWS Bedrock (Claude 3 Sonnet)** | Final risk analysis & reasoning | Bedrock console logs |
| **Clarifai** | Satellite image NDVI analysis | Clarifai app dashboard |
| **Anthropic Vision API** | Fallback vegetation analysis | Anthropic API logs |
| **NOAA Weather Service** | Real-time meteorological data | API response headers |
| **OpenStreetMap Overpass** | Power infrastructure mapping | Query response JSON |
| **Make.com → Jira** | Automated incident ticketing | Make.com execution logs |

### Technology Stack
- **Frontend**: Next.js 15, React 18, Tailwind CSS, Leaflet Maps
- **Backend**: FastAPI, Python 3.11, Server-Sent Events
- **Worker**: Inngest job processing, asyncio pipeline
- **Data Sources**: AWS S3 Sentinel-2, Real-time APIs
- **Hosting**: Vercel (Frontend) + Render (Backend/Worker)

---

## 📋 Prerequisites

### Required Accounts & API Keys

1. **AWS Account**
   - IAM user with Bedrock access
   - S3 read permissions for `sentinel-cogs` bucket
   - Region: `us-west-2` (Oregon)

2. **Clarifai Account**
   - Personal Access Token (PAT)
   - App created with satellite analysis models
   - NDVI or Land Cover models imported

3. **Anthropic Account**
   - API key for Vision API access
   - Claude 3 Vision model access

4. **Make.com Account**
   - Webhook URL for Jira integration
   - Jira Cloud Platform connection configured

5. **Jira Cloud Account**
   - Project with incident tracking
   - API access for Make.com integration

6. **Deployment Platforms**
   - Vercel account (free tier sufficient)
   - Render account (free tier for demo)

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Repository Setup

1. Fork or clone the repository
2. Ensure `apps/web` contains the Next.js application

### Step 2: Vercel Project Creation

1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project" → "Import Git Repository"
3. Select your PyroGuard repository
4. **Important**: Set Root Directory to `apps/web`
5. Framework: Next.js (auto-detected)
6. Keep default build settings

### Step 3: Environment Variables

Add these environment variables in Vercel project settings:

```bash
# API Connection
NEXT_PUBLIC_API_URL=https://pyroguard-api.onrender.com

# Optional: Analytics (if needed)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Step 4: Deploy & Verify

1. Deploy the project (should take 2-3 minutes)
2. Visit the deployment URL
3. Verify the map loads without errors
4. Check browser console for any CORS issues

**✅ Success Criteria**: Map loads, West Maui is default location, no console errors

---

## 🐳 Backend Deployment (Render)

### Step 1: Persistent Disk Creation

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to "Disks" → "New Disk"
3. **Name**: `pyroguard-cache`
4. **Size**: 1 GB (free tier)
5. **Region**: Oregon (US West) - same as AWS
6. **Mount Path**: `/opt/pyroguard/data/cache`

### Step 2: API Service Deployment

1. "New" → "Web Service"
2. Connect your GitHub repository
3. **Configuration**:
   ```
   Name: pyroguard-api
   Environment: Docker
   Branch: main
   Dockerfile Path: infra/docker/api.Dockerfile
   Region: Oregon (US West)
   Instance Type: Free (512MB RAM)
   ```

### Step 3: Worker Service Deployment

1. "New" → "Background Worker"
2. Same repository and branch
3. **Configuration**:
   ```
   Name: pyroguard-worker
   Environment: Docker
   Dockerfile Path: infra/docker/worker.Dockerfile
   Region: Oregon (US West)
   Instance Type: Free (512MB RAM)
   ```

### Step 4: Attach Persistent Disk

For both services:
1. Go to service settings
2. "Disks" tab → "Add Disk"
3. Select `pyroguard-cache`
4. Mount Path: `/opt/pyroguard/data/cache`

### Step 5: Environment Variables

Add these environment variables to **both services**:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2

# AI/ML APIs
CLARIFAI_PAT=your_clarifai_pat_token
CLARIFAI_APP_ID=your_app_id
CLARIFAI_USER_ID=your_username
ANTHROPIC_API_KEY=sk-ant-...

# Job Processing
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Automation
MAKE_WEBHOOK_URL=https://hook.integromat.com/...
JIRA_PROJECT_KEY=PYRO
JIRA_BASE_URL=https://your-org.atlassian.net

# Weather API
NOAA_USER_AGENT=PyroGuard Sentinel (contact: your-email@domain.com)

# Optional: Debugging
LOG_LEVEL=INFO
```

### Step 6: Health Check Configuration

**API Service Only**:
1. Settings → "Health Check"
2. **Health Check Path**: `/health`
3. **Expected Status**: 200

---

## 🔧 Service Configuration Details

### Make.com Webhook Setup

1. Create new scenario in Make.com
2. Add "Webhooks" → "Custom webhook" trigger
3. Add "Jira" → "Create Issue" action
4. **Field Mapping**:
   ```json
   {
     "project": "{{webhook.jira.project_key}}",
     "summary": "{{webhook.jira.summary}}",
     "description": "{{webhook.jira.description}}",
     "priority": "{{webhook.jira.priority}}",
     "issuetype": "{{webhook.jira.issue_type}}"
   }
   ```
5. Copy webhook URL to `MAKE_WEBHOOK_URL`

### Clarifai Model Setup

1. Go to Clarifai Console → Your App
2. **Import Pre-built Models**:
   - Search for "Crop Health NDVI"
   - Or "Land Cover Classification"
   - Click "Add to App"
3. **Get App Details**:
   - App ID from URL or settings
   - User ID from profile

### CORS Configuration

Ensure your FastAPI allows Vercel domains:

```python
# In apps/api/main.py
origins = [
    "https://*.vercel.app",
    "https://pyroguard-sentinel.vercel.app",
    "http://localhost:3000"  # Development
]
```

---

## ⚡ Quick Start Commands

### Local Development

```bash
# Install dependencies
cd apps/web && npm install
cd ../api && pip install -r requirements.txt

# Start services (PowerShell)
cd apps/api; python main.py  # Terminal 1
cd apps/web; npm run dev     # Terminal 2

# Or use start script
./scripts/start-dev.ps1  # Windows
./scripts/start-dev.sh   # Linux/Mac
```

### Docker Development

```bash
# Build and run locally
docker build -f infra/docker/api.Dockerfile -t pyroguard-api .
docker build -f infra/docker/worker.Dockerfile -t pyroguard-worker .

docker run -p 8082:8082 --env-file .env pyroguard-api
docker run --env-file .env pyroguard-worker
```

---

## 🧪 Testing & Validation

### Deployment Verification Checklist

**Frontend (Vercel)**
- [ ] Map loads and centers on West Maui (20.8783°N, 156.6825°W)
- [ ] Demo locations panel visible on left
- [ ] "Made with Aloha 🌺" badge in header
- [ ] No console errors in browser dev tools

**Backend (Render)**
- [ ] API health check returns 200: `curl https://your-api.onrender.com/health`
- [ ] CORS allows Vercel domain (test from frontend)
- [ ] Worker service shows "Running" status
- [ ] Persistent disk mounted and accessible

**End-to-End Demo**
- [ ] Click "Analyze West Maui" button
- [ ] Real-time progress updates appear
- [ ] Chain of Thought reasoning visible
- [ ] Analysis completes in <20 seconds
- [ ] Results panel shows satellite, weather, power data
- [ ] Jira ticket created (if risk > 30%)

### Troubleshooting Common Issues

**Map doesn't load**
- Check CORS configuration
- Verify `NEXT_PUBLIC_API_URL` points to correct Render service
- Ensure Leaflet CSS imported properly

**Analysis fails**
- Check all environment variables set correctly
- Verify AWS credentials have Bedrock access
- Test individual API connections in health endpoint

**Worker not processing**
- Check Inngest event key and signing key
- Verify worker service is running (not just API)
- Check logs for error messages

---

## 📊 Performance Optimization

### Timing Targets
- **Demo Mode**: <5 seconds total processing
- **Live Mode**: <20 seconds total processing
- **Map Load**: <2 seconds on cold start

### Caching Strategy
- Satellite tiles cached on persistent disk
- Weather data cached 15 minutes
- Power line data cached indefinitely
- Demo mode uses all cached data

### Resource Limits
- Free tier: 512MB RAM, 0.1 CPU
- Upgrade to Starter ($7/month) for better performance
- Each phase designed to complete under resource constraints

---

## 🔒 Security Considerations

### Production Hardening
- All API keys stored as environment variables (never in code)
- CORS restricted to known domains
- Rate limiting on sensitive endpoints
- Webhook signature validation for Make.com

### Data Privacy
- No user data stored permanently
- Analysis results cleared after 24 hours
- Geographic coordinates logged for debugging only

---

## 📈 Monitoring & Observability

### Service Health
- **API**: `/health` endpoint with dependency checks
- **Worker**: Inngest dashboard for job monitoring
- **Frontend**: Vercel analytics for performance

### Error Tracking
- Server logs via Render console
- Client errors via browser console
- Failed job retry logic in Inngest

### Demo Day Preparation
- Pre-warm cache with demo locations
- Test all sponsor tool integrations
- Verify evidence artifacts accessible
- Practice 90-second pitch timing

---

## 🎯 Judge Demonstration Checklist

### Evidence Artifacts (5 tabs ready)
1. **AWS Bedrock Console**: Request logs with timestamps
2. **Clarifai Dashboard**: App activity showing inference calls
3. **Operant AI Timeline**: Real-time MCP reasoning chain
4. **Inngest Dashboard**: Function execution graph
5. **Make.com Logs**: Webhook execution → Jira ticket

### Demo Script (90 seconds)
1. **Data Integration** (20s): "Multiple live APIs feeding real-time analysis"
2. **Live Processing** (30s): Click West Maui, show real-time logs
3. **Evidence** (25s): Flash through 5 sponsor dashboards
4. **Value Prop** (15s): "20-second end-to-end analysis with automated response"

### Backup Plan
- Demo mode for reliable timing
- Screenshot evidence if live APIs slow
- Mobile hotspot if venue WiFi unreliable

---

## 🛠️ Advanced Configuration

### Custom Domain (Optional)
1. Add custom domain in Vercel
2. Update CORS settings in FastAPI
3. Update `NEXT_PUBLIC_API_URL` if needed

### Scaling (Production)
- Upgrade Render instance types
- Add Redis for advanced caching
- Implement database for analysis history
- Add monitoring with Datadog/NewRelic

### Multi-Region (Future)
- Deploy workers in multiple AWS regions
- Use CloudFront for global frontend
- Implement regional API routing

---

**🌺 Made with Aloha for AWS MCP Agents Hackathon 2025**

*PyroGuard Sentinel - Protecting Hawaii's communities with AI-powered wildfire risk assessment* 