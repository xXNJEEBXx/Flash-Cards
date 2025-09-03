# 🔗 كيفية العثور على رابط Railway التطبيق

## من لوحة التحكم Railway:

### الطريقة الأولى - من Networking:
1. اذهب إلى مشروعك في Railway
2. اضغط على **Settings** في القائمة الجانبية
3. اضغط على **Networking**
4. ستجد **Public Networking** → انسخ الرابط

### الطريقة الثانية - من Deployments:
1. اضغط على **Deployments** في القائمة الجانبية
2. اضغط على آخر deployment (الأخضر ✅)
3. في أعلى الصفحة اضغط **View Deployment**
4. هذا هو رابط تطبيقك!

### الطريقة الثالثة - من Overview:
1. في الصفحة الرئيسية للمشروع
2. ابحث عن **Deployments** section
3. ستجد رابط أسفل اسم الـ service

## 🧪 اختبار سريع:
بمجرد حصولك على الرابط، جرب:
- `https://your-app.up.railway.app/api/health`
- `https://your-app.up.railway.app/api/decks`

## ⚠️ ملاحظة مهمة:
- رابط لوحة التحكم: `https://railway.com/project/...` ❌
- رابط التطبيق: `https://xxx.up.railway.app` ✅

## 🚨 إذا لم تجد الرابط:
قد تحتاج لتفعيل **Public Domain** أولاً:
1. Settings → Networking
2. اضغط **Generate Domain**
3. انتظر دقيقة حتى يتم إنشاء الرابط
