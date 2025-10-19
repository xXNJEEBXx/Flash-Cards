#!/usr/bin/env pwsh
# ============================================
# تفعيل دعم المجلدات في MCP ServeWrite-Host "   1. Restart VS Code to load the updated MCP Server" -ForegroundColor White
Write-Host "   2. Try the new folder commands with Copilot" -ForegroundColor White
Write-Host ""
Write-Host "      'Show all folders'" -ForegroundColor Cyan
Write-Host "      'Create a folder named Programming'" -ForegroundColor Cyan
Write-Host "      'Move deck 5 to Programming folder'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Folder Tools:" -ForegroundColor Yellowvate Folders Support in MCP Server
# ============================================

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Flash Cards MCP - Folders Support Activation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من وجود Node.js
Write-Host "🔍 Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. الانتقال إلى مجلد MCP Server
$mcpPath = "tools\mcp\flashcards-server"
Write-Host "📁 Step 2: Navigating to MCP Server directory..." -ForegroundColor Yellow
Write-Host "   Path: $mcpPath" -ForegroundColor Gray

if (-not (Test-Path $mcpPath)) {
    Write-Host "   ❌ MCP Server directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $mcpPath
Write-Host "   ✅ Directory found" -ForegroundColor Green
Write-Host ""

# 3. تثبيت التبعيات إذا لزم الأمر
Write-Host "📦 Step 3: Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies (this may take a minute)..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# 4. بناء المشروع
Write-Host "🔨 Step 4: Building MCP Server with Folders support..." -ForegroundColor Yellow
Write-Host "   This compiles TypeScript to JavaScript..." -ForegroundColor Gray

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build completed successfully!" -ForegroundColor Green
Write-Host ""

# 5. التحقق من ملف الإخراج
Write-Host "🔍 Step 5: Verifying build output..." -ForegroundColor Yellow
if (Test-Path "dist\index.js") {
    $fileSize = (Get-Item "dist\index.js").Length / 1KB
    Write-Host "   ✅ Build output found: dist\index.js ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build output not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 6. التحقق من تسجيل MCP في VS Code
Set-Location ..\..\..
$mcpConfigPath = ".vscode\mcp.json"
Write-Host "🔍 Step 6: Checking VS Code MCP configuration..." -ForegroundColor Yellow

if (Test-Path $mcpConfigPath) {
    Write-Host "   ✅ MCP configuration found: $mcpConfigPath" -ForegroundColor Green
    $mcpConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
    if ($mcpConfig.servers.flashcards) {
        Write-Host "   ✅ Flashcards MCP Server is registered" -ForegroundColor Green
        Write-Host "      Backend: $($mcpConfig.servers.flashcards.env.BACKEND_BASE_URL)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  Flashcards MCP Server not found in config" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  MCP configuration file not found" -ForegroundColor Yellow
    Write-Host "      You may need to configure MCP manually in VS Code" -ForegroundColor Gray
}
Write-Host ""

# 7. الخلاصة والتعليمات
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Activation Successful!" -ForegroundColor Green
Write-Host "  MCP Folders Support Activated Successfully!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart VS Code to load the updated MCP Server" -ForegroundColor White
Write-Host "   2. Try the new folder commands with Copilot:" -ForegroundColor White
Write-Host ""
Write-Host "      💬 'عرض جميع المجلدات'" -ForegroundColor Cyan
Write-Host "      💬 'أنشئ مجلد باسم البرمجة'" -ForegroundColor Cyan
Write-Host "      💬 'انقل المجموعة 5 إلى مجلد البرمجة'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available Folder Tools:" -ForegroundColor Yellow
Write-Host "   - listFolders" -ForegroundColor Gray
Write-Host "   - createFolder" -ForegroundColor Gray
Write-Host "   - updateFolder" -ForegroundColor Gray
Write-Host "   - deleteFolder" -ForegroundColor Gray
Write-Host "   - moveDeckToFolder" -ForegroundColor Gray
Write-Host "   - removeDeckFromFolder" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "   - FOLDERS_SUPPORT.md          - Technical docs" -ForegroundColor Gray
Write-Host "   - MCP_FOLDERS_UPDATE.md       - Update summary" -ForegroundColor Gray
Write-Host "   - FOLDERS_USER_GUIDE_AR.md    - User guide (Arabic)" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
