# اختبار شامل لمشكلة حفظ البطاقات في Flash Cards
# هذا السكريبت يختبر ما إذا كانت البطاقات تُحفظ بشكل دائم في قاعدة البيانات

Write-Host "🧪 بدء الاختبار الشامل لحفظ البطاقات..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Yellow

# التحقق من حالة API
Write-Host "`n1️⃣ فحص حالة API..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -Method GET
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "✅ API يعمل بشكل صحيح - Laravel $($healthData.laravel_version)" -ForegroundColor Green
    Write-Host "📊 حالة قاعدة البيانات: $($healthData.database)" -ForegroundColor Green
} catch {
    Write-Host "❌ API غير متاح: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "تأكد من تشغيل الخادم بالأمر: php artisan serve" -ForegroundColor Yellow
    exit 1
}

# جلب البطاقات الحالية
Write-Host "`n2️⃣ جلب البطاقات الحالية..." -ForegroundColor Blue
try {
    $decksResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
    $deckData = $decksResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ تم جلب المجموعة: $($deckData.title)" -ForegroundColor Green
    Write-Host "📊 عدد البطاقات: $($deckData.cards.Count)" -ForegroundColor Green
    
    if ($deckData.cards.Count -eq 0) {
        Write-Host "❌ لا توجد بطاقات للاختبار" -ForegroundColor Red
        exit 1
    }
    
    # اختيار أول بطاقة للاختبار
    $testCard = $deckData.cards[0]
    $originalState = $testCard.known
    Write-Host "🎯 بطاقة الاختبار: ID=$($testCard.id), السؤال='$($testCard.question)'" -ForegroundColor Cyan
    Write-Host "📋 الحالة الأصلية: $(if ($originalState) { 'محفوظ' } else { 'غير محفوظ' })" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ فشل في جلب البطاقات: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# اختبار تغيير حالة البطاقة
Write-Host "`n3️⃣ اختبار تغيير حالة البطاقة..." -ForegroundColor Blue
try {
    $toggleResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1/cards/$($testCard.id)/toggle-known" -Method POST
    $toggleData = $toggleResponse.Content | ConvertFrom-Json
    
    if ($toggleData.success) {
        $newState = $toggleData.data.known
        Write-Host "✅ تم تغيير حالة البطاقة بنجاح" -ForegroundColor Green
        Write-Host "🔄 الحالة الجديدة: $(if ($newState) { 'محفوظ' } else { 'غير محفوظ' })" -ForegroundColor Green
        Write-Host "📈 مرات الحفظ: $($toggleData.data.times_known)" -ForegroundColor Green
        
        if ($newState -ne $originalState) {
            $originalStateText = if ($originalState) { 'محفوظ' } else { 'غير محفوظ' }
            $newStateText = if ($newState) { 'محفوظ' } else { 'غير محفوظ' }
            Write-Host "✅ تم تغيير الحالة بنجاح من '$originalStateText' إلى '$newStateText'" -ForegroundColor Green
        } else {
            Write-Host "⚠️ الحالة لم تتغير!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ فشل في تغيير حالة البطاقة" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ خطأ في تغيير حالة البطاقة: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# التحقق من حفظ التغيير
Write-Host "`n4️⃣ التحقق من حفظ التغيير في قاعدة البيانات..." -ForegroundColor Blue
Start-Sleep -Seconds 2  # انتظار قصير للتأكد من حفظ البيانات

try {
    $verifyResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1" -Method GET
    $verifyData = $verifyResponse.Content | ConvertFrom-Json
    $updatedCard = $verifyData.cards | Where-Object { $_.id -eq $testCard.id }
    
    if ($updatedCard) {
        $finalState = $updatedCard.known
        Write-Host "🔍 الحالة النهائية في قاعدة البيانات: $(if ($finalState) { 'محفوظ' } else { 'غير محفوظ' })" -ForegroundColor Cyan
        
        if ($finalState -ne $originalState) {
            Write-Host "✅ التغيير محفوظ بنجاح في قاعدة البيانات!" -ForegroundColor Green
            Write-Host "🎉 اختبار حفظ البطاقات: نجح!" -ForegroundColor Green
        } else {
            Write-Host "❌ التغيير لم يُحفظ في قاعدة البيانات!" -ForegroundColor Red
            Write-Host "💡 قد تكون هناك مشكلة في حفظ البيانات" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ لم يتم العثور على البطاقة بعد التحديث!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ خطأ في التحقق من البيانات: $($_.Exception.Message)" -ForegroundColor Red
}

# اختبار إضافي: إعادة toggle للعودة للحالة الأصلية
Write-Host "`n5️⃣ اختبار إعادة تبديل الحالة..." -ForegroundColor Blue
try {
    $reToggleResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/decks/1/cards/$($testCard.id)/toggle-known" -Method POST
    $reToggleData = $reToggleResponse.Content | ConvertFrom-Json
    
    if ($reToggleData.success) {
        $backToOriginal = $reToggleData.data.known
        Write-Host "🔄 الحالة بعد التبديل المزدوج: $(if ($backToOriginal) { 'محفوظ' } else { 'غير محفوظ' })" -ForegroundColor Cyan
        
        if ($backToOriginal -eq $originalState) {
            Write-Host "✅ عادت البطاقة للحالة الأصلية بنجاح" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ البطاقة في حالة مختلفة عن الأصلية" -ForegroundColor Blue
        }
    }
} catch {
    Write-Host "⚠️ خطأ في التبديل المزدوج: $($_.Exception.Message)" -ForegroundColor Yellow
}

# نصائح للمستخدم
Write-Host "`n💡 نصائح للاستخدام:" -ForegroundColor Yellow
Write-Host "   1. تأكد من أن التطبيق يستخدم API_URL الصحيح" -ForegroundColor White
Write-Host "   2. تحقق من ملف .env في مجلد flash-cards" -ForegroundColor White
Write-Host "   3. تأكد من تشغيل خادم Laravel (php artisan serve)" -ForegroundColor White
Write-Host "   4. عند تحديث الصفحة، يجب أن تبقى البطاقات في حالتها المحفوظة" -ForegroundColor White

Write-Host "`n===============================================" -ForegroundColor Yellow
Write-Host "🏁 انتهى الاختبار الشامل" -ForegroundColor Cyan
