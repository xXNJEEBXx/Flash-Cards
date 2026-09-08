````instructions
# 🛠 دليل التطوير - المكتبة الذكية (Al-Majlisi)

## 🤖 تعليمات خاصة للـ AI

### 📋 **قواعد أساسية للتطوير:**

- **اتبع ملف TODO.instructions.md**: راجع دائماً قسم "المهام المطلوبة الآن" قبل بدء أي عمل
- **React + TypeScript**: هذا المشروع يستخدم React مع TypeScript (Client-Side Only)
- **Arabic UI**: واجهة المستخدم بالعربية
- **Tailwind CSS**: استخدم Tailwind CSS للتصميم مع مبدأ Component-based styling
- **IndexedDB**: التخزين المحلي باستخدام Dexie.js
- **Gemini API**: معالجة الصفحات باستخدام Gemini 1.5 Flash

### ⚠️ **محظورات:**

- لا تضيف مكتبات جديدة دون ضرورة قصوى
- لا تعمل على مهام خارج قائمة "المطلوبة الآن"
- لا تغير بنية المشروع الأساسية دون موافقة
- لا تستخدم Backend - المشروع Client-Side فقط

---

## 🏗 هيكل المشروع

```
Al-Majlisi/
├── .github/instructions/     # ملفات التعليمات
├── src/frontend/            # React Application
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── pages/          # App Pages
│   │   ├── hooks/          # Custom Hooks
│   │   ├── services/       # AI, Storage, PDF, Search
│   │   ├── workers/        # Web Workers
│   │   ├── store/          # State Management
│   │   ├── types/          # TypeScript Types
│   │   └── utils/          # Utilities
│   └── public/             # Static Assets
├── tests/                   # Tests
└── README.md
```

---

## 🛠 بيئة التطوير

- **Storage**: IndexedDB (Dexie.js)
- **AI**: Google Gemini 1.5 Flash
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **PDF**: PDF.js

````
