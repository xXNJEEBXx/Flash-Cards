# 🎉 MCP Tool - دعم المجلدات الكامل

## ✨ ما تم إنجازه:

تم تحديث **MCP Server** ليدعم جميع عمليات المجلدات! الآن يمكن للـ AI:
- ✅ عرض جميع المجلدات
- ✅ إنشاء مجلدات جديدة (عادية ومتداخلة)
- ✅ تحديث المجلدات
- ✅ حذف المجلدات
- ✅ نقل البطاقات بين المجلدات
- ✅ إخراج البطاقات من المجلدات

---

## 📦 الملفات المحدثة:

### 1. **schemas.ts** ✅
```typescript
// أضيف FolderSchema كامل
export const FolderSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  parent_folder_id: z.number().nullable().optional(),
  order: z.number().optional(),
  decks: z.array(DeckSchema).optional(),
  subfolders: z.lazy(() => z.array(FolderSchema)).optional(),
});
```

### 2. **index.ts** ✅
```typescript
// أضيف 6 tools جديدة:
- listFolders
- createFolder
- updateFolder
- deleteFolder
- moveDeckToFolder
- removeDeckFromFolder

// مع handlers كاملة لكل tool
```

### 3. **package.json** ✅
```json
{
  "version": "0.2.0",
  "description": "... (with Folders support)"
}
```

---

## 🚀 كيفية البناء والاستخدام:

### الطريقة 1: استخدام السكريبت (الأسهل)
```powershell
.\build-mcp-folders.ps1
```

### الطريقة 2: يدوياً
```bash
cd tools/mcp/flashcards-server
npm run build
```

### بعد البناء:
1. **أعد تشغيل VS Code** أو **Claude Desktop**
2. **جرب الأوامر الجديدة** مع AI

---

## 💬 أمثلة على الأوامر:

### أساسيات:
```
🗣 "عرض جميع المجلدات"
🗣 "أنشئ مجلد باسم البرمجة"
🗣 "أنشئ مجلد JavaScript داخل مجلد البرمجة"
🗣 "احذف مجلد Test"
```

### متقدم:
```
🗣 "نظم بطاقاتي في مجلدات حسب الموضوع"
🗣 "انقل جميع بطاقات الأمن السيبراني إلى مجلد Security"
🗣 "أخرج البطاقة رقم 5 من المجلد"
🗣 "غير اسم المجلد 3 إلى علوم الحاسب"
```

### ذكي:
```
🗣 "أنشئ هيكل مجلدات لدراسة البرمجة"
   → AI ينشئ: Programming/
                ├─ JavaScript/
                ├─ Python/
                └─ Databases/

🗣 "ضع كل بطاقة في المجلد المناسب حسب موضوعها"
   → AI يحلل البطاقات وينظمها تلقائياً!
```

---

## 📊 API Endpoints المستخدمة:

```
GET    /api/folders              → listFolders
POST   /api/folders              → createFolder
PUT    /api/folders/{id}         → updateFolder
DELETE /api/folders/{id}         → deleteFolder
POST   /api/folders/{id}/move-deck → moveDeckToFolder
POST   /api/folders/remove-deck  → removeDeckFromFolder
```

---

## 🧪 اختبار شامل:

### Test 1: إنشاء مجلد
```javascript
// AI Command
"أنشئ مجلد باسم Test"

// MCP Call
createFolder({ name: "Test" })

// Expected Result
{
  "id": 5,
  "name": "Test",
  "description": null,
  "parent_folder_id": null,
  "decks": [],
  "subfolders": []
}
```

### Test 2: مجلد متداخل
```javascript
// AI Command
"أنشئ مجلد React داخل مجلد Programming"

// MCP Calls
listFolders() // للحصول على ID مجلد Programming
createFolder({ 
  name: "React", 
  parent_folder_id: 3 
})

// Expected Result
{
  "id": 6,
  "name": "React",
  "parent_folder_id": 3
}
```

### Test 3: نقل بطاقة
```javascript
// AI Command
"انقل البطاقة Cybersecurity Basics إلى مجلد Security"

// MCP Calls
listDecks() // البحث عن البطاقة
listFolders() // البحث عن المجلد
moveDeckToFolder({ folderId: 2, deckId: 10 })

// Expected Result
{ "success": true, "message": "Deck moved successfully" }
```

---

## 🎯 سيناريوهات واقعية:

### السيناريو 1: تنظيم تلقائي
```
User: "نظم بطاقاتي في مجلدات"

AI Analysis:
- يعرض البطاقات: listDecks()
- يحلل المواضيع
- ينشئ مجلدات: createFolder() × 3
- ينقل البطاقات: moveDeckToFolder() × 10

Result: ✅ مجلدات منظمة حسب الموضوع
```

### السيناريو 2: هيكل دراسي
```
User: "أنشئ هيكل مجلدات لدراسة علوم الحاسب"

AI Creates:
📁 Computer Science
   ├─ 📁 Programming
   │   ├─ 📁 JavaScript
   │   ├─ 📁 Python
   │   └─ 📁 C++
   ├─ 📁 Databases
   └─ 📁 Algorithms

Result: ✅ هيكل جاهز للاستخدام
```

### السيناريو 3: إعادة التنظيم
```
User: "انقل كل بطاقات JavaScript من General إلى Programming"

AI Actions:
1. listFolders() → يجد المجلدات
2. listDecks() → يجد البطاقات
3. فلترة البطاقات التي تحتوي "JavaScript"
4. removeDeckFromFolder() لكل بطاقة
5. moveDeckToFolder() لنقلها للمجلد الجديد

Result: ✅ إعادة تنظيم كاملة
```

---

## 🔍 Troubleshooting:

### مشكلة: "Tool not found"
```
الحل:
1. تأكد من البناء: npm run build
2. أعد تشغيل VS Code/Claude Desktop
3. تحقق من dist/index.js موجود
```

### مشكلة: "Backend connection failed"
```
الحل:
1. تأكد أن Backend يعمل: php artisan serve
2. تحقق من .env في MCP folder
3. تحقق من BACKEND_BASE_URL
```

### مشكلة: "Folder not found"
```
الحل:
1. استخدم listFolders() للحصول على IDs الصحيحة
2. تأكد من وجود المجلد في DB
3. تحقق من الـ migration منفذة
```

---

## 📚 الوثائق:

- **FOLDERS_SUPPORT.md** - دليل الميزات الجديدة
- **README.md** - دليل MCP Server العام
- **build-mcp-folders.ps1** - سكريبت البناء

---

## 🎉 النتيجة النهائية:

### قبل التحديث:
```
MCP Tools: 14 tools (Decks + Cards only)
```

### بعد التحديث:
```
MCP Tools: 20 tools
├─ Decks (5 tools)
├─ Cards (9 tools)
└─ Folders (6 tools) ← جديد! ✨
```

---

## 🚀 خطوات التفعيل:

1. **ابنِ المشروع:**
   ```powershell
   .\build-mcp-folders.ps1
   ```

2. **أعد تشغيل VS Code/Claude Desktop**

3. **جرب أول أمر:**
   ```
   "عرض جميع المجلدات"
   ```

4. **استمتع بالميزات الجديدة!** 🎉

---

**الإصدار:** 0.2.0  
**تاريخ التحديث:** 18 أكتوبر 2025  
**الميزات الجديدة:** 6 tools للمجلدات  
**الحالة:** ✅ جاهز للاستخدام
