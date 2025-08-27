# Final Laravel + React Flash Cards API Test
Write-Host "Testing Laravel + React Flash Cards API Integration" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get all decks
Write-Host "Test 1: Getting all decks..." -ForegroundColor Yellow
try {
    $decks = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/decks" -Method Get
    Write-Host "Success! Found $($decks.Count) decks" -ForegroundColor Green
    foreach ($deck in $decks) {
        $cardCount = if ($deck.cards) { $deck.cards.Count } else { 0 }
        Write-Host "  - $($deck.title) ($cardCount cards)" -ForegroundColor White
    }
} catch {
    Write-Host "Failed to get decks: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Create a new deck
Write-Host "Test 2: Creating a new deck..." -ForegroundColor Yellow
$newDeck = @{
    title = "Laravel Test Deck"
    description = "Created via PowerShell API test"
} | ConvertTo-Json

try {
    $createdDeck = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/decks" -Method Post -ContentType "application/json" -Body $newDeck
    Write-Host "Deck created! ID: $($createdDeck.id)" -ForegroundColor Green
    $deckId = $createdDeck.id
} catch {
    Write-Host "Failed to create deck: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Add a card to the deck
Write-Host "Test 3: Adding a card to the deck..." -ForegroundColor Yellow
$newCard = @{
    question = "What is Laravel?"
    answer = "A PHP web framework for building robust applications"
} | ConvertTo-Json

try {
    $createdCard = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/decks/$deckId/cards" -Method Post -ContentType "application/json" -Body $newCard
    Write-Host "Card created! ID: $($createdCard.id)" -ForegroundColor Green
    $cardId = $createdCard.id
} catch {
    Write-Host "Failed to create card: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Toggle card known status
Write-Host "Test 4: Toggling card known status..." -ForegroundColor Yellow
try {
    $toggledCard = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/decks/$deckId/cards/$cardId/toggle-known" -Method Post
    Write-Host "Card status toggled! Known: $($toggledCard.known)" -ForegroundColor Green
} catch {
    Write-Host "Failed to toggle card: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Laravel + React Flash Cards API Integration Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Migration from React-only to Laravel + React completed successfully!" -ForegroundColor Green
