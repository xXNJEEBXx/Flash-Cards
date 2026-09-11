"""
معالجة المحتوى بالذكاء الاصطناعي
=================================
يدعم Google Gemini و OpenAI.
يرسل 3 prompts مختلفة لإنشاء 3 ملفات.
"""

import time
from typing import Optional, List, Dict

# أقصى عدد صفحات في كل طلب AI
MAX_PAGES_PER_CHUNK = 10

# ============================================================
# Prompts الثلاثة
# ============================================================

PROMPT_1_TRANSLATION = """نفّذ التعليمات التالية على المحتوى أعلاه (سلايد سلايد مرقمين):
قم بترجمة المحتوى الأصلي مع الحفاظ على التنسيق الدقيق التالي:
العناوين والمصطلحات: اكتب المصطلح باللغة الإنجليزية، متبوعًا بترجمته العربية بين قوسين.
مثال: User authentication: (مصادقة المستخدم)
النقاط والشرح: اكتب كل نقطة باللغة الإنجليزية، ثم أضف ترجمتها العربية الحرفية في نهاية الجملة.
مثال: The process of verifying an identity claimed by or for a system entity. (عملية التحقق من هوية يدّعيها كيان في النظام أو من أجله).
الهدف: إنشاء مرجع للمراجعة السريعة مع ترجمة دقيقة ومباشرة.

الرسوم التوضيحية والأشكال (Diagrams / Figures):
- إذا كان السلايد يحتوي على رسم توضيحي أو شكل أو مخطط (diagram, figure, flowchart, chart) أو أي إشارة لصورة مهمة:
  اشرح الفكرة التي يوصّلها الرسم كتابياً بشكل واضح ومفصل.
  اكتب: [رسم توضيحي]: ثم وصف الرسم وشرح فكرته.
  مثال: [رسم توضيحي]: مخطط يوضح طبقات نموذج OSI السبع من الطبقة الفيزيائية في الأسفل إلى طبقة التطبيق في الأعلى، كل طبقة تتواصل مع الطبقة المقابلة لها.
- لا تتجاهل أي رسم توضيحي مهم — حاول نقل المعلومة التي يوصّلها الرسم بالكلمات.

مهم جداً:
- حافظ على ترقيم السلايدات كما هو
- لا تحذف أي محتوى
- الترجمة العربية تكون بين قوسين بعد كل نقطة أو مصطلح إنجليزي"""

PROMPT_2_SIMPLIFIED = """أعد كتابة نفس السلايدات، بهدف تبسيط المفاهيم لتكون سهلة الفهم والحفظ.
حافظ على النص الإنجليزي الأصلي كما هو في السلايدات.
بعد كل نقطة باللغة الإنجليزية، أضف شرحًا مبسطًا وواضحًا باللغة العربية بين قوسين.
يجب أن يركز الشرح العربي على الفكرة الجوهرية بكلمات قليلة ومختصرة سهلة الحفظ يشرح (الزبدة) من التعريف المقدار الي يخليني اجاوب صح بالإختبار، وليس أن يكون ترجمة حرفية.

المثال الأول:
Availability (التوافر)
Ensuring timely and reliable access to and use of information (ضمان أن النظام أو الخدمة تعمل ومتاحة للاستخدام عند الحاجة إليها).

المثال الثاني:
Access Control (التحكم بالوصول)
The selective restriction of access to a place or other resource (وضع قواعد لتحديد من يمكنه الوصول، مثل تحديد الموظفين الذين يمكنهم الدخول إلى ملفات معينة).

مهم جداً:
- حافظ على ترقيم السلايدات كما هو
- لا تحذف أي محتوى
- الشرح العربي يكون مبسط ومختصر (الزبدة) وليس ترجمة حرفية"""

PROMPT_3_FLASHCARDS = """قم بإنشاء بطاقات Flash Cards للمذاكرة بالاعتماد على السلايدات.
قواعد التنسيق:
كل بطاقة تحتوي على قسمين:
Front (الوجه): السؤال أو المصطلح بالإنجليزية مع الترجمة بالعربية.
Back (الخلف): الجواب أو الشرح بالإنجليزية مع الترجمة بالعربية.

أنواع البطاقات المقترحة:
بطاقات التعريفات.
بطاقات التعداد (List / Mention).
بطاقات الأمثلة (Give an example).
(يمكنك التعديل أو إضافة أنواع أخرى عند الحاجة).

مثال:
Front (الوجه): User authentication (مصادقة المستخدم)
Back (الخلف): The process of verifying an identity claimed by or for a system entity. (عملية التحقق من هوية المستخدم)

مهم جداً:
- غطّي جميع المفاهيم والمصطلحات الموجودة في السلايدات
- كل بطاقة مرقمة
- اكتب رقم السلايد المصدر لكل بطاقة"""


