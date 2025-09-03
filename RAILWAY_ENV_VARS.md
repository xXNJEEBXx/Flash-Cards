# 🔧 متغيرات البيئة المطلوبة لـ Railway

## ضع هذه المتغيرات في Railway → Variables:

```
APP_NAME=Flash Cards
APP_ENV=production
APP_KEY=base64:NNk/aROjI3ydmSONWYNtS3sf/roeMKjo3Q6fgbvEVi0=
APP_DEBUG=false
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}

DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite

LOG_CHANNEL=stack
LOG_LEVEL=error

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=database

# Railway will handle these automatically
PORT=${{PORT}}
```

## 🚨 المتغير الأهم (السبب في خطأ 500):

```
APP_KEY=base64:NNk/aROjI3ydmSONWYNtS3sf/roeMKjo3Q6fgbvEVi0=
```

## 📋 خطوات إضافة المتغيرات:

1. Railway Dashboard → اضغط على مشروعك
2. اضغط **Variables** في القائمة الجانبية
3. اضغط **Add Variable**
4. أدخل كل متغير من القائمة أعلاه
5. احفظ - Railway سيعيد النشر تلقائياً

## ⏱ بعد إضافة المتغيرات:

- انتظر 2-3 دقائق لإعادة النشر
- جرب الرابط مرة أخرى
- يجب أن يعمل بدون خطأ 500

## 🧪 اختبار سريع:

```
https://your-app.up.railway.app/api/health
```

يجب أن يرجع: `{"status":"ok","timestamp":"..."}`
