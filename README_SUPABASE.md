# 🎴 Flash Cards App with Supabase

> **مشكلة حفظ البطاقات محلولة!** ✅ الآن البطاقات تُحفظ بشكل دائم في قاعدة بيانات Supabase

## 🌟 الميزات الجديدة

- ✅ **حفظ دائم**: البطاقات محفوظة في قاعدة بيانات PostgreSQL عبر Supabase
- ✅ **مزامنة فورية**: التغييرات تُحفظ مباشرة في السحاب
- ✅ **نسخ احتياطية**: localStorage كنسخة احتياطية عند انقطاع الاتصال
- ✅ **Optimistic Updates**: تحديث فوري للواجهة مع مزامنة خلفية
- ✅ **أمان متقدم**: Row Level Security في Supabase
- ✅ **لوحة تصحيح**: مراقبة العمليات في الوقت الفعلي

## 🚀 البدء السريع

### 1. إعداد Supabase

```bash
# 1. اذهب إلى https://supabase.com وأنشئ مشروع جديد
# 2. نفذ محتوى ملف supabase-setup.sql في SQL Editor
# 3. احصل على PROJECT_URL و ANON_KEY من Settings > API
```

### 2. تكوين التطبيق

```bash
# نسخ ملف البيئة
cp .env.example .env

# تحرير .env وإضافة بيانات Supabase
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. تشغيل التطبيق

```bash
# تثبيت الحزم
npm install

# تشغيل التطبيق
npm start
```

## 📁 بنية المشروع

```
flash-cards/
├── src/
│   ├── utils/
│   │   ├── supabaseClient.js     # عميل Supabase وخدمات البيانات
│   │   └── apiClient.js          # عميل Laravel (للنسخ الاحتياطية)
│   ├── context/
│   │   └── CardsContext.js       # حالة التطبيق مع تكامل Supabase
│   └── components/
│       └── DebugPanel.js         # لوحة التصحيح
├── supabase-setup.sql            # سكريبت إعداد قاعدة البيانات
├── supabase-test.html           # أداة اختبار شاملة
└── SUPABASE_SETUP.md            # دليل الإعداد المفصل
```

## 🛠️ كيفية عمل النظام

### تدفق حفظ البطاقات:

1. **الضغط على "Mark as Known"**:
   ```javascript
   // تحديث فوري للواجهة (Optimistic Update)
   setDecks(prev => /* تحديث الحالة محلياً */);
   
   // مزامنة مع Supabase في الخلفية
   const updated = await cardService.toggleKnown(cardId);
   
   // تحديث الحالة بحقيقة الخادم
   setDecks(prev => /* تحديث بنتيجة Supabase */);
   
   // حفظ نسخة احتياطية في localStorage
   localStorage.setItem('flashcards-decks', JSON.stringify(decks));
   ```

2. **تحديث الصفحة**:
   ```javascript
   // محاولة تحميل من Supabase أولاً
   const supabaseDecks = await deckService.getAll();
   
   // في حالة فشل الاتصال، استخدام localStorage
   if (!supabaseDecks) {
     const localDecks = JSON.parse(localStorage.getItem('flashcards-decks'));
     setDecks(localDecks);
   }
   ```

## 🧪 أدوات الاختبار

### 1. لوحة التصحيح (داخل التطبيق)
- مراقبة حالة الاتصال مع Supabase
- اختبار عمليات toggle في الوقت الفعلي
- عرض سجل العمليات

### 2. أداة الاختبار الشاملة
```bash
# افتح في المتصفح
open supabase-test.html
```

الميزات:
- ✅ اختبار الاتصال مع Supabase
- ✅ عرض البيانات المحفوظة
- ✅ اختبار toggle للبطاقات
- ✅ إنشاء بطاقات اختبار
- ✅ سجل مفصل للعمليات

## 📊 مخطط قاعدة البيانات

```sql
-- جدول المجموعات
decks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- جدول البطاقات
cards (
  id BIGSERIAL PRIMARY KEY,
  deck_id BIGINT REFERENCES decks(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  known BOOLEAN DEFAULT FALSE,
  times_seen INTEGER DEFAULT 0,
  times_known INTEGER DEFAULT 0,
  last_seen_at TIMESTAMP,
  last_known_at TIMESTAMP,
  is_difficult BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## 🔧 استكشاف الأخطاء

### المشكلة: البطاقات لا تُحفظ
**الحل:**
1. تحقق من إعدادات Supabase في `.env`
2. تأكد من تشغيل سكريبت `supabase-setup.sql`
3. راجع لوحة التصحيح للأخطاء

### المشكلة: خطأ في الاتصال
**الحل:**
1. تحقق من صحة URL والـ API key
2. تأكد من أن المشروع نشط في Supabase
3. راجع إعدادات Row Level Security

### المشكلة: بطء في التحديث
**الحل:**
1. النظام يستخدم Optimistic Updates (التحديث فوري)
2. المزامنة مع Supabase في الخلفية
3. تحقق من سرعة الاتصال بالإنترنت

## 🎯 الخطوات التالية

- [ ] إضافة مصادقة المستخدمين
- [ ] مشاركة المجموعات بين المستخدمين
- [ ] إحصائيات متقدمة لتتبع التقدم
- [ ] تصدير/استيراد البيانات
- [ ] دعم الصور في البطاقات
- [ ] تزامن متعدد الأجهزة

## 📚 الموارد

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Guide](https://www.postgresql.org/docs/)
- [React Context API](https://reactjs.org/docs/context.html)

---

### 🎉 تم حل مشكلة حفظ البطاقات!

الآن عندما تضغط على "Mark as Known" وتعيد تحميل الصفحة، ستجد أن البطاقة محفوظة بشكل دائم في قاعدة بيانات Supabase. لا مزيد من فقدان التقدم! 🚀
