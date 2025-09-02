# MCP Flashcards Server Setup Script
# Run this to set up the MCP server for VS Code integration

Write-Host "Setting up Flashcards MCP Server..." -ForegroundColor Green

# Navigate to MCP server directory
$mcpPath = "tools\mcp\flashcards-server"
if (-not (Test-Path $mcpPath)) {
    Write-Host "Error: MCP server directory not found at $mcpPath" -ForegroundColor Red
    exit 1
}

Set-Location $mcpPath

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Set up environment file
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host ".env file already exists" -ForegroundColor Green
}

# Build the project
Write-Host "Building MCP server..." -ForegroundColor Yellow
npm run build

# Test the server
Write-Host "Testing MCP server..." -ForegroundColor Yellow
$testResult = echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}, "clientInfo": {"name": "test", "version": "1.0"}}}' | node dist/index.js

if ($testResult -match '"result"') {
    Write-Host "✅ MCP server test passed!" -ForegroundColor Green
} else {
    Write-Host "❌ MCP server test failed" -ForegroundColor Red
    Write-Host $testResult -ForegroundColor Red
}

Write-Host "Setup complete! The MCP server is ready." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your Laravel backend is running: php artisan serve" -ForegroundColor White
Write-Host "2. Restart VS Code to reload MCP configuration" -ForegroundColor White
Write-Host "3. The AI agent will now have access to flashcards tools!" -ForegroundColor White

# Navigate back to project root
Set-Location "..\..\..\"
