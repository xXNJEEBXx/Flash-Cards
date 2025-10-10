# اختبار API على Railway
Write-Host "🧪 Testing Railway API..." -ForegroundColor Cyan

$API_URL = "https://flash-cards-production-e52d.up.railway.app"

Write-Host "`n1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health Check Response:" -ForegroundColor Green
    Write-Host $response.Content
    Write-Host "Status Code:" $response.StatusCode
} catch {
    Write-Host "❌ Health Check Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n2️⃣ Testing Decks Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/decks" -Method GET -TimeoutSec 10
    Write-Host "✅ Decks Response:" -ForegroundColor Green
    Write-Host $response.Content
    Write-Host "Status Code:" $response.StatusCode
} catch {
    Write-Host "❌ Decks Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n3️⃣ Testing Root URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -TimeoutSec 10
    Write-Host "✅ Root Response:" -ForegroundColor Green
    Write-Host "Status Code:" $response.StatusCode
} catch {
    Write-Host "❌ Root Failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n✅ Test Complete!" -ForegroundColor Green
