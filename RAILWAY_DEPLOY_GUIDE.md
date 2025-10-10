# 🚀 كيفية تفعيل Auto-Deploy على Railway

## المشكلة: Railway لا يبدأ Deployment تلقائياً

---

## ✅ الحل السريع (اختر واحد):

### **الطريقة 1: Deploy يدوياً (الأسرع)** ⚡

1. افتح Railway Dashboard: https://railway.app
2. اختر مشروع **Flash Cards Backend**
3. في الصفحة الرئيسية، اضغط **"Deploy"** أو **"Redeploy"**
4. انتظر اكتمال البناء (2-3 دقائق)

---

### **الطريقة 2: تفعيل Auto-Deploy** 🔄

#### الخطوة 1: التحقق من الاتصال بـ GitHub

1. اذهب إلى **Settings** (⚙️)
2. ابحث عن قسم **Source** أو **Service Source**
3. تحقق من:
   ```
   ✅ Repository: xXNJEEBXx/Flash-Cards
   ✅ Branch: main
   ✅ Root Directory: backend
   ```

#### الخطوة 2: تفعيل Auto-Deploy

1. في نفس صفحة **Settings**
2. ابحث عن **Deploy Triggers** أو **Automatic Deployments**
3. تأكد من تفعيل:
   - ✅ **Deploy on Push** (Deploy عند Push جديد)
   - ✅ **Watch Paths** (إذا موجود): `backend/**`

#### الخطوة 3: إعادة ربط GitHub (إذا لزم الأمر)

إذا لم يكن متصل:

1. اضغط **"Disconnect"** ثم **"Connect"**
2. اختر Repository: `xXNJEEBXx/Flash-Cards`
3. اختر Branch: `main`
4. Root Directory: `backend`

---

### **الطريقة 3: استخدام Railway CLI** 💻

إذا كان لديك Railway CLI مُثبّت:

```bash
# تسجيل الدخول
railway login

# الانتقال إلى المشروع
cd "c:\xXNJEEBXx\Projects\flash Cards\backend"

# ربط المشروع
railway link

# Deploy يدوياً
railway up
```

---

## 🔍 التحقق من نجاح الـ Deployment

بعد بدء الـ Deploy، راقب:

### 1. **Deployment Logs**

في Railway Dashboard → **Deployments** → اضغط على آخر deployment

يجب أن ترى:

```
✅ Cloning repository...
✅ Installing dependencies...
✅ Building application...
✅ 🔧 Initializing database...
✅ Running migrations...
✅ Starting server...
```

### 2. **اختبار الـ API**

بعد نجاح الـ Deploy:

```bash
# افتح في المتصفح
https://your-app.railway.app/api/health

# يجب أن يعيد
{"status": "ok"}
```

---

## ⚠️ إذا استمرت المشكلة

### السيناريو 1: لا يوجد Deployment تلقائي

- **الحل**: استخدم Deploy يدوياً كل مرة
- أو تحقق من إعدادات GitHub Webhooks

### السيناريو 2: Deployment يفشل

- راجع **Logs** في Railway
- تحقق من **Environment Variables**:
  ```
  DB_CONNECTION=sqlite
  DB_DATABASE=/app/database/database.sqlite
  ```

### السيناريو 3: Root Directory خاطئ

- تأكد من `Root Directory: backend`
- وليس المجلد الجذر للمشروع

---

## 📋 Checklist سريع

قبل الـ Deploy، تأكد من:

- ✅ GitHub متصل بـ Railway
- ✅ Branch محدد: `main`
- ✅ Root Directory: `backend`
- ✅ Auto-Deploy مفعّل
- ✅ Environment Variables صحيحة
- ✅ آخر commit تم push للـ GitHub

---

## 🎉 بعد نجاح الـ Deploy

1. احفظ رابط التطبيق من Railway
2. اختبر الـ API endpoints
3. راقب الـ Logs للتأكد من عدم وجود أخطاء

**الآن التطبيق يعمل! 🚀**
