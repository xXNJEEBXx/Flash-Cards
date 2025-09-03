# 🚀 دليل إعداد Flash Cards مع Supabase

## الخطوة 1: إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. قم بإنشاء حساب أو تسجيل الدخول
3. انقر على "New Project"
4. اختر Organization أو أنشئ واحد جديد
5. اختر اسم للمشروع (مثل: `flash-cards-app`)
6. اختر كلمة مرور قاعدة البيانات (احتفظ بها آمنة!)
7. اختر المنطقة الأقرب لك
8. انقر على "Create new project"

## الخطوة 2: إعداد قاعدة البيانات

1. انتظر حتى ينتهي إعداد المشروع (قد يستغرق دقيقة أو دقيقتين)
2. اذهب إلى قسم "SQL Editor" في لوحة التحكم
3. انسخ والصق محتوى ملف `supabase-setup.sql` في المحرر
4. انقر على "Run" لتشغيل السكريبت
5. تأكد من إنشاء الجداول بنجاح (ستظهر رسالة نجاح)

## الخطوة 3: الحصول على مفاتيح API

1. اذهب إلى "Settings" → "API"
2. انسخ الـ URL من قسم "Project URL"
3. انسخ الـ "anon public" key من قسم "Project API keys"

## الخطوة 4: تحديث إعدادات التطبيق

1. افتح ملف `.env` في مجلد `flash-cards`
2. استبدل القيم التالية:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**مثال:**
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY5MDAwMDAwMCwiZXhwIjoyMDA1NTc2MDAwfQ.example-signature
```

## الخطوة 5: تشغيل التطبيق

1. أعد تشغيل خادم React:
```bash
npm start
```

2. تحقق من وحدة تحكم المتصفح - يجب أن ترى:
   - ✅ Supabase connected successfully
   - 🔄 Loading decks from Supabase...

## الخطوة 6: اختبار النظام

1. جرب إضافة بطاقة جديدة
2. اضغط على "Mark as Known" لأي بطاقة
3. أعد تحميل الصفحة
4. تأكد من أن البطاقة ما زالت محفوظة كـ "Known"

## استكشاف الأخطاء

### خطأ في الاتصال
- تأكد من صحة الـ URL والـ API key
- تحقق من أن المشروع نشط في Supabase
- تأكد من إعادة تشغيل التطبيق بعد تحديث .env

### لا توجد بطاقات
- تأكد من تشغيل سكريبت SQL بنجاح
- تحقق من وجود البيانات في جدول `decks` و `cards` في Supabase

### أخطاء الأذونات
- تأكد من إعداد Row Level Security policies بشكل صحيح
- راجع قسم "Authentication" في Supabase إذا كنت تريد أذونات أكثر تعقيداً

## مميزات Supabase

✅ **حفظ دائم:** البطاقات محفوظة في قاعدة بيانات PostgreSQL
✅ **مزامنة فورية:** التغييرات تُحفظ مباشرة في السحاب
✅ **نسخ احتياطية:** localStorage كنسخة احتياطية إذا انقطع الاتصال
✅ **أمان:** Row Level Security وAPIآمن
✅ **مجاني:** خطة مجانية سخية للمشاريع الصغيرة

## الخطوات التالية (اختيارية)

1. **إعداد المصادقة:** إضافة تسجيل دخول للمستخدمين
2. **مشاركة المجموعات:** السماح للمستخدمين بمشاركة البطاقات
3. **النسخ الاحتياطية:** تصدير/استيراد البيانات
4. **الإحصائيات المتقدمة:** تتبع تقدم التعلم بمرور الوقت

---

🎉 **تهانينا!** الآن تطبيق Flash Cards الخاص بك يستخدم Supabase لحفظ البطاقات بشكل دائم!
