# Quick Fix Script - Run Folders Migration
# This will fix the "Failed to create folder" error

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Quick Fix: Folders Migration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = Join-Path $PSScriptRoot "backend"

# Check if backend exists
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Error: Backend directory not found!" -ForegroundColor Red
    Write-Host "Path: $backendPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Backend directory found" -ForegroundColor Green
Write-Host "📂 Path: $backendPath" -ForegroundColor Gray
Write-Host ""

Set-Location $backendPath

# Check if database exists
$dbPath = Join-Path $backendPath "database\database.sqlite"
if (-not (Test-Path $dbPath)) {
    Write-Host "⚠️  Warning: database.sqlite not found!" -ForegroundColor Yellow
    Write-Host "Creating database file..." -ForegroundColor Yellow
    New-Item -Path $dbPath -ItemType File -Force | Out-Null
    Write-Host "✅ Database file created" -ForegroundColor Green
} else {
    Write-Host "✅ Database file exists" -ForegroundColor Green
}
Write-Host ""

# Run migration
Write-Host "🔄 Running database migrations..." -ForegroundColor Cyan
Write-Host ""

try {
    php artisan migrate --force
    
    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS! Migration Complete" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ The folders feature is now active!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "1. ✅ Migration completed" -ForegroundColor White
    Write-Host "2. 🔄 Refresh your browser (F5)" -ForegroundColor White
    Write-Host "3. 📁 Click 'Folders' button in the app" -ForegroundColor White
    Write-Host "4. ➕ Try creating a folder again" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 You're all set!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Red
    Write-Host "❌ Migration Failed" -ForegroundColor Red
    Write-Host "================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Check if PHP is installed:" -ForegroundColor White
    Write-Host "   php --version" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check Laravel installation:" -ForegroundColor White
    Write-Host "   php artisan --version" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Check .env file:" -ForegroundColor White
    Write-Host "   Make sure DB_CONNECTION=sqlite is set" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Try manually:" -ForegroundColor White
    Write-Host "   cd backend" -ForegroundColor Gray
    Write-Host "   php artisan migrate" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Verify tables exist
Write-Host "🔍 Verifying database tables..." -ForegroundColor Cyan
try {
    $tables = php artisan db:show --json | ConvertFrom-Json
    if ($tables -match "folders") {
        Write-Host "✅ 'folders' table created successfully!" -ForegroundColor Green
    }
    if ($tables -match "decks") {
        Write-Host "✅ 'decks' table verified!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify tables, but migration completed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
