# Test Laravel API - Basic API Endpoint Testing
# 
# Purpose: Tests individual Laravel API endpoints for the Flash Cards application
# Prerequisites: Laravel server must be running on http://127.0.0.1:8000
# Usage: powershell -ExecutionPolicy Bypass -File "test-api.ps1"
# 
# This script tests:
# - Card creation endpoint
# - JSON response formatting
# - Basic API connectivity
#

$body = @{
    question = "What is SQL injection?"
    answer = "A web security vulnerability"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/decks/2/cards" -Method Post -ContentType "application/json" -Body $body
    Write-Host "Card created successfully:"
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response.StatusCode)"
}
