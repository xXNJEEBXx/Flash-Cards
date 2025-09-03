# Flash Cards API Persistence Test
Write-Host "Testing Flash Cards API persistence..." -ForegroundColor Cyan

# Check API health
Write-Host "1. Checking API health..." -ForegroundColor Blue
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET
$health = $response.Content | ConvertFrom-Json
Write-Host "API is working - Laravel $($health.laravel_version)" -ForegroundColor Green

# Get cards
Write-Host "2. Getting cards..." -ForegroundColor Blue
$deckResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
$deck = $deckResponse.Content | ConvertFrom-Json
Write-Host "Deck: $($deck.title) - $($deck.cards.Count) cards" -ForegroundColor Green

# Test first card
$testCard = $deck.cards[0]
$originalState = $testCard.known
Write-Host "Test card: $($testCard.question)" -ForegroundColor Yellow

if ($originalState) {
    Write-Host "Original state: Known" -ForegroundColor Cyan
} else {
    Write-Host "Original state: Unknown" -ForegroundColor Cyan
}

# Toggle card state
Write-Host "3. Toggling card state..." -ForegroundColor Blue
$toggleResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1/cards/$($testCard.id)/toggle-known" -Method POST
$toggleResult = $toggleResponse.Content | ConvertFrom-Json

if ($toggleResult.success) {
    $newState = $toggleResult.data.known
    if ($newState) {
        Write-Host "Changed to: Known" -ForegroundColor Green
    } else {
        Write-Host "Changed to: Unknown" -ForegroundColor Green
    }
} else {
    Write-Host "Failed to toggle" -ForegroundColor Red
}

# Verify persistence
Write-Host "4. Verifying persistence..." -ForegroundColor Blue
Start-Sleep -Seconds 1
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
$verifyDeck = $verifyResponse.Content | ConvertFrom-Json
$updatedCard = $verifyDeck.cards | Where-Object { $_.id -eq $testCard.id }

if ($updatedCard.known -ne $originalState) {
    Write-Host "SUCCESS: Change is persisted in database!" -ForegroundColor Green
} else {
    Write-Host "FAILURE: Change was not saved!" -ForegroundColor Red
}

Write-Host "Test completed" -ForegroundColor Cyan
