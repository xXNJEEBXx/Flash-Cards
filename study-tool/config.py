"""
إعدادات البرنامج - PDF Study Tool
=================================
إدارة المفاتيح، الموديلات، وقائمة النماذج المدعومة لـ Gemini و OpenAI و OpenRouter.
"""

import json
import os

# ============================================================
# مسار ملف الإعدادات (يُحفظ بجانب البرنامج)
# ============================================================
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "settings.json")

# ============================================================
# قائمة النماذج الجاهزة والموصى بها
# ============================================================
AVAILABLE_MODELS = {
    "gemini": [
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "desc": "سريع، ذكي، ومجاني (موصى به)", "vision": True},
        {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash-Lite", "desc": "أسرع استجابة واقتصادي", "vision": True},
        {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "desc": "فائق الذكاء للأكاديمي المعقد", "vision": True},
        {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "desc": "مستقر وسريع للملفات الكبيرة", "vision": True},
    ],
    "openai": [
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "desc": "اقتصادي وسريع وممتاز للتلخيص", "vision": True},
        {"id": "gpt-4o", "name": "GPT-4o", "desc": "النموذج الرائد عالي الذكاء", "vision": True},
        {"id": "o3-mini", "name": "o3-mini", "desc": "استنتاج وتفكير منطقي متقدم", "vision": False},
        {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "desc": "النموذج القوي التقليدي", "vision": True},
    ],
    "openrouter": [
        {"id": "google/gemini-2.0-flash-001", "name": "Gemini 2.0 Flash (OpenRouter)", "desc": "عبر بوابة OpenRouter", "vision": True},
        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet (OpenRouter)", "desc": "أعلى جودة لغوية وتحليلية", "vision": True},
        {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini (OpenRouter)", "desc": "سريع واقتصادي", "vision": True},
        {"id": "deepseek/deepseek-r1", "name": "DeepSeek R1 (OpenRouter)", "desc": "تفكير منطقي استثنائي", "vision": False},
    ]
}

# ============================================================
# الإعدادات الافتراضية
# ============================================================
DEFAULT_CONFIG = {
    # المزود الافتراضي العام: "gemini" أو "openai" أو "openrouter"
    "provider": "gemini",

    # مفتاح وموديل Google Gemini
    "gemini_api_key": "",
    "gemini_model": "gemini-2.0-flash",

    # مفتاح وموديل OpenAI
    "openai_api_key": "",
    "openai_model": "gpt-4o-mini",

    # مفتاح وموديل OpenRouter
    "openrouter_api_key": "",
    "openrouter_model": "google/gemini-2.0-flash-001",

    # موديل مخصص لكل مهمة (اختياري — إذا فارغ يستخدم الافتراضي)
    # يدعم الاختيار من القائمة أو كتابة اسم الموديل مباشرة
    "prompt_1_model": "",
    "prompt_2_model": "",
    "prompt_3_model": "",

    # اسم المجلد الناتج ({name} = اسم ملف PDF)
    "output_folder_template": "{name}_study",

    # أسماء ملفات Word الناتجة
    "file1_name": "01_Translation.docx",
    "file2_name": "02_Simplified.docx",
    "file3_name": "03_FlashCards.docx",

    # تصدير فلاش كاردز تلقائياً
    "flashcard_export_enabled": False,
}


