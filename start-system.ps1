# FWC-HRMS System Startup Script
Write-Host "🚀 Starting FWC-HRMS Complete System..." -ForegroundColor Green
Write-Host ""

# Start Backend
Write-Host "📦 Starting Backend Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\BlogReact\FWC-HRMS\apps\backend'; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "📦 Starting Frontend Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\BlogReact\FWC-HRMS\apps\frontend'; npm run dev"

Start-Sleep -Seconds 3

# Start ML Service
Write-Host "📦 Starting ML Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'E:\BlogReact\FWC-HRMS\services\ml'; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host ""
Write-Host "✅ All services starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "  ML API:   http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "📋 Login Credentials:" -ForegroundColor Cyan
Write-Host "  Admin: admin@fwcit.com / admin123" -ForegroundColor White
Write-Host "  HR:    hr@fwchrms.com / HR@2024!" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
