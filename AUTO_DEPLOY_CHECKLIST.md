# ✅ Checklist: تفعيل Auto-Deploy على Railway

## 📝 اتبع هذه الخطوات بالترتيب:

---

### ☐ 1. افتح Railway Dashboard
```
https://railway.app/dashboard
```

---

### ☐ 2. اختر مشروع Flash Cards Backend
- اضغط على المشروع من القائمة

---

### ☐ 3. اذهب إلى Settings (⚙️)
- تبويب Settings في الأعلى

---

### ☐ 4. تحقق من Source Settings

في قسم "Source" أو "GitHub Repo":

- ☐ **Repository**: `xXNJEEBXx/Flash-Cards` ✅
- ☐ **Branch**: `main` ✅
- ☐ **Root Directory**: `backend` ⚠️ **مهم جداً!**

إذا لم يكن محدد:
- اضغط "Connect GitHub"
- اختر Repository + Branch
- اكتب `backend` في Root Directory

---

### ☐ 5. فعّل Auto-Deploy

ابحث عن أحد هذه الخيارات وفعّله:

- ☐ "Deploy on Push" ✅
- ☐ "Automatic Deployments" ✅
- ☐ "Deploy Triggers" → "On Push" ✅

---

### ☐ 6. احفظ الإعدادات
- اضغط "Save" أو "Update"

---

### ☐ 7. افعل أول Deploy يدوياً
- ارجع للصفحة الرئيسية
- اضغط زر **"Deploy"** أو **"Redeploy"**
- انتظر حتى يكتمل (2-3 دقائق)

---

### ☐ 8. اختبر Auto-Deploy

```powershell
# في Terminal
cd "c:\xXNJEEBXx\Projects\flash Cards"
echo "# Test Auto-Deploy" >> README.md
git add .
git commit -m "test: auto-deploy"
git push origin main
```

- ☐ راقب Railway Dashboard
- ☐ يجب أن يبدأ Deployment جديد تلقائياً خلال 30 ثانية

---

## ✅ نجح! إذا رأيت:
- ✅ Deployment جديد في "Deployments" tab
- ✅ Logs تقول "Triggered by push to main"
- ✅ Build يكتمل بنجاح

---

## ❌ لم ينجح؟ تحقق من:
- ❌ Root Directory = `backend` (وليس فارغ)
- ❌ Branch = `main` (وليس master)
- ❌ GitHub متصل بشكل صحيح
- ❌ Deploy يدوي نجح مرة واحدة على الأقل

---

## 📞 تحتاج مساعدة؟
افتح ملف `HOW_TO_ENABLE_AUTO_DEPLOY.md` للدليل الكامل المفصّل!

---

**آخر تحديث:** أكتوبر 2025
