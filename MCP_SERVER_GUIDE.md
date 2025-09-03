# 🤖 تشغيل MCP Server للـ Flash Cards

## 📋 الخطوات السريعة:

### 1️⃣ التأكد من الإعدادات:

- ملف `.env` موجود ومحدث ✅
- BACKEND_BASE_URL يشير إلى Railway ✅

### 2️⃣ تثبيت التبعيات:

```powershell
cd "c:\xXNJEEBXx\Projects\flash Cards\tools\mcp\flashcards-server"
npm install
```

### 3️⃣ بناء المشروع:

```powershell
npm run build
```

### 4️⃣ تشغيل MCP Server:

```powershell
# للتطوير (مع TypeScript مباشرة)
npm run dev

# أو للإنتاج (بعد البناء)
npm start
```

## 🔧 إعدادات MCP الحالية:

```
BACKEND_BASE_URL=https://flash-cards-production-5df5.up.railway.app/api
AUTH_TOKEN= (فارغ)
```

## 🛠 الأدوات المتاحة في MCP:

### 📚 **إدارة المجموعات:**

- `listDecks` - عرض جميع المجموعات
- `createDeck` - إنشاء مجموعة جديدة
- `updateDeck` - تحديث مجموعة
- `deleteDeck` - حذف مجموعة
- `resetDeck` - إعادة تعيين التقدم

### 🃏 **إدارة البطاقات:**

- `createCard` - إنشاء بطاقة جديدة
- `updateCard` - تحديث بطاقة
- `deleteCard` - حذف بطاقة
- `toggleKnown` - تبديل حالة "معروف"
- `markSeen` - تسجيل مشاهدة
- `markDifficult` - تسجيل صعوبة
- `getCardStats` - إحصائيات البطاقة

## 🧪 اختبار سريع:

```powershell
# اختبار الاتصال
npm run test
```

## 🚨 حل مشكلة المساحة:

إذا ظهر خطأ "ENOSPC: no space left on device":

1. قم بتنظيف ملفات مؤقتة
2. احذف node_modules وأعد التثبيت
3. تأكد من وجود مساحة كافية في القرص C:

## 🔗 استخدام مع Claude/AI:

بعد تشغيل MCP Server، يمكن للـ AI استخدام هذه الأدوات للتحكم في البطاقات مباشرة!

---

**جاهز للتشغيل عند حل مشكلة المساحة!** 🚀
