# SafeLabel AI — Azure Deployment Runner (PowerShell)
param (
    [string]$ServerIp = ""
)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "      SafeLabel AI — Azure Deployment Runner      " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if (-not $ServerIp) {
    try {
        $detected = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 3).Trim()
    } catch {
        $detected = "localhost"
    }
    Write-Host "`nDetected Public IP: $detected" -ForegroundColor Yellow
    $inputIp = Read-Host "Enter Azure Public IP or Domain [Press Enter to use $detected]"
    if ($inputIp) { $ServerIp = $inputIp } else { $ServerIp = $detected }
}

Write-Host "`nConfiguring SafeLabel AI with Server IP: $ServerIp" -ForegroundColor Green

# 1. Root .env
@"
AZURE_SERVER_IP=$ServerIp
API_PORT=8000
ADMIN_PORT=3000
MOBILE_PORT=8081
POSTGRES_DB=safelabel
POSTGRES_USER=safelabel
POSTGRES_PASSWORD=safelabel
POSTGRES_PORT=5432
JWT_SECRET=change-me-to-a-secure-random-32-character-secret-key
"@ | Out-File -Encoding utf8 -FilePath ".env"

# 2. Admin Panel .env.local
@"
NEXT_PUBLIC_API_URL=http://${ServerIp}:8000
NEXT_PUBLIC_SERVER_IP=${ServerIp}
NEXT_PUBLIC_SERVER_PORT=8000
"@ | Out-File -Encoding utf8 -FilePath "app/admin-panel/.env.local"

# 3. Mobile .env
@"
EXPO_PUBLIC_API_URL=http://${ServerIp}:8000
EXPO_PUBLIC_SERVER_IP=${ServerIp}
EXPO_PUBLIC_SERVER_PORT=8000
"@ | Out-File -Encoding utf8 -FilePath "app/mobile/.env"

Write-Host "`nStarting Docker containers..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "          SafeLabel AI is now running!            " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  • FastAPI API:          http://${ServerIp}:8000"
Write-Host "  • API Docs (Swagger):   http://${ServerIp}:8000/docs"
Write-Host "  • Admin Panel:          http://${ServerIp}:3000"
Write-Host "  • Mobile Metro Server:  http://${ServerIp}:8081"
Write-Host "==================================================" -ForegroundColor Green
