# 🚀 نشر Backend على Railway - خطوة بخطوة

## ✅ المطلوب قبل البدء:

1. حساب GitHub (لرفع الكود)
2. حساب Railway (مجاني)
3. الكود جاهز (تم ✅)

## 📝 الخطوات:

### 1️⃣ رفع الكود إلى GitHub

```powershell
# في مجلد المشروع الرئيسي
git add .
git commit -m "Prepare backend for Railway deployment"
git push origin main
```

### 2️⃣ إنشاء مشروع على Railway

1. اذهب إلى https://railway.app
2. اضغط "Login" → "Login with GitHub"
3. اضغط "New Project"
4. اختر "Deploy from GitHub repo"
5. اختر repository: **Flash-Cards**
6. في "Root Directory" اكتب: `backend`
7. اضغط "Deploy"

### 3️⃣ إضافة متغيرات البيئة

في Railway Dashboard → Variables → اضف هذه المتغيرات:

```
APP_NAME=Flash Cards
APP_ENV=production
APP_KEY=base64:NNk/aROjI3ydmSONWYNtS3sf/roeMKjo3Q6fgbvEVi0=
APP_DEBUG=false
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
LOG_LEVEL=error
SESSION_DRIVER=file
CACHE_STORE=file
```

### 4️⃣ تفعيل Public Domain

1. في Railway → Settings → Networking
2. اضغط "Generate Domain"
3. احفظ الرابط (ستحتاجه للـ Frontend)

### 5️⃣ مراقبة النشر

1. اذهب إلى Deployments
2. انتظر انتهاء Build (سيستغرق 2-3 دقائق)
3. تأكد من حالة "SUCCESS"

## ✅ اختبار النشر

بعد انتهاء النشر، اختبر هذه الروابط:

```
https://your-app.up.railway.app/api/health
https://your-app.up.railway.app/api/decks
```

## 🚨 استكشاف الأخطاء

### إذا فشل Build:

1. اذهب إلى Deployments → اضغط على آخر deployment
2. راجع "Build Logs"
3. ابحث عن أخطاء PHP أو Composer

### إذا فشل Runtime:

1. اذهب إلى Deployments → "Deploy Logs"
2. تأكد من وجود ملف database.sqlite
3. تحقق من APP_KEY

### مشاكل شائعة:

- **APP_KEY missing**: تأكد من إضافة المتغير الصحيح
- **Database error**: تأكد من مسار قاعدة البيانات
- **Permission denied**: Railway يتعامل مع هذا تلقائياً

## 📋 نصائح:

1. **احفظ رابط Railway** - ستحتاجه للـ Frontend
2. **استخدم Deploy Logs** لمتابعة أي مشاكل
3. **اختبر API** بعد كل تحديث
4. **استخدم Variables** لا تضع أسرار في الكود

## 🎯 التالي:

بعد نجاح نشر Backend، الخطوة التالية ستكون:

1. نشر Frontend على Vercel
2. ربط Frontend بـ Backend URL
3. اختبار المشروع كاملاً

---

**رابط Backend بعد النشر**: https://your-app.up.railway.app
