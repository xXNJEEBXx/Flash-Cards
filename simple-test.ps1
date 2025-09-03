# اختبار حفظ البطاقات في Flash Cards API
Write-Host "🧪 اختبار حفظ البطاقات..." -ForegroundColor Cyan

# فحص API
Write-Host "1. فحص حالة API..." -ForegroundColor Blue
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET
$health = $response.Content | ConvertFrom-Json
Write-Host "✅ API يعمل - Laravel $($health.laravel_version)" -ForegroundColor Green

# جلب البطاقات
Write-Host "2. جلب البطاقات..." -ForegroundColor Blue
$deckResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
$deck = $deckResponse.Content | ConvertFrom-Json
Write-Host "✅ المجموعة: $($deck.title) - $($deck.cards.Count) بطاقة" -ForegroundColor Green

# اختبار أول بطاقة
$testCard = $deck.cards[0]
$originalState = $testCard.known
Write-Host "🎯 بطاقة الاختبار: $($testCard.question)" -ForegroundColor Yellow
if ($originalState) {
    Write-Host "📋 الحالة الأصلية: محفوظ" -ForegroundColor Cyan
} else {
    Write-Host "📋 الحالة الأصلية: غير محفوظ" -ForegroundColor Cyan
}

# تغيير الحالة
Write-Host "3. تغيير حالة البطاقة..." -ForegroundColor Blue
$toggleResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1/cards/$($testCard.id)/toggle-known" -Method POST
$toggleResult = $toggleResponse.Content | ConvertFrom-Json

if ($toggleResult.success) {
    $newState = $toggleResult.data.known
    if ($newState) {
        Write-Host "✅ تم التغيير إلى: محفوظ" -ForegroundColor Green
    } else {
        Write-Host "✅ تم التغيير إلى: غير محفوظ" -ForegroundColor Green
    }
} else {
    Write-Host "❌ فشل في التغيير" -ForegroundColor Red
}

# التحقق من الحفظ
Write-Host "4. التحقق من الحفظ..." -ForegroundColor Blue
Start-Sleep -Seconds 1
$verifyResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
$verifyDeck = $verifyResponse.Content | ConvertFrom-Json
$updatedCard = $verifyDeck.cards | Where-Object { $_.id -eq $testCard.id }

if ($updatedCard.known -ne $originalState) {
    Write-Host "✅ التغيير محفوظ في قاعدة البيانات!" -ForegroundColor Green
} else {
    Write-Host "❌ التغيير لم يُحفظ!" -ForegroundColor Red
}

Write-Host "🏁 انتهى الاختبار" -ForegroundColor Cyan
