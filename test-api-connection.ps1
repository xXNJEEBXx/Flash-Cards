# PowerShell Script to test API connection
# Save as test-api-connection.ps1

Write-Host "🔍 Testing API Connection to Flash Cards Backend" -ForegroundColor Cyan

# 1. Test Health Endpoint
Write-Host "`n[Testing Health Endpoint]" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Headers @{"Accept"="application/json"}
    $healthData = $healthResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Health endpoint responded with status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Database status: $($healthData.database.status)" -ForegroundColor Green
    Write-Host "Database tables: $($healthData.database.tables -join ', ')" -ForegroundColor Green
    Write-Host "Decks count: $($healthData.database.counts.decks)" -ForegroundColor Green
    Write-Host "Cards count: $($healthData.database.counts.cards)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health endpoint error: $_" -ForegroundColor Red
}

# 2. Test Decks Endpoint
Write-Host "`n[Testing Decks Endpoint]" -ForegroundColor Yellow
try {
    $decksResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks" -Headers @{"Accept"="application/json"}
    $decksData = $decksResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Decks endpoint responded with status: $($decksResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Number of decks: $($decksData.Length)" -ForegroundColor Green
    
    if ($decksData.Length -gt 0) {
        Write-Host "`nFirst deck details:" -ForegroundColor Cyan
        Write-Host "  ID: $($decksData[0].id)" -ForegroundColor Cyan
        Write-Host "  Title: $($decksData[0].title)" -ForegroundColor Cyan
        Write-Host "  Description: $($decksData[0].description)" -ForegroundColor Cyan
        Write-Host "  Cards: $($decksData[0].cards.Length)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Decks endpoint error: $_" -ForegroundColor Red
    
    try {
        # Try to get more details about the error
        $errorResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks" -Headers @{"Accept"="application/json"} -ErrorAction SilentlyContinue
    } catch {
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            
            Write-Host "Error Response Body:" -ForegroundColor Red
            Write-Host $responseBody -ForegroundColor Red
        }
    }
}

# 3. Test Database Connection Directly
Write-Host "`n[Testing Database Connection]" -ForegroundColor Yellow

# Get database details from .env file
try {
    $envPath = "c:\xXNJEEBXx\Projects\flash Cards\backend\.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath
        
        $dbConnection = ($envContent | Where-Object { $_ -match "DB_CONNECTION=" }) -replace "DB_CONNECTION=", ""
        $dbHost = ($envContent | Where-Object { $_ -match "DB_HOST=" }) -replace "DB_HOST=", ""
        $dbPort = ($envContent | Where-Object { $_ -match "DB_PORT=" }) -replace "DB_PORT=", ""
        $dbName = ($envContent | Where-Object { $_ -match "DB_DATABASE=" }) -replace "DB_DATABASE=", ""
        $dbUser = ($envContent | Where-Object { $_ -match "DB_USERNAME=" }) -replace "DB_USERNAME=", ""
        
        Write-Host "Database configuration:" -ForegroundColor Cyan
        Write-Host "  Connection: $dbConnection" -ForegroundColor Cyan
        Write-Host "  Host: $dbHost" -ForegroundColor Cyan
        Write-Host "  Port: $dbPort" -ForegroundColor Cyan
        Write-Host "  Database: $dbName" -ForegroundColor Cyan
        Write-Host "  User: $dbUser" -ForegroundColor Cyan
        
        # Try to connect to database using PHP artisan
        Write-Host "`nTesting database connection via artisan..." -ForegroundColor Yellow
        cd "c:\xXNJEEBXx\Projects\flash Cards\backend"
        $artisanOutput = php artisan db:show
        
        Write-Host $artisanOutput -ForegroundColor Green
    } else {
        Write-Host "❌ .env file not found at $envPath" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database connection test error: $_" -ForegroundColor Red
}

Write-Host "`n API Connection Test Completed" -ForegroundColor Cyan
