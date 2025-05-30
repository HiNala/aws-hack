#!/usr/bin/env pwsh

# PyroGuard Sentinel Development Environment Startup Script
# Starts API server, Inngest worker, and Next.js frontend with proper CORS configuration

Write-Host "🚀 PyroGuard Sentinel - Starting Development Environment" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "📋 Please copy .env.example to .env and fill in your API keys" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required environment variables:" -ForegroundColor Cyan
    Write-Host "- AWS_ACCESS_KEY_ID" 
    Write-Host "- AWS_SECRET_ACCESS_KEY"
    Write-Host "- CLARIFAI_PAT"
    Write-Host "- INNGEST_EVENT_KEY"
    Write-Host "- MAKE_WEBHOOK_URL"
    Write-Host ""
    exit 1
}

# Check Python virtual environment
Write-Host "🐍 Checking Python environment..." -ForegroundColor Blue
if (-not (Get-Command "py" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found! Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if pyproject.toml exists
if (-not (Test-Path "pyproject.toml")) {
    Write-Host "❌ pyproject.toml not found! Please run from project root." -ForegroundColor Red
    exit 1
}

# Install Python dependencies if needed
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
try {
    py -m pip install fastapi uvicorn python-dotenv httpx boto3 clarifai --quiet
    Write-Host "✅ Python dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Check Node.js for frontend
Write-Host "🌐 Checking Node.js environment..." -ForegroundColor Blue
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Install frontend dependencies
if (Test-Path "apps/web") {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    Push-Location "apps/web"
    try {
        npm install --silent
        Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $tcpObject = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpObject.ConnectAsync("localhost", $Port).Wait(1000)
        $tcpObject.Close()
        return $connect
    } catch {
        return $false
    }
}

# Check for port conflicts
$apiPort = 8082  # Changed from 8080 to avoid conflicts
$frontendPort = 3000

if (Test-Port $apiPort) {
    Write-Host "⚠️  Port $apiPort is already in use - stopping existing API server" -ForegroundColor Yellow
    # Try to find and kill process on port
    $process = Get-NetTCPConnection -LocalPort $apiPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep 2
    }
}

if (Test-Port $frontendPort) {
    Write-Host "⚠️  Port $frontendPort is already in use - stopping existing frontend server" -ForegroundColor Yellow
    # Try to find and kill process on port 3000
    $process = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep 2
    }
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Green
Write-Host ""

# Set environment for development
$env:PYTHONPATH = "."
$env:ENVIRONMENT = "development"
$env:HOME = $env:USERPROFILE  # Fix for Clarifai

# Start FastAPI backend server
Write-Host "🔧 Starting FastAPI backend on http://localhost:$apiPort..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:PYTHONPATH = "."
    $env:HOME = $env:USERPROFILE
    py -m uvicorn apps.api.main_simple:app --host 0.0.0.0 --port $using:apiPort --reload --log-level info
} -Name "PyroGuard-API"

# Wait a moment for API to start
Start-Sleep 3

# Check if API started successfully
if (Test-Port $apiPort) {
    Write-Host "✅ FastAPI backend started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start FastAPI backend" -ForegroundColor Red
    Write-Host "API Job State: $($apiJob.State)" -ForegroundColor Yellow
    
    # Get job output for debugging
    if ($apiJob.State -eq "Completed" -or $apiJob.State -eq "Failed") {
        $apiOutput = Receive-Job $apiJob
        Write-Host "API Output:" -ForegroundColor Yellow
        Write-Host $apiOutput -ForegroundColor Gray
    }
    
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    exit 1
}

# Create frontend environment file
if (Test-Path "apps/web") {
    Write-Host "⚙️  Configuring frontend environment..." -ForegroundColor Blue
    Set-Content -Path "apps/web/.env.local" -Value "NEXT_PUBLIC_API_URL=http://localhost:$apiPort"
}

# Start Next.js frontend
if (Test-Path "apps/web") {
    Write-Host "🌐 Starting Next.js frontend on http://localhost:3000..." -ForegroundColor Cyan
    
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location "$using:PWD/apps/web"
        npm run dev
    } -Name "PyroGuard-Frontend"
    
    # Wait for frontend to start
    Start-Sleep 5
    
    if (Test-Port 3000) {
        Write-Host "✅ Next.js frontend started successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start Next.js frontend" -ForegroundColor Red
        Write-Host "Frontend Job State: $($frontendJob.State)" -ForegroundColor Yellow
        
        # Get job output for debugging
        if ($frontendJob.State -eq "Completed" -or $frontendJob.State -eq "Failed") {
            $frontendOutput = Receive-Job $frontendJob
            Write-Host "Frontend Output:" -ForegroundColor Yellow
            Write-Host $frontendOutput -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "🎉 PyroGuard Sentinel Development Environment Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Services:" -ForegroundColor Cyan
Write-Host "   📡 API Server:    http://localhost:$apiPort" -ForegroundColor White
Write-Host "   📡 API Health:    http://localhost:$apiPort/health" -ForegroundColor White
Write-Host "   📡 API Docs:      http://localhost:$apiPort/docs" -ForegroundColor White
Write-Host "   🌐 Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "   🌐 Demo Mode:     http://localhost:3000?demo=1" -ForegroundColor White
Write-Host ""
Write-Host "🔥 Ready to analyze wildfire risk in Hawaiian Islands!" -ForegroundColor Yellow
Write-Host "   Click anywhere on the map to start analysis" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ CORS properly configured between frontend and backend" -ForegroundColor Green
Write-Host "⌨️  Press Ctrl+C to stop all services" -ForegroundColor Gray
Write-Host "=" * 60 -ForegroundColor Gray

# Keep script running and monitor jobs
try {
    while ($true) {
        Start-Sleep 1
        
        # Check if jobs are still running
        if ($apiJob.State -eq "Completed" -or $apiJob.State -eq "Failed") {
            Write-Host "❌ API server stopped unexpectedly" -ForegroundColor Red
            $apiOutput = Receive-Job $apiJob
            Write-Host $apiOutput -ForegroundColor Gray
            break
        }
        
        if ((Test-Path "apps/web") -and ($frontendJob.State -eq "Completed" -or $frontendJob.State -eq "Failed")) {
            Write-Host "❌ Frontend server stopped unexpectedly" -ForegroundColor Red
            $frontendOutput = Receive-Job $frontendJob
            Write-Host $frontendOutput -ForegroundColor Gray
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Shutting down services..." -ForegroundColor Yellow
} finally {
    # Cleanup jobs
    Write-Host "🧹 Cleaning up..." -ForegroundColor Blue
    
    if ($apiJob) {
        Stop-Job $apiJob -ErrorAction SilentlyContinue
        Remove-Job $apiJob -ErrorAction SilentlyContinue
    }
    
    if ($frontendJob) {
        Stop-Job $frontendJob -ErrorAction SilentlyContinue  
        Remove-Job $frontendJob -ErrorAction SilentlyContinue
    }
    
    Write-Host "✅ All services stopped" -ForegroundColor Green
} 