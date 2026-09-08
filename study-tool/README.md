# PDF Study Tool 📚

أداة تحول أي ملف PDF (سلايدات/محاضرات) إلى **3 ملفات Word** للمذاكرة — بضغطة كلك يمين!

## الملفات الناتجة

| الملف                 | الوصف                                                |
| --------------------- | ---------------------------------------------------- |
| `01_Translation.docx` | ترجمة المحتوى (إنجليزي + عربي) مع الحفاظ على التنسيق |
| `02_Simplified.docx`  | شرح مبسط — "الزبدة" لكل مفهوم بالعربي                |
| `03_FlashCards.docx`  | بطاقات فلاش كارد (سؤال + جواب) للمراجعة السريعة      |

## التثبيت

### 1. تثبيت المتطلبات

```bash
pip install -r requirements.txt
```

### 2. إعداد API Key

شغّل البرنامج مرة أو افتح ملف `settings.json` وأضف المفتاح:

**لـ Google Gemini (مجاني جزئياً):**

```json
{
  "provider": "gemini",
  "gemini_api_key": "YOUR_GEMINI_API_KEY"
}
```

**لـ OpenAI:**

```json
{
  "provider": "openai",
  "openai_api_key": "YOUR_OPENAI_API_KEY"
}
```

> 💡 للحصول على مفتاح Gemini مجاني: [Google AI Studio](https://aistudio.google.com/apikey)

### 3. تثبيت قائمة كلك يمين (اختياري)

```bash
python context_menu.py install
```

> ⚠️ يجب تشغيله **كمسؤول** (Run as Administrator)

## الاستخدام

### الطريقة 1: كلك يمين (بعد تثبيت القائمة)

1. اضغط كلك يمين على أي ملف PDF
2. اختر **"PDF Study Tool"**
3. انتظر المعالجة — يظهر مجلد جديد فيه 3 ملفات Word

### الطريقة 2: سطر الأوامر

```bash
python main.py path/to/lecture.pdf
```

### الطريقة 3: تشغيل مباشر

```bash
python main.py
```

يفتح نافذة اختيار ملف.

## النتيجة

```
lecture.pdf               ← الملف الأصلي
lecture_study/            ← المجلد الجديد
├── 01_Translation.docx  ← ترجمة مع تنسيق
├── 02_Simplified.docx   ← شرح مبسط (الزبدة)
└── 03_FlashCards.docx   ← بطاقات مذاكرة
```

## الإعدادات (settings.json)

| الإعداد                  | الوصف             | القيمة الافتراضية       |
| ------------------------ | ----------------- | ----------------------- |
| `provider`               | مزود AI           | `"gemini"`              |
| `gemini_api_key`         | مفتاح Gemini      | `""`                    |
| `gemini_model`           | موديل Gemini      | `"gemini-2.0-flash"`    |
| `openai_api_key`         | مفتاح OpenAI      | `""`                    |
| `openai_model`           | موديل OpenAI      | `"gpt-4o-mini"`         |
| `output_folder_template` | اسم المجلد الناتج | `"{name}_study"`        |
| `file1_name`             | اسم ملف الترجمة   | `"01_Translation.docx"` |
| `file2_name`             | اسم ملف التبسيط   | `"02_Simplified.docx"`  |
| `file3_name`             | اسم ملف البطاقات  | `"03_FlashCards.docx"`  |

## إلغاء التثبيت

لإزالة قائمة كلك يمين:

```bash
python context_menu.py uninstall
```

## التقنيات المستخدمة

- **Python** — اللغة الرئيسية
- **pdfplumber** — استخراج النص من PDF
- **python-docx** — إنشاء ملفات Word
- **Google Gemini / OpenAI** — معالجة المحتوى بالذكاء الاصطناعي
