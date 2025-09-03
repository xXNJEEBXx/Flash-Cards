# 🚨 حل خطأ 500 في Railway

## المشكلة:
خطأ 500 عند الوصول للرابط الأساسي

## الحل السريع:

### 1️⃣ جرب API endpoints:
```
✅ https://flash-cards-production-5df5.up.railway.app/api/health
✅ https://flash-cards-production-5df5.up.railway.app/api/decks
```

### 2️⃣ أضف هذه المتغيرات في Railway Variables:

**المتغيرات الضرورية:**
```
APP_KEY=base64:NNk/aROjI3ydmSONWYNtS3sf/roeMKjo3Q6fgbvEVi0=
APP_ENV=production
APP_DEBUG=true
APP_URL=https://flash-cards-production-5df5.up.railway.app
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite
```

**متغيرات إضافية مهمة:**
```
LOG_CHANNEL=stack
LOG_LEVEL=debug
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

### 3️⃣ فحص Logs في Railway:
1. Dashboard → Deployments
2. اضغط آخر deployment
3. راجع **Build Logs** و **Deploy Logs**

### 4️⃣ إذا استمرت المشكلة:

قد نحتاج لإضافة route للصفحة الرئيسية في Laravel.

## 🧪 اختبار سريع:

**API Health Check:**
```bash
curl https://flash-cards-production-5df5.up.railway.app/api/health
```

**متوقع:** `{"status":"ok","timestamp":"..."}`

## 📋 أولويات الحل:

1. ✅ أضف APP_KEY
2. ✅ اختبر `/api/health` 
3. ✅ راجع Deploy Logs
4. ✅ أضف route للصفحة الرئيسية إذا لزم

---

**ملاحظة:** Laravel API لا يحتاج صفحة رئيسية، المهم أن API endpoints تعمل!
