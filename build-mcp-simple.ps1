# ======================================
# MCP Flashcards - Build Script
# Simple version without special chars
# ======================================

Write-Host ""
Write-Host "Building MCP Server with Folders Support..." -ForegroundColor Cyan
Write-Host ""

$mcpPath = "tools\mcp\flashcards-server"

# Check if path exists
if (-not (Test-Path $mcpPath)) {
    Write-Host "ERROR: MCP Server directory not found!" -ForegroundColor Red
    exit 1
}

# Navigate to MCP server
Set-Location $mcpPath
Write-Host "Navigating to: $mcpPath" -ForegroundColor Yellow

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed" -ForegroundColor Green
}

# Build the project
Write-Host "Building TypeScript to JavaScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

# Verify output
if (Test-Path "dist\index.js") {
    Write-Host "SUCCESS: Build completed!" -ForegroundColor Green
    Write-Host "Output: dist\index.js" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Build output not found!" -ForegroundColor Red
    exit 1
}

# Return to root
Set-Location ..\..\..

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host " MCP Server Built Successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host " 1. Restart VS Code" -ForegroundColor White
Write-Host " 2. Try folder commands like:" -ForegroundColor White
Write-Host "    - Show all folders" -ForegroundColor Cyan
Write-Host "    - Create a folder" -ForegroundColor Cyan
Write-Host ""
