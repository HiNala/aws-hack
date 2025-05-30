#!/usr/bin/env pwsh

# PyroGuard Sentinel Development Environment - Enhanced Startup Script
Write-Host "Starting PyroGuard Sentinel Development Environment..." -ForegroundColor Green
Write-Host "AI-Powered Wildfire Risk Assessment with Sponsor Integrations" -ForegroundColor Cyan
Write-Host ""

# Set required environment variables for Clarifai and other integrations
$env:HOME = $env:USERPROFILE
$env:PYTHONPATH = "."

# Kill any existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 3
    Write-Host "Existing processes cleaned up" -ForegroundColor Green
} catch {
    Write-Host "No existing processes found" -ForegroundColor Gray
}

# Check if required directories exist
if (-not (Test-Path "apps\api")) {
    Write-Host "ERROR: apps\api directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "apps\web")) {
    Write-Host "ERROR: apps\web directory not found!" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "WARNING: .env file not found - some integrations may not work" -ForegroundColor Yellow
} else {
    Write-Host "Environment configuration found" -ForegroundColor Green
}

# Start Backend API Server
Write-Host "Starting PyroGuard Sentinel API on port 8082..." -ForegroundColor Cyan
$backendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit", 
    "-Command", 
    "Set-Location '$PWD'; `$env:HOME = `$env:USERPROFILE; `$env:PYTHONPATH = '.'; Write-Host 'PyroGuard Sentinel API Server' -ForegroundColor Green; py -m uvicorn apps.api.main_simple:app --host 0.0.0.0 --port 8082 --reload"
) -PassThru

# Wait for backend to start
Write-Host "Waiting for API server to start..." -ForegroundColor Yellow
Start-Sleep 10

# Test backend health
$backendReady = $false
$maxRetries = 5
$retryCount = 0

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-RestMethod "http://localhost:8082/" -TimeoutSec 15
        if ($response.status -eq "operational") {
            Write-Host "API Server is operational! ($($response.name) $($response.mode))" -ForegroundColor Green
            Write-Host "Sponsor Integrations: $($response.sponsor_integrations.Count) configured" -ForegroundColor Cyan
            $backendReady = $true
        }
    } catch {
        $retryCount++
        Write-Host "Attempt $retryCount/$maxRetries - API server starting..." -ForegroundColor Yellow
        Start-Sleep 3
    }
}

if (-not $backendReady) {
    Write-Host "API server may not be ready yet - check the backend window" -ForegroundColor Yellow
}

# Test sponsor integrations
if ($backendReady) {
    try {
        Write-Host "Testing sponsor tool integrations..." -ForegroundColor Blue
        $healthResponse = Invoke-RestMethod "http://localhost:8082/health" -TimeoutSec 10
        
        $integrationStatus = @()
        foreach ($service in $healthResponse.services.PSObject.Properties) {
            $status = $service.Value
            $statusIcon = if ($status -eq "healthy" -or $status -eq "configured") { "[OK]" } else { "[!]" }
            $integrationStatus += "$statusIcon $($service.Name): $status"
        }
        
        Write-Host "Integration Status:" -ForegroundColor Blue
        foreach ($status in $integrationStatus) {
            Write-Host "   $status" -ForegroundColor White
        }
    } catch {
        Write-Host "Could not check integration status" -ForegroundColor Yellow
    }
}

# Create frontend environment file
Write-Host "Configuring frontend environment..." -ForegroundColor Blue
Set-Content -Path "apps\web\.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:8082"

# Start Frontend
Write-Host "Starting Next.js Frontend..." -ForegroundColor Cyan
$frontendProcess = Start-Process powershell -ArgumentList @(
    "-NoExit", 
    "-Command", 
    "Set-Location '$PWD\apps\web'; Write-Host 'PyroGuard Sentinel Frontend' -ForegroundColor Green; npm run dev"
) -PassThru

# Wait for frontend
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep 8

# Test frontend
$frontendReady = $false
try {
    $response = Invoke-WebRequest "http://localhost:3000/" -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -eq 200) {
        Write-Host "Frontend is running!" -ForegroundColor Green
        $frontendReady = $true
    }
} catch {
    Write-Host "Frontend may still be starting - check the frontend window" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Gray
Write-Host "PyroGuard Sentinel Development Environment" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Gray
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "   Backend API:     http://localhost:8082" -ForegroundColor White
Write-Host "   Health Check:    http://localhost:8082/health" -ForegroundColor White
Write-Host "   API Docs:        http://localhost:8082/docs" -ForegroundColor White
Write-Host "   System Status:   http://localhost:8082/api/v1/system-status" -ForegroundColor White
Write-Host "   Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "   Demo Mode:       http://localhost:3000?demo=1" -ForegroundColor White
Write-Host ""
Write-Host "Sponsor Integrations:" -ForegroundColor Cyan
Write-Host "   Satellite Analysis:   Clarifai + Anthropic Vision API" -ForegroundColor White
Write-Host "   Weather Data:         NOAA Weather Service" -ForegroundColor White  
Write-Host "   Power Infrastructure: OpenStreetMap Overpass API" -ForegroundColor White
Write-Host "   Incident Automation:  Make.com -> Jira" -ForegroundColor White
Write-Host "   Satellite Imagery:    AWS S3 Sentinel-2" -ForegroundColor White
Write-Host ""

if ($backendReady -and $frontendReady) {
    Write-Host "STATUS: All services are ready for wildfire analysis!" -ForegroundColor Green
    Write-Host "Click anywhere on the Hawaiian Islands to start real-time risk assessment" -ForegroundColor Yellow
    Write-Host "7-phase analysis pipeline with AI reasoning across multiple data sources" -ForegroundColor Yellow
} else {
    Write-Host "STATUS: Some services may still be starting..." -ForegroundColor Yellow
    Write-Host "Check the individual terminal windows for startup progress" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit and clean up processes..." -ForegroundColor Gray
Read-Host | Out-Null

# Cleanup
Write-Host ""
Write-Host "Shutting down services..." -ForegroundColor Yellow
try {
    if ($backendProcess -and !$backendProcess.HasExited) {
        $backendProcess.Kill()
        Write-Host "Backend process stopped" -ForegroundColor Green
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        $frontendProcess.Kill()
        Write-Host "Frontend process stopped" -ForegroundColor Green
    }
    
    # Additional cleanup
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "All services stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "Cleanup completed" -ForegroundColor Gray
} 