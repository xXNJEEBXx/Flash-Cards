# 🚀 دليل نشر مشروع Flash Cards

## 📋 الخطوات السريعة:

### 1. رفع الكود إلى GitHub
```powershell
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. نشر Backend على Railway
1. اذهب إلى https://railway.app
2. سجل دخول بـ GitHub
3. New Project → Deploy from GitHub repo
4. اختر repository → اختر مجلد `backend`
5. أضف متغيرات البيئة:
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:your-generated-key
   DB_CONNECTION=sqlite
   DB_DATABASE=/app/database/database.sqlite
   ```

### 3. نشر Frontend على Vercel
1. اذهب إلى https://vercel.com
2. سجل دخول بـ GitHub
3. New Project → اختر repository
4. Root Directory: `flash-cards`
5. أضف متغير البيئة:
   ```
   REACT_APP_API_URL=https://your-railway-url.up.railway.app
   ```

## 🔧 إعدادات إضافية:

### إنشاء APP_KEY جديد:
```powershell
cd backend
php artisan key:generate --show
```

### اختبار النشر محلياً:
```powershell
# Backend
cd backend
php artisan serve

# Frontend (نافذة جديدة)
cd flash-cards
REACT_APP_API_URL=http://127.0.0.1:8000 npm start
```

## 🌐 مواقع الاستضافة البديلة:

### للـ Backend:
- Railway (مجاني، سهل)
- Heroku (محدود مجاناً)
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### للـ Frontend:
- Vercel (مجاني، سريع)
- Netlify (مجاني، سهل)
- GitHub Pages
- Firebase Hosting

## 🚨 نصائح مهمة:

1. **احفظ رابط Backend** من Railway وضعه في متغيرات البيئة للـ Frontend
2. **اختبر API** بعد النشر: `https://your-backend-url/api/decks`
3. **راقب الـ Logs** في Railway لأي أخطاء
4. **استخدم HTTPS** دائماً في الإنتاج

## 🔍 استكشاف الأخطاء:

### مشكلة CORS:
- تأكد من إضافة رابط Frontend في `config/cors.php`

### مشكلة قاعدة البيانات:
- تأكد من وجود ملف `database.sqlite`
- شغل: `php artisan migrate --force`

### مشكلة Build:
- تأكد من وجود كل dependencies في `package.json`
- شغل: `npm run build` محلياً للاختبار
