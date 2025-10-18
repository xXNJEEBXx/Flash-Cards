# ⚡ Quick Start - Folders Feature

## تفعيل ميزة المجلدات في 3 خطوات

### الخطوة 1️⃣: تشغيل Migration
```powershell
# من مجلد المشروع الرئيسي
.\run-folders-migration.ps1

# أو يدوياً:
cd backend
php artisan migrate
```

### الخطوة 2️⃣: إعادة تشغيل السيرفر (إذا كان يعمل)
```powershell
# أوقف السيرفر الحالي (Ctrl+C)
# ثم شغّله من جديد
npm run start:frontend
```

### الخطوة 3️⃣: استخدم الميزة!
1. افتح التطبيق في المتصفح: http://localhost:3000
2. اضغط على زر **"📁 Folders"**
3. ابدأ بإنشاء مجلداتك!

---

## 📋 ملخص الملفات المضافة

### Backend
- `backend/database/migrations/2025_10_17_000000_create_folders_table.php`
- `backend/app/Models/Folder.php`
- `backend/app/Http/Controllers/FolderController.php`
- تحديث: `backend/routes/api.php`
- تحديث: `backend/app/Models/Deck.php`

### Frontend
- `flash-cards/src/context/FoldersContext.js`
- `flash-cards/src/components/Folders/FolderItem.js`
- `flash-cards/src/components/Folders/FolderItem.css`
- `flash-cards/src/components/Folders/FolderForm.js`
- `flash-cards/src/components/Folders/FolderForm.css`
- `flash-cards/src/components/Folders/FoldersView.js`
- `flash-cards/src/components/Folders/FoldersView.css`
- تحديث: `flash-cards/src/services/apiService.js`
- تحديث: `flash-cards/src/App.js`
- تحديث: `flash-cards/src/App.css`

### Documentation
- `FOLDERS_FEATURE.md` - وثائق تقنية
- `FOLDERS_USER_GUIDE_AR.md` - دليل المستخدم بالعربية
- `run-folders-migration.ps1` - سكريبت تشغيل Migration

---

## 🎨 المميزات الأساسية

✅ **إنشاء مجلدات ومجلدات فرعية** (Nested folders)
✅ **سحب وإفلات البطاقات** إلى المجلدات
✅ **عرض هرمي** للمجلدات والبطاقات
✅ **إحصائيات مباشرة** لكل مجلد
✅ **تعديل وحذف** المجلدات
✅ **حماية من الحلقات الدائرية** في الهيكل الهرمي

---

## 🧪 اختبار الميزة

1. **إنشاء مجلد**: اضغط "Create Folder" وأدخل اسم مثل "Programming"
2. **إنشاء مجلد فرعي**: من قائمة المجلد، اختر "Add Subfolder"
3. **نقل deck**: اسحب أي deck وأفلته على مجلد
4. **حذف مجلد**: من القائمة اختر Delete (البطاقات ستنتقل للأعلى)

---

## ⚠️ ملاحظات مهمة

- تأكد من وجود database.sqlite في `backend/database/`
- تأكد من تشغيل الـBackend Laravel على http://localhost:8000
- Frontend يجب أن يكون على http://localhost:3000

---

## 🐛 حل المشاكل الشائعة

**المشكلة**: لا تظهر المجلدات
**الحل**: 
1. تأكد من تشغيل migration
2. تحقق من اتصال Frontend بـBackend
3. افتح console في المتصفح للتحقق من الأخطاء

**المشكلة**: خطأ عند إنشاء مجلد
**الحل**:
1. تحقق من تشغيل Laravel backend
2. تأكد من وجود الجداول في قاعدة البيانات
3. راجع Laravel logs في `backend/storage/logs/`

---

## 🚀 الخطوة التالية

بعد التفعيل، يمكنك:
- البدء بتنظيم بطاقاتك الموجودة
- إنشاء هيكل هرمي لمواضيعك الدراسية
- استخدام السحب والإفلات لترتيب البطاقات

**استمتع! 🎉**
