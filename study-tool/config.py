"""
إعدادات البرنامج - PDF Study Tool
=================================
عبّي الـ API Key حقك هنا
"""

import json
import os

# ============================================================
# مسار ملف الإعدادات (يُحفظ بجانب البرنامج)
# ============================================================
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json")

# ============================================================
# الإعدادات الافتراضية
# ============================================================
DEFAULT_CONFIG = {
    # اختر المزود الافتراضي: "gemini" أو "openai"
    "provider": "gemini",

    # مفتاح Google Gemini API
    "gemini_api_key": "",

    # موديل Gemini الافتراضي
    "gemini_model": "gemini-3.7-flash",

    # مفتاح OpenAI API
    "openai_api_key": "",

    # موديل OpenAI الافتراضي
    "openai_model": "gpt-4o-mini",

    # مفتاح OpenRouter API
    "openrouter_api_key": "",

    # موديل OpenRouter الافتراضي
    "openrouter_model": "google/gemini-2.0-flash-001",

    # موديل مخصص لكل prompt (اختياري — اذا فاضي يستخدم الافتراضي)
    # الصيغة: "provider:model" مثل "gemini:gemini-2.0-flash" أو "openai:gpt-4o" أو "openrouter:anthropic/claude-3.5-sonnet"
    # أو فارغ لاستخدام الافتراضي
    "prompt_1_model": "",
    "prompt_2_model": "",
    "prompt_3_model": "",

    # اسم المجلد الناتج (يُضاف بجانب ملف PDF)
    # {name} = اسم ملف PDF بدون الامتداد
    "output_folder_template": "{name}_study",

    # أسماء ملفات Word الناتجة
    "file1_name": "01_Translation.docx",
    "file2_name": "02_Simplified.docx",
    "file3_name": "03_FlashCards.docx",

    # ── تصدير فلاش كاردز ──
    # تفعيل التصدير التلقائي لتطبيق Flash Cards
    "flashcard_export_enabled": False,
}


def load_config() -> dict:
    """تحميل الإعدادات من الملف، أو إنشاء ملف افتراضي."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            # دمج الإعدادات المحفوظة مع الافتراضية (للإعدادات الجديدة)
            merged = {**DEFAULT_CONFIG, **saved}
            return merged
        except Exception:
            return DEFAULT_CONFIG.copy()
    else:
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()


def save_config(config: dict):
    """حفظ الإعدادات في ملف JSON."""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4, ensure_ascii=False)


def get_api_key(config: dict) -> str:
    """إرجاع مفتاح API حسب المزود المختار."""
    provider = config.get("provider", "gemini")
    if provider == "gemini":
        return config.get("gemini_api_key", "")
    elif provider == "openai":
        return config.get("openai_api_key", "")
    elif provider == "openrouter":
        return config.get("openrouter_api_key", "")
    return ""


def get_model(config: dict) -> str:
    """إرجاع اسم الموديل حسب المزود المختار."""
    provider = config.get("provider", "gemini")
    if provider == "gemini":
        return config.get("gemini_model", "gemini-2.0-flash")
    elif provider == "openai":
        return config.get("openai_model", "gpt-4o-mini")
    elif provider == "openrouter":
        return config.get("openrouter_model", "google/gemini-2.0-flash-001")
    return ""
