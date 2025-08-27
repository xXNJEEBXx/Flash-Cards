---
applyTo: "**"
---

# 🛠 دليل التطوير - تطبيق البطاقات التعليمية (Flash Cards)

## 🤖 تعليمات خاصة للـ AI

### 📋 **قواعد أساسية للتطوير:**

- **اتبع ملف TODO.instructions.md**: راجع دائماً قسم "المهام المطلوبة الآن" قبل بدء أي عمل
- **React Framework**: هذا المشروع يستخدم Create React App مع React 19
- **JavaScript**: جميع الملفات حالياً بصيغة JavaScript ES6+
- **CSS Modules**: استخدم CSS للتصميم مع مبدأ Component-based styling
- **Arabic/English**: التطبيق يدعم النصوص العربية والإنجليزية

### 🎯 **أولويات التطوير:**

1. **الوظائف الأساسية** - تطوير الميزات الأساسية للبطاقات التعليمية أولاً
2. **واجهة المستخدم** - تصميم بسيط وواضح متعدد اللغات
3. **تجربة المستخدم** - سهولة الاستخدام في إنشاء ودراسة البطاقات
4. **الاستجابة** - دعم الهواتف والحاسوب

### 🔧 **الهيكل التقني:**

- **Frontend**: React 19 في مجلد `flash-cards/`
- **Context API**: إدارة الحالة باستخدام CardsContext
- **Components**: مكونات قابلة لإعادة الاستخدام في `src/components/`
- **Data Storage**: حفظ البيانات في localStorage
- **Testing**: Jest و React Testing Library

### ⚠️ **محظورات:**

- لا تضيف مكتبات جديدة دون ضرورة قصوى
- لا تعمل على مهام خارج قائمة "المطلوبة الآن"
- لا تغير بنية المشروع الأساسية دون موافقة

---

## 🏗 هيكل المشروع

```

flash Cards/
├── flash-cards/ # التطبيق الرئيسي React
│ ├── src/
│ │ ├── components/ # المكونات القابلة لإعادة الاستخدام
│ │ │ ├── Card/ # مكون البطاقة
│ │ │ │ ├── Card.js
│ │ │ │ └── Card.css
│ │ │ ├── DeckList/ # قائمة المجموعات
│ │ │ │ ├── DeckList.js
│ │ │ │ └── DeckList.css
│ │ │ ├── Forms/ # نماذج الإدخال
│ │ │ │ ├── CardForm.js
│ │ │ │ ├── CardForm.css
│ │ │ │ ├── DeckForm.js
│ │ │ │ └── DeckForm.css
│ │ │ └── StudyMode/ # وضع الدراسة
│ │ │ ├── StudyMode.js
│ │ │ └── StudyMode.css
│ │ ├── context/ # إدارة الحالة العامة
│ │ │ └── CardsContext.js # السياق الرئيسي للبطاقات
│ │ ├── utils/ # المرافق والبيانات
│ │ │ └── cybersecurityCards.js # بيانات عينة
│ │ ├── App.js # التطبيق الرئيسي
│ │ ├── App.css # الأنماط الرئيسية
│ │ ├── index.js # نقطة الدخول
│ │ └── index.css # الأنماط العامة
│ ├── public/ # الأصول الثابتة
│ │ ├── index.html
│ │ ├── favicon.ico
│ │ └── manifest.json
│ ├── package.json # التبعيات والسكريبتات
│ └── README.md # وثائق المشروع
├── .github/ # إعدادات GitHub
│ └── instructions/ # تعليمات AI
│ ├── DEVELOPMENT.instructions.md # دليل التطوير (هذا الملف)
│ └── TODO.instructions.md # قائمة المهام
└── README.md # وصف المشروع العام

```

---

## 🛠 بيئة التطوير

### المتطلبات المسبقة

- Node.js 14+ و npm 6+
- Git
- محرر نصوص (VS Code مُفضّل)

### التثبيت والتشغيل

#### التثبيت والبدء السريع

1. **الانتقال إلى مجلد المشروع**

```bash
cd "flash Cards/flash-cards"
```

2. **تثبيت التبعيات**

```bash
npm install
```

3. **تشغيل التطبيق**

```bash
npm start
```

4. **فتح المتصفح على**

