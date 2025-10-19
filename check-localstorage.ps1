# Check LocalStorage Script
# هذا السكريبت يفحص محتوى localStorage للبطاقات التعليمية

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   فحص LocalStorage - البطاقات" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Path to Chrome/Edge LocalStorage for localhost:3000
$chromeStoragePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Local Storage\leveldb"
$edgeStoragePath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Local Storage\leveldb"

Write-Host "📂 مسارات LocalStorage المحتملة:" -ForegroundColor Yellow
Write-Host "Chrome: $chromeStoragePath"
Write-Host "Edge: $edgeStoragePath"
Write-Host ""

Write-Host "⚠️  ملاحظة: لا يمكن قراءة LocalStorage مباشرة من PowerShell" -ForegroundColor Red
Write-Host "لأن المتصفحات تشفر البيانات في ملفات LevelDB" -ForegroundColor Red
Write-Host ""

Write-Host "✅ الحلول المتاحة:" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣  افتح التطبيق في المتصفح: http://localhost:3000" -ForegroundColor White
Write-Host "2️⃣  افتح Developer Tools (اضغط F12)" -ForegroundColor White
Write-Host "3️⃣  اذهب إلى تبويب 'Application' أو 'التطبيق'" -ForegroundColor White
Write-Host "4️⃣  في الشريط الجانبي، اختر 'Local Storage' > 'http://localhost:3000'" -ForegroundColor White
Write-Host "5️⃣  ابحث عن المفتاح: flashcards-decks" -ForegroundColor White
Write-Host ""

Write-Host "أو استخدم هذا الكود في Console:" -ForegroundColor Cyan
Write-Host @"

const decks = JSON.parse(localStorage.getItem('flashcards-decks') || '[]');
console.log('📊 إجمالي المجموعات:', decks.length);
console.log('📊 إجمالي البطاقات:', decks.reduce((s,d) => s + (d.cards?.length || 0), 0));

const missingDecks = decks.filter(d => !d.id || typeof d.id === 'string');
console.log('⚠️  مجموعات محلية فقط:', missingDecks.length);

if (missingDecks.length > 0) {
    console.log('📝 أسماء المجموعات المحلية:');
    missingDecks.forEach(d => console.log('  -', d.title));
}

"@ -ForegroundColor Yellow

Write-Host ""
Write-Host "🌐 افتح ملف الفحص في المتصفح:" -ForegroundColor Green
$htmlPath = "C:\xXNJEEBXx\Projects\flash Cards\check-localstorage.html"
Write-Host "   $htmlPath" -ForegroundColor White
Write-Host ""

# Ask if user wants to open the check file
$response = Read-Host "هل تريد فتح ملف الفحص في المتصفح الافتراضي؟ (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Start-Process $htmlPath
    Write-Host "✅ تم فتح الملف!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   انتهى الفحص" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
