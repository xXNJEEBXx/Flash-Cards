# Test API Connection
Write-Host "Testing API Connection"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/decks" -Headers @{"Accept"="application/json"}
    Write-Host "Success! Status: $($response.StatusCode)"
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Found $($content.Length) decks"
} catch {
    Write-Host "Error: $_"
}

# Test Health Endpoint
Write-Host "`nTesting Health Endpoint"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Headers @{"Accept"="application/json"}
    Write-Host "Success! Status: $($response.StatusCode)"
    $content = $response.Content | ConvertFrom-Json
    Write-Host "Database status: $($content.database.status)"
    Write-Host "Database tables: $($content.database.tables -join ', ')"
} catch {
    Write-Host "Error: $_"
}
