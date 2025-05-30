# PyroGuard Sentinel Development Startup Script
Write-Host "🚀 Starting PyroGuard Sentinel Development Environment" -ForegroundColor Green

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please copy .env.example to .env and fill in your API keys." -ForegroundColor Red
    exit 1
}

# Kill any existing processes on our ports
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*" -or $_.ProcessName -like "*python*" -or $_.ProcessName -like "*node*"} | Where-Object {$_.MainWindowTitle -like "*8080*" -or $_.MainWindowTitle -like "*3000*" -or $_.MainWindowTitle -like "*9090*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Create data directories if they don't exist
Write-Host "📁 Creating cache directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "data\cache\tiles" -Force | Out-Null
New-Item -ItemType Directory -Path "data\cache\overpass" -Force | Out-Null

# Start FastAPI backend
Write-Host "🌐 Starting FastAPI backend on port 8080..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; python -m uvicorn apps.api.main:app --reload --host 0.0.0.0 --port 8080" -WindowStyle Normal

# Start Inngest worker
Write-Host "⚡ Starting Inngest worker on port 9090..." -ForegroundColor Magenta  
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; python -m inngest.cli dev --port 9090" -WindowStyle Normal

# Start Next.js frontend (need to install deps first)
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location "apps\web"
if (-Not (Test-Path "node_modules")) {
    npm install
}

Write-Host "🎨 Starting Next.js frontend on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev" -WindowStyle Normal

# Return to root directory
Set-Location "..\..\"

# Wait a moment for services to start
Start-Sleep -Seconds 3

# Check health endpoints
Write-Host "`n🏥 Checking service health..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 5
    Write-Host "✅ API Backend: $($apiHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ API Backend: Not responding" -ForegroundColor Red
}

Write-Host "`n🎯 Development servers started successfully!" -ForegroundColor Green
Write-Host "📊 API Backend: http://localhost:8080" -ForegroundColor White
Write-Host "⚡ Inngest Dev: http://localhost:9090" -ForegroundColor White  
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "`n💡 Add ?demo=1 to the frontend URL for fast demo mode" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow 