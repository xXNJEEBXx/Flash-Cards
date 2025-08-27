# Test Laravel API
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