```
http://localhost:3000
```

#### سكريبتات متاحة

```bash
npm start        # تشغيل خادم التطوير
npm test         # تشغيل الاختبارات
npm run build    # بناء التطبيق للإنتاج
npm run eject    # إخراج التكوينات (غير مُوصى به)
```

---

## 🧩 معمارية التطبيق

### إدارة الحالة

- **CardsContext**: السياق الرئيسي لإدارة البطاقات والمجموعات
- **useState**: للحالات المحلية في المكونات
- **localStorage**: لحفظ البيانات بشكل دائم

### تدفق البيانات

1. **CardsContext** يحتوي على جميع البطاقات والمجموعات
2. **المكونات** تستهلك البيانات عبر useContext
3. **الإجراءات** تُحدث الحالة وتحفظ في localStorage

### المكونات الرئيسية

- **App**: المكون الجذر وإدارة التنقل
- **DeckList**: عرض قائمة المجموعات
- **Card**: عرض البطاقة الفردية
- **StudyMode**: وضع المراجعة والدراسة
- **Forms**: نماذج إنشاء وتعديل البطاقات

---

## 📱 معايير التصميم

### الاستجابة

- **Desktop First**: التصميم الأساسي للحاسوب
- **Mobile Responsive**: يتكيف مع الهواتف
- **Tablet Friendly**: دعم الأجهزة اللوحية

### إرشادات CSS

```css
/* استخدم BEM methodology */
.component-name {
}
.component-name__element {
}
.component-name--modifier {
}

/* متغيرات CSS للألوان */
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
}

/* استخدم flexbox وCSS Grid */
.container {
  display: flex;
  flex-direction: column;
}
```

### قواعد التصميم

- **البساطة**: واجهة نظيفة وواضحة
- **التباين**: ألوان واضحة للقراءة
- **التنقل**: سهولة الانتقال بين الصفحات
- **الملاحظات**: ردود أفعال واضحة للمستخدم

---

## 🔍 اختبار المشروع

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع التغطية
npm test -- --coverage

# تشغيل الاختبارات بدون وضع المشاهدة
npm test -- --watchAll=false
```

### أنواع الاختبارات

- **Unit Tests**: اختبار المكونات المفردة
- **Integration Tests**: اختبار التفاعل بين المكونات
- **Context Tests**: اختبار CardsContext

### أدوات الاختبار المتاحة

- **Jest**: إطار عمل الاختبارات
- **React Testing Library**: اختبار مكونات React
- **Jest DOM**: تحققات DOM إضافية

---

## 🚀 النشر والإنتاج

### بناء المشروع

```bash
npm run build
```

### النشر المحتمل

- **Netlify**: نشر سريع للتطبيقات الثابتة
- **Vercel**: نشر مُحسّن لتطبيقات React
- **GitHub Pages**: نشر مجاني لمشاريع GitHub

### تحسين الأداء

- **Code Splitting**: تقسيم الكود تلقائياً بواسطة CRA
- **Image Optimization**: ضغط الصور قبل الاستخدام
- **Bundle Analysis**: تحليل حجم الحزمة

---

## 📚 الموارد والمراجع

### وثائق مفيدة

- [React Docs](https://react.dev/)
- [Create React App](https://create-react-app.dev/)
- [Jest Testing](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### أفضل الممارسات

- **Component Naming**: أسماء وصفية وواضحة
- **File Organization**: تنظيم الملفات حسب الوظيفة
- **Code Comments**: توثيق الكود المعقد
- **Error Handling**: التعامل مع الأخطاء بشكل صحيح

---

## 🐛 حل المشاكل الشائعة

### مشاكل npm

```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install

# تنظيف cache
npm cache clean --force
```

### مشاكل React

- **State not updating**: تأكد من عدم تعديل الحالة مباشرة
- **Context not working**: تأكد من تغليف المكونات بالـ Provider
- **CSS not loading**: تأكد من استيراد ملفات CSS بشكل صحيح

### مشاكل التطوير

- **Port already in use**: غير المنفذ في package.json أو أوقف العملية
- **Build failures**: تحقق من الأخطاء في وحدة التحكم
- **Hot reload not working**: أعد تشغيل خادم التطوير

```

```
