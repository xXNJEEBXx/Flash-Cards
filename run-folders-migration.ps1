# Run Folders Migration Script
# This script runs the database migration to enable the folders feature

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Folders Feature Migration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"

# Check if backend directory exists
if (-not (Test-Path $backendPath)) {
    Write-Host "Error: Backend directory not found at: $backendPath" -ForegroundColor Red
    exit 1
}

Write-Host "Navigating to backend directory..." -ForegroundColor Yellow
Set-Location $backendPath

Write-Host "Running database migrations..." -ForegroundColor Yellow
Write-Host ""

try {
    # Run migration
    php artisan migrate

    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "Migration completed successfully!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "The folders feature is now active!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your development server if running" -ForegroundColor White
    Write-Host "2. Navigate to the 'Folders' section in the app" -ForegroundColor White
    Write-Host "3. Start organizing your decks!" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Red
    Write-Host "Migration failed!" -ForegroundColor Red
    Write-Host "================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure your database is running" -ForegroundColor White
    Write-Host "2. Check your .env file configuration" -ForegroundColor White
    Write-Host "3. Ensure PHP and Composer are installed" -ForegroundColor White
    Write-Host ""
    exit 1
}