def load_config() -> dict:
    """تحميل الإعدادات من الملف، أو إنشاء ملف افتراضي."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
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


def get_provider_display_name(provider: str) -> str:
    """اسم المزود بالعرض الجميل."""
    names = {
        "gemini": "Google Gemini",
        "openai": "OpenAI",
        "openrouter": "OpenRouter",
    }
    return names.get(provider.lower(), provider)


def detect_provider(model_str: str, default: str = "gemini") -> str:
    """اكتشاف المزود تلقائياً من اسم الموديل أو التسمية."""
    if not model_str:
        return default
    m = model_str.strip().lower()
    if m.startswith("gemini:") or m.startswith("[gemini]"):
        return "gemini"
    if m.startswith("openai:") or m.startswith("[openai]"):
        return "openai"
    if m.startswith("openrouter:") or m.startswith("[openrouter]"):
        return "openrouter"
    if "/" in m:
        return "openrouter"
    if m.startswith("gemini-") or "gemini" in m:
        return "gemini"
    if m.startswith("gpt-") or m.startswith("o1") or m.startswith("o3"):
        return "openai"
    if "claude" in m or "deepseek" in m or "llama" in m or "qwen" in m:
        return "openrouter"
    return default


def clean_model_id(model_str: str) -> str:
    """استخراج المعرف النظيف للموديل من أي تسمية أو خيار في القائمة."""
    if not model_str:
        return ""
    val = model_str.strip()
    if "⭐" in val or "الافتراضي" in val or "default" in val.lower():
        return ""
    if val.startswith("[") and "]" in val:
        val = val.split("]", 1)[1].strip()
    if ":" in val and not "/" in val.split(":", 1)[0]:
        val = val.split(":", 1)[1].strip()
    if " - " in val:
        val = val.split(" - ", 1)[0].strip()
    return val


def get_model_combobox_list(include_default: bool = True, provider_filter: str = None) -> list:
    """توليد قائمة خيارات جاهزة ومنسقة لـ ttk.Combobox."""
    options = []
    if include_default:
        options.append("⭐ الافتراضي (حسب إعدادات المزود العام)")

    providers = [provider_filter] if provider_filter else ["gemini", "openai", "openrouter"]
    for prov in providers:
        tag = prov.capitalize()
        for item in AVAILABLE_MODELS.get(prov, []):
            options.append(f"[{tag}] {item['id']} - {item['desc']}")
    return options


def parse_model_choice(choice_str: str, default_provider: str = "gemini", default_model: str = None) -> tuple:
    """
    تحليل خيار الموديل سواء اختاره المستخدم من القائمة أو كتبه يدوياً.
    يرجع (provider, model_id)
    """
    if not choice_str or "⭐" in choice_str or "الافتراضي" in choice_str:
        return default_provider, default_model or "gemini-2.0-flash"

    clean_id = clean_model_id(choice_str)
    if not clean_id:
        return default_provider, default_model or "gemini-2.0-flash"

    provider = detect_provider(choice_str, default=default_provider)
    return provider, clean_id


def resolve_effective_model(config: dict, prompt_key: str) -> tuple:
    """
    تحديد الموديل والمزود الفعلي لمهمة معينة، والتحقق من توفر المفتاح.
    prompt_key: "prompt_1", "prompt_2", "prompt_3"
    Returns: (provider: str, model_id: str, is_custom: bool, has_key: bool)
    """
    custom_val = config.get(f"{prompt_key}_model", "").strip()
    default_prov = config.get("provider", "gemini")

    if custom_val and "الافتراضي" not in custom_val and "⭐" not in custom_val:
        prov, model = parse_model_choice(custom_val, default_provider=default_prov)
        is_custom = True
    else:
        prov = default_prov
        model = get_model(config)
        is_custom = False

    key = config.get(f"{prov}_api_key", "").strip()
    has_key = bool(key)
    return prov, model, is_custom, has_key


def find_combobox_display_value(model_str: str, include_default: bool = True, provider_filter: str = None) -> str:
    """
    إيجاد النص المعروض في Combobox المطابق لقيمة محفوظة،
    أو إرجاع القيمة المخصصة إذا لم تكن ضمن النماذج الجاهزة.
    """
    if not model_str or "⭐" in model_str or "الافتراضي" in model_str or "default" in model_str.lower():
        return "⭐ الافتراضي (حسب إعدادات المزود العام)" if include_default else ""

    clean_id = clean_model_id(model_str)
    if not clean_id:
        return "⭐ الافتراضي (حسب إعدادات المزود العام)" if include_default else ""

    providers = [provider_filter] if provider_filter else ["gemini", "openai", "openrouter"]
    for prov in providers:
        tag = prov.capitalize()
        for item in AVAILABLE_MODELS.get(prov, []):
            if item["id"].lower() == clean_id.lower():
                return f"[{tag}] {item['id']} - {item['desc']}"

    # إذا لم يطابق نموذجاً مسجلاً، يُرجع كنموذج مخصص
    return model_str
