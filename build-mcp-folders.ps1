# Build and Update MCP Server with Folders Support
# تحديث MCP Server مع دعم المجلدات

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Flash Cards MCP Server - Build & Update" -ForegroundColor Cyan
Write-Host "   دعم المجلدات (Folders Support) v0.2.0" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to MCP server directory
$mcpPath = "tools\mcp\flashcards-server"
Write-Host "📁 Navigating to: $mcpPath" -ForegroundColor Yellow
Set-Location $mcpPath

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Build the project
Write-Host "🔨 Building MCP Server..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

# Check if dist folder was created
if (Test-Path "dist\index.js") {
    Write-Host "✅ Output file created: dist\index.js" -ForegroundColor Green
} else {
    Write-Host "❌ Build output not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   ✅ MCP Server Updated Successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 New Features Added:" -ForegroundColor Yellow
Write-Host "   • listFolders - عرض جميع المجلدات"
Write-Host "   • createFolder - إنشاء مجلد جديد"
Write-Host "   • updateFolder - تحديث مجلد"
Write-Host "   • deleteFolder - حذف مجلد"
Write-Host "   • moveDeckToFolder - نقل بطاقة لمجلد"
Write-Host "   • removeDeckFromFolder - إخراج بطاقة من مجلد"
Write-Host ""

Write-Host "🔄 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart VS Code or Claude Desktop to reload MCP Server"
Write-Host "   2. Test with: 'عرض جميع المجلدات'"
Write-Host "   3. Try: 'أنشئ مجلد باسم Test'"
Write-Host ""

Write-Host "📖 Documentation: FOLDERS_SUPPORT.md" -ForegroundColor Cyan
Write-Host ""

# Return to project root
Set-Location ..\..\..
Write-Host "✅ Done! MCP Server is ready with Folders support" -ForegroundColor Green
