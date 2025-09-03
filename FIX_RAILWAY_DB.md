# 🚨 إصلاح مشكلة قاعدة البيانات في Railway

## المشكلة المكتشفة:

Railway يحاول الاتصال بـ Supabase بدلاً من SQLite المحلية

## الحل السريع - انسخ هذه المتغيرات إلى Railway:

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

PORT=${{PORT}}
```

## 🎯 المتغيرات الأهم:

1. **APP_KEY** - مطلوب لتجنب خطأ 500
2. **DB_CONNECTION=sqlite** - استخدام SQLite بدلاً من PostgreSQL
3. **DB_DATABASE=/app/database/database.sqlite** - مسار قاعدة البيانات

## 📝 خطوات الإصلاح:

1. اذهب إلى Railway Dashboard
2. اختر مشروع flash-cards
3. اضغط **Variables**
4. احذف أي متغيرات PostgreSQL/Supabase موجودة
5. أضف المتغيرات أعلاه واحداً تلو الآخر
6. انتظر إعادة النشر (3-5 دقائق)

## ✅ اختبار النجاح:

بعد الإصلاح، هذا الرابط يجب أن يرجع `{"status":"ok"}`:

```
https://flash-cards-production-5df5.up.railway.app/api/health
```

## 🔄 إذا لم يعمل:

1. تأكد من حذف جميع متغيرات PostgreSQL
2. تأكد من أن `DB_CONNECTION=sqlite`
3. أعد نشر المشروع يدوياً من Railway