class AIProcessor:
    """معالج الذكاء الاصطناعي - يدعم Gemini و OpenAI."""

    def __init__(self, provider: str, api_key: str, model: str, config: dict = None):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.config = config or {}
        self._gemini_client = None
        self._openai_client = None
        self._openrouter_client = None

        if not api_key:
            raise ValueError(
                "مفتاح API غير موجود!\n"
                "افتح ملف settings.json وأضف المفتاح:\n"
                f'  "{provider}_api_key": "YOUR_KEY_HERE"'
            )

    def _init_gemini(self, model: str = None):
        """تهيئة عميل Gemini."""
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        self._gemini_client = genai.GenerativeModel(model or self.model)

    def _init_openai(self):
        """تهيئة عميل OpenAI."""
        from openai import OpenAI
        self._openai_client = OpenAI(api_key=self.api_key)

    def _init_openrouter(self):
        """تهيئة عميل OpenRouter عبر OpenAI SDK."""
        from openai import OpenAI
        openrouter_key = self.api_key if self.provider == "openrouter" else self.config.get("openrouter_api_key", "")
        if not openrouter_key:
            raise ValueError(
                "مفتاح OpenRouter API غير موجود!\n"
                "افتح ملف settings.json أو نافذة الإعدادات وأضف المفتاح:\n"
                '  "openrouter_api_key": "sk-or-v1-..."'
            )
        self._openrouter_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            default_headers={
                "HTTP-Referer": "https://github.com/xXNJEEBXx/Flash-Cards",
                "X-Title": "PDF Study Tool",
            }
        )

    def process(self, content: str, prompt: str, use_provider: str = None, use_model: str = None, images: list = None) -> str:
        """
        إرسال المحتوى مع prompt إلى AI والحصول على النتيجة.
        يدعم إرسال الصور (المخططات والرسوم البيانية) للنماذج البصرية.

        Args:
            content: النص المستخرج من PDF
            prompt: التعليمات المطلوبة
            use_provider: مزود مخصص لهذا الطلب (اختياري)
            use_model: موديل مخصص لهذا الطلب (اختياري)
            images: قائمة صور (PIL.Image) ملحقة بالسلايدات إن وجدت

        Returns:
            النص الناتج من AI
        """
        full_prompt = f"""المحتوى التالي مستخرج من عرض تقديمي (سلايدات):

{content}

---

{prompt}"""

        provider = use_provider or self.provider
        model = use_model or self.model

        if provider == "gemini":
            return self._process_gemini(full_prompt, model, images=images)
        elif provider == "openai":
            return self._process_openai(full_prompt, model, images=images)
        elif provider == "openrouter":
            return self._process_openrouter(full_prompt, model, images=images)
        else:
            raise ValueError(f"مزود غير مدعوم: {provider}")

    def process_chunked(self, pages: List[Dict], prompt: str,
                        use_provider: str = None, use_model: str = None,
                        progress_callback=None) -> str:
        """
        معالجة الصفحات على دفعات (كل دفعة MAX_PAGES_PER_CHUNK صفحة كحد أقصى).
        ترسل الصور والرسوم التوضيحية المرفقة بكل دفعة إلى نماذج الذكاء الاصطناعي.
        """
        chunks = []
        for i in range(0, len(pages), MAX_PAGES_PER_CHUNK):
            chunks.append(pages[i:i + MAX_PAGES_PER_CHUNK])

        if len(chunks) == 1:
            chunk = chunks[0]
            content = self._format_chunk(chunk)
            chunk_images = []
            for p in chunk:
                chunk_images.extend(p.get("images", []))
            return self.process(content, prompt, use_provider, use_model, images=chunk_images if chunk_images else None)

        all_results = []
        for idx, chunk in enumerate(chunks):
            page_range = f"{chunk[0]['page_number']}-{chunk[-1]['page_number']}"

            # جمع كافة الصور الموجودة في سلايدات هذه الدفعة
            chunk_images = []
            for p in chunk:
                chunk_images.extend(p.get("images", []))

            visual_label = f" + {len(chunk_images)} رسمة/مخطط" if chunk_images else ""
            if progress_callback:
                progress_callback(idx + 1, len(chunks),
                                  f"دفعة {idx + 1}/{len(chunks)} (صفحات {page_range}{visual_label})")

            content = self._format_chunk(chunk)
            result = self.process(content, prompt, use_provider, use_model, images=chunk_images if chunk_images else None)
            all_results.append(result)

            if idx < len(chunks) - 1:
                time.sleep(3)

        return "\n\n".join(all_results)

    def process_text_chunked(self, text: str, prompt: str,
                             use_provider: str = None, use_model: str = None,
                             progress_callback=None) -> str:
        """
        معالجة نص (نتيجة prompt سابق) — يقسّم حسب السلايدات.
        يُستخدم عندما يكون الإدخال نص من prompt سابق وليس صفحات PDF.
        """
        # تقسيم النص إلى دفعات حسب علامات Slide
        import re
        slide_pattern = re.compile(r'(===\s*Slide\s+\d+\s*===)', re.IGNORECASE)
        parts = slide_pattern.split(text)

        # تجميع السلايدات
        slides = []
        current = ""
        for part in parts:
            if slide_pattern.match(part):
                if current.strip():
                    slides.append(current.strip())
                current = part
            else:
                current += part
        if current.strip():
            slides.append(current.strip())

        # لو ما لقينا تقسيمات، نرسل كله مرة واحدة
        if len(slides) <= 1:
            return self.process(text, prompt, use_provider, use_model)

        # تقسيم إلى دفعات كل 10 سلايدات
        chunks = []
        for i in range(0, len(slides), MAX_PAGES_PER_CHUNK):
            chunks.append("\n\n".join(slides[i:i + MAX_PAGES_PER_CHUNK]))

        if len(chunks) == 1:
            return self.process(chunks[0], prompt, use_provider, use_model)

        all_results = []
        for idx, chunk_text in enumerate(chunks):
            if progress_callback:
                progress_callback(idx + 1, len(chunks),
                                  f"دفعة {idx + 1}/{len(chunks)}")

            result = self.process(chunk_text, prompt, use_provider, use_model)
            all_results.append(result)

            if idx < len(chunks) - 1:
                time.sleep(3)

        return "\n\n".join(all_results)

    @staticmethod
    def _format_chunk(pages: List[Dict]) -> str:
        """تحويل دفعة صفحات إلى نص منسق."""
        parts = []
        for page in pages:
            parts.append(
                f"=== Slide {page['page_number']} ===\n"
                f"{page['text']}\n"
            )
        return "\n".join(parts)

    def suggest_deck_info(self, content_sample: str,
                         use_provider: str = None, use_model: str = None,
                         existing_folders: list = None) -> dict:
        """
        يطلب من AI اقتراح اسم مجلد واسم مجموعة بطاقات بناءً على المحتوى.
        لو فيه مجلدات موجودة، AI يختار منها لو مناسبة.

        Args:
            content_sample: عينة من المحتوى (أول جزء من الترجمة)
            existing_folders: قائمة أسماء المجلدات الموجودة (اختياري)

        Returns:
            {"folder": "اسم المادة", "deck": "اسم الموضوع"}
        """
        import json as _json

        # بناء الـ prompt
        folders_hint = ""
        if existing_folders:
            folders_list = ", ".join(f'"{f}"' for f in existing_folders[:20])
            folders_hint = f"""
IMPORTANT: These folders already exist: [{folders_list}]
If the content belongs to one of these existing folders, USE THAT EXACT NAME.
Only suggest a new folder name if none of the existing folders match the subject.
"""

        prompt = f"""Based on this academic content, suggest:
1. folder: The course/subject name (e.g. "Computer Networks", "أمن معلومات")
2. deck: The specific topic/chapter name (e.g. "Chapter 5 - Firewalls", "الفصل 3 - التشفير")
{folders_hint}
Respond ONLY with JSON, no other text:
{{"folder": "...", "deck": "..."}}

Content:
""" + content_sample[:3000]

        try:
            provider = use_provider or self.provider
            model = use_model or self.model

            if provider == "gemini":
                raw = self._process_gemini(prompt, model)
            elif provider == "openrouter":
                raw = self._process_openrouter(prompt, model)
            else:
                raw = self._process_openai(prompt, model)

            # تنظيف النتيجة واستخراج JSON
            raw = raw.strip()
            # إزالة ```json ... ``` لو موجودة
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1]
                raw = raw.rsplit("```", 1)[0]
            raw = raw.strip()

            data = _json.loads(raw)
            return {
                "folder": str(data.get("folder", "")).strip(),
                "deck": str(data.get("deck", "")).strip(),
            }
        except Exception:
            return {"folder": "", "deck": ""}

    def _process_gemini(self, prompt: str, model: str = None, images: list = None) -> str:
        """معالجة باستخدام Google Gemini مع دعم الرؤية للمخططات والصور."""
        use_model = model or self.model
        # إعادة التهيئة إذا تغيّر الموديل
        if not self._gemini_client or (hasattr(self, '_gemini_model_name') and self._gemini_model_name != use_model):
            self._init_gemini(use_model)
            self._gemini_model_name = use_model

        try:
            # إذا وُجدت صور أو مخططات، يتم إرسالها مع الـ prompt مباشرة لـ Gemini
            if images:
                contents = list(images) + [prompt]
            else:
                contents = prompt

            response = self._gemini_client.generate_content(
                contents,
                generation_config={
                    "temperature": 0.3,
                    "max_output_tokens": 8192,
                }
            )
            return response.text
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                raise RuntimeError(
                    "تم تجاوز حد الاستخدام (Rate Limit). انتظر دقيقة وحاول مرة أخرى."
                ) from e
            raise RuntimeError(f"خطأ من Gemini API: {error_msg}") from e

    def _process_openai(self, prompt: str, model: str = None, images: list = None) -> str:
        """معالجة باستخدام OpenAI مع دعم الصور والمخططات لنماذج GPT-4o."""
        import base64
        import io

        if not self._openai_client:
            self._init_openai()

        use_model = model or self.model

        # إعداد محتوى المستخدم (نص + صور بصيغة base64 إن وُجدت)
        if images:
            user_content = [{"type": "text", "text": prompt}]
            for img in images:
                try:
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=85)
                    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
                    user_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64_str}"}
                    })
                except Exception as img_err:
                    print(f"⚠️ خطأ في تحويل صورة لـ OpenAI: {img_err}")
        else:
            user_content = prompt

        try:
            kwargs = dict(
                model=use_model,
                messages=[
                    {
                        "role": "system",
                        "content": "أنت مساعد تعليمي متخصص في تحويل المحتوى الأكاديمي إلى مواد دراسية منظمة ومراجعة الرسوم التوضيحية والمخططات بدقة. اتبع التعليمات بدقة."
                    },
                    {
                        "role": "user",
                        "content": user_content,
                    }
                ],
                temperature=0.3,
            )
            # نماذج GPT-5.x تتطلب max_completion_tokens بدلاً من max_tokens
            try:
                kwargs["max_completion_tokens"] = 8192
                response = self._openai_client.chat.completions.create(**kwargs)
            except Exception as e:
                if "max_completion_tokens" in str(e) or "max_tokens" in str(e):
                    kwargs.pop("max_completion_tokens", None)
                    kwargs["max_tokens"] = 8192
                    response = self._openai_client.chat.completions.create(**kwargs)
                else:
                    raise
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate" in error_msg.lower():
                raise RuntimeError(
                    "تم تجاوز حد الاستخدام (Rate Limit). انتظر دقيقة وحاول مرة أخرى."
                ) from e
            raise RuntimeError(f"خطأ من OpenAI API: {error_msg}") from e

    def _process_openrouter(self, prompt: str, model: str = None, images: list = None) -> str:
        """معالجة باستخدام OpenRouter مع دعم الرؤية والنصوص لكافة النماذج."""
        import base64
        import io

        if not self._openrouter_client:
            self._init_openrouter()

        use_model = model or self.model

        if images:
            user_content = [{"type": "text", "text": prompt}]
            for img in images:
                try:
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=85)
                    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
                    user_content.append({
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64_str}"}
                    })
                except Exception as img_err:
                    print(f"⚠️ خطأ في تحويل صورة لـ OpenRouter: {img_err}")
        else:
            user_content = prompt

        try:
            kwargs = dict(
                model=use_model,
                messages=[
                    {
                        "role": "system",
                        "content": "أنت مساعد تعليمي متخصص في تحويل المحتوى الأكاديمي إلى مواد دراسية منظمة ومراجعة الرسوم التوضيحية والمخططات بدقة. اتبع التعليمات بدقة."
                    },
                    {
                        "role": "user",
                        "content": user_content,
                    }
                ],
                temperature=0.3,
            )
            try:
                kwargs["max_tokens"] = 8192
                response = self._openrouter_client.chat.completions.create(**kwargs)
            except Exception as e:
                if "max_tokens" in str(e):
                    kwargs.pop("max_tokens", None)
                    response = self._openrouter_client.chat.completions.create(**kwargs)
                else:
                    raise
            return response.choices[0].message.content
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate" in error_msg.lower() or "quota" in error_msg.lower():
                raise RuntimeError(
                    "تم تجاوز حد الاستخدام (Rate Limit / Quota) في OpenRouter. يرجى الانتظار قليلاً أو التحقق من الرصيد."
                ) from e
            raise RuntimeError(f"خطأ من OpenRouter API: {error_msg}") from e

    def process_all_three(self, pages: list, prompts: dict = None,
                           model_overrides: dict = None,
                           progress_callback=None) -> dict:
        """
        تشغيل الـ 3 prompts على المحتوى مع سلسلة اعتماد:
        - Prompt 1: يشتغل على محتوى PDF الأصلي
        - Prompt 2: يشتغل على نتيجة Prompt 1
        - Prompt 3: يشتغل على نتيجة Prompt 2

        Args:
            pages: قائمة الصفحات [{"page_number": N, "text": "..."}]
            prompts: قاموس prompts مخصصة (اختياري)
            model_overrides: موديل مخصص لكل prompt
                الصيغة: {"prompt_1": "provider:model", "prompt_2": ..., "prompt_3": ...}
                مثال: {"prompt_1": "gemini:gemini-2.0-flash", "prompt_2": "openai:gpt-4o"}
                إذا فارغ يستخدم الافتراضي
            progress_callback: دالة callback(step, total, message)

        Returns:
            قاموس فيه: translation, simplified, flashcards
        """
        results = {}
        model_overrides = model_overrides or {}

        p1 = prompts.get("prompt_1", PROMPT_1_TRANSLATION) if prompts else PROMPT_1_TRANSLATION
        p2 = prompts.get("prompt_2", PROMPT_2_SIMPLIFIED) if prompts else PROMPT_2_SIMPLIFIED
        p3 = prompts.get("prompt_3", PROMPT_3_FLASHCARDS) if prompts else PROMPT_3_FLASHCARDS

        def _parse_model_override(key: str):
            """تحليل الموديل المخصص: 'provider:model' -> (provider, model)"""
            val = model_overrides.get(key, "").strip()
            if val and ":" in val:
                p, m = val.split(":", 1)
                return p.strip(), m.strip()
            return None, None

        # ============================================================
        # Prompt 1: الترجمة — يشتغل على محتوى PDF الأصلي
        # ============================================================
        prov1, mod1 = _parse_model_override("prompt_1")
        model_label_1 = f" [{prov1}:{mod1}]" if prov1 else ""

        if progress_callback:
            progress_callback(1, 6, f"جاري إنشاء: الترجمة مع التنسيق{model_label_1}...")

        results["translation"] = self.process_chunked(
            pages, p1, use_provider=prov1, use_model=mod1,
            progress_callback=lambda c, t, m: progress_callback(1, 6, f"الترجمة{model_label_1}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ============================================================
        # Prompt 2: التبسيط — يشتغل على نتيجة Prompt 1
        # ============================================================
        prov2, mod2 = _parse_model_override("prompt_2")
        model_label_2 = f" [{prov2}:{mod2}]" if prov2 else ""

        if progress_callback:
            progress_callback(3, 6, f"جاري إنشاء: التبسيط والشرح{model_label_2} (معتمد على الترجمة)...")

        results["simplified"] = self.process_text_chunked(
            results["translation"], p2, use_provider=prov2, use_model=mod2,
            progress_callback=lambda c, t, m: progress_callback(3, 6, f"التبسيط{model_label_2}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ============================================================
        # Prompt 3: فلاش كارد — يشتغل على نتيجة Prompt 2
        # (مستثنى من قاعدة الـ 10 صفحات — يرسل كل المحتوى مرة واحدة)
        # ============================================================
        prov3, mod3 = _parse_model_override("prompt_3")
        model_label_3 = f" [{prov3}:{mod3}]" if prov3 else ""

        if progress_callback:
            progress_callback(5, 6, f"جاري إنشاء: بطاقات الفلاش كارد{model_label_3} (معتمد على التبسيط)...")

        results["flashcards"] = self.process(
            results["simplified"], p3, use_provider=prov3, use_model=mod3
        )

        if progress_callback:
            progress_callback(6, 6, "تم!")

        return results
