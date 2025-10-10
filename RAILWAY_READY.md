# 🚀 دليل Deployment النهائي - Railway

## ✅ الملفات الجاهزة للـ Deployment:

### 1. **railway.json** ✅

- تكوين Railway الأساسي
- healthcheck على `/api/health`
- سياسة إعادة التشغيل عند الفشل

### 2. **nixpacks.toml** ✅

- تحديد PHP 8.2 و Composer
- تشغيل init-db.sh قبل migrations
- الأمر النهائي: migrate ثم serve

### 3. **init-db.sh** ✅

- إنشاء مجلد database
- إنشاء ملف database.sqlite
- ضبط الصلاحيات

### 4. **.env.production** ✅

- DB_CONNECTION=sqlite
- DB_DATABASE=/app/database/database.sqlite
- APP_KEY محدد

---

## 🎯 خطوات الـ Deployment على Railway:

### المرحلة 1: التحقق من الإعدادات

1. **افتح Railway Dashboard**: https://railway.app
2. **اذهب إلى مشروعك**: Flash Cards Backend
3. **تحقق من Variables** (Settings → Variables):
   ```
   ✅ DB_CONNECTION=sqlite
   ✅ DB_DATABASE=/app/database/database.sqlite
   ✅ APP_KEY=base64:8dQ3vZ5kF7mN2pL9wR1xY6tH4jC0sA5bE8fG3qK7mN9=
   ```

### المرحلة 2: إزالة MySQL (إن وُجد)

- إذا كان هناك **MySQL/PostgreSQL service** → احذفه
- نحن نستخدم **SQLite محلي** فقط

### المرحلة 3: إعادة Deploy

سيتم تلقائياً بعد push، أو:

1. اضغط على **3 نقاط** بجانب اسم الـ service
2. اختر **Redeploy**
3. انتظر اكتمال البناء

---

## 📊 ما يحدث أثناء الـ Deploy:

```
1. ⬇️  Clone Repository
2. 📦 Install Dependencies (composer install)
3. 🔧 Build Phase:
   - chmod +x init-db.sh
   - php artisan config:cache
   - php artisan route:cache
   - php artisan view:cache
4. 🚀 Start:
   - bash init-db.sh (إنشاء SQLite)
   - php artisan migrate --force (تشغيل migrations)
   - php artisan serve (بدء الخادم)
5. ✅ Health Check: GET /api/health
```

---

## 🐛 حل المشاكل المحتملة:

### ❌ "MySQL server has gone away"

**الحل**: تأكد من عدم وجود MySQL service وأن `DB_CONNECTION=sqlite`

### ❌ "Permission denied: database.sqlite"

**الحل**: init-db.sh يحل هذه المشكلة تلقائياً

### ❌ "APP_KEY not set"

**الحل**: تحقق من Variables في Railway أو استخدم `.env.production`

---

## 🎉 التحقق من نجاح الـ Deploy:

1. **افتح URL الخاص بالتطبيق**:

   ```
   https://your-app.railway.app/api/health
   ```

   يجب أن يعيد: `{"status": "ok"}`

2. **اختبر API**:

   ```
   GET https://your-app.railway.app/api/decks
   ```

   يجب أن يعيد قائمة المجموعات

3. **تحقق من Logs** في Railway Dashboard

---

## 📝 ملاحظات مهمة:

- ✅ **SQLite** يعمل بشكل ممتاز على Railway للتطبيقات الصغيرة
- ✅ **البيانات تُحفظ** في `/app/database/database.sqlite`
- ⚠️ **البيانات تُفقد** عند إعادة deploy (استخدم Volume للحفظ الدائم)
- ✅ **الأداء**: SQLite سريع جداً للتطبيقات الصغيرة والمتوسطة

---

## 🔄 للحفظ الدائم للبيانات (اختياري):

في Railway Dashboard:

1. اذهب إلى **Settings**
2. أضف **Volume**
3. Mount Path: `/app/database`
4. هذا سيحفظ البيانات بشكل دائم

---

## ✅ كل شيء جاهز الآن!

المستودع محدّث والملفات صحيحة.
انتقل إلى Railway وراقب الـ deployment! 🚀
