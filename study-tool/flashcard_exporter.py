"""
Flash Cards Exporter - PDF Study Tool
======================================
تصدير بطاقات الفلاش كارد إلى تطبيق Flash Cards.
يُستدعى تلقائياً بعد انتهاء معالجة AI.
"""

import re
import time
import requests
from typing import Optional, List, Dict

# ============================================================
# إعدادات API
# ============================================================
BASE_URL = "https://flash-cards-production-e52d.up.railway.app/api"
REQUEST_TIMEOUT = 30  # ثانية
MAX_RETRIES = 3       # عدد المحاولات لكل طلب
RETRY_DELAY = 2       # ثواني انتظار بين المحاولات


def _api_request(method: str, url: str, **kwargs) -> requests.Response:
    """
    طلب API مع إعادة محاولة تلقائية.
    Railway أحياناً يفشل أول مرة ويشتغل بالثانية.
    """
    kwargs.setdefault("timeout", REQUEST_TIMEOUT)
    last_error = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.request(method, url, **kwargs)
            # لو رجع 5xx (خطأ سيرفر) نعيد المحاولة
            if response.status_code >= 500 and attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
                continue
            return response
        except (requests.ConnectionError, requests.Timeout) as e:
            last_error = e
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            continue
        except Exception as e:
            raise e

    raise requests.ConnectionError(
        f"فشل الاتصال بعد {MAX_RETRIES} محاولات: {last_error}"
    )


# ============================================================
# Parser — تحليل نص الفلاش كاردز الناتج من AI
# ============================================================
def parse_flashcards(text: str) -> List[Dict[str, str]]:
    """
    تحليل نص الفلاش كاردز إلى قائمة بطاقات.
    يدعم عدة صيغ AI مختلفة.

    Returns:
        [{"front": "...", "back": "..."}, ...]
    """
    cards = []

    # ── الطريقة 1: البحث عن كل أزواج Front/Back في النص مباشرة ──
    # هذا أقوى من تقسيم النص لأنه يتجاهل شكل الترقيم
    front_back_pattern = re.compile(
        r'(?:\*\*)?Front\s*(?:\(?\s*الوجه\s*\)?)?\s*:?\s*(?:\*\*)?\s*'
        r'(.+?)'
        r'(?:\*\*)?Back\s*(?:\(?\s*الخلف\s*\)?)?\s*:?\s*(?:\*\*)?\s*'
        r'(.+?)(?=(?:\*\*)?Front\s*(?:\(?\s*الوجه)?|(?:#|\*\*)?(?:بطاقة|Card)\s*\d|\d+[\.\)]\s*(?:\*\*)?Front|\Z)',
        re.DOTALL | re.IGNORECASE
    )

    matches = front_back_pattern.findall(text)
    for front, back in matches:
        f = re.sub(r'\n{2,}', '\n', front).strip()
        b = re.sub(r'\n{2,}', '\n', back).strip()
        # تنظيف علامات markdown المتبقية
        f = re.sub(r'^\*\*|\*\*$', '', f).strip()
        b = re.sub(r'^\*\*|\*\*$', '', b).strip()
        if f and b:
            cards.append({"front": f, "back": b})

    if cards:
        return cards

    # ── الطريقة 2: تقسيم حسب بداية البطاقات ثم البحث داخلها ──
    card_blocks = re.split(
        r'(?:#{1,3}\s*)?(?:\*\*)?(?:بطاقة|Card)\s*\d+\s*(?:\*\*)?(?:\([^)]*\))?\s*:?',
        text,
        flags=re.IGNORECASE
    )
    # أيضاً جرب تقسيم بالأرقام: 1. / 1) / **1.**
    if len(card_blocks) <= 1:
        card_blocks = re.split(
            r'\n\s*(?:\*\*)?(\d+)[\.\)](?:\*\*)?\s+',
            text,
        )

    for block in card_blocks:
        block = block.strip()
        if not block:
            continue

        front_match = re.search(
            r'(?:\*\*)?Front\s*(?:\(?\s*الوجه\s*\)?)?\s*:?\s*(?:\*\*)?\s*(.+?)(?=(?:\*\*)?Back\s*(?:\(?\s*الخلف)?)',
            block, re.DOTALL | re.IGNORECASE
        )
        back_match = re.search(
            r'(?:\*\*)?Back\s*(?:\(?\s*الخلف\s*\)?)?\s*:?\s*(?:\*\*)?\s*(.+)',
            block, re.DOTALL | re.IGNORECASE
        )

        if front_match and back_match:
            front = re.sub(r'^\*\*|\*\*$', '', front_match.group(1)).strip()
            back = re.sub(r'^\*\*|\*\*$', '', back_match.group(1)).strip()
            front = re.sub(r'\n{2,}', '\n', front).strip()
            back = re.sub(r'\n{2,}', '\n', back).strip()
            if front and back:
                cards.append({"front": front, "back": back})

    if cards:
        return cards

    # ── الطريقة 3: Fallback — أنماط أخرى ──
    return _parse_fallback(text)


def _parse_fallback(text: str) -> List[Dict[str, str]]:
    """طريقة بديلة لتحليل البطاقات."""
    cards = []

    # Pattern: **Front:** ... **Back:** ...
    pairs = re.findall(
        r'\*\*(?:Front|السؤال|الوجه)[:\s]*\*\*\s*(.+?)\s*'
        r'\*\*(?:Back|الجواب|الخلف)[:\s]*\*\*\s*(.+?)(?=\*\*(?:Front|السؤال|الوجه)|\Z)',
        text, re.DOTALL | re.IGNORECASE
    )
    for front, back in pairs:
        f, b = front.strip(), back.strip()
        if f and b:
            cards.append({"front": f, "back": b})

    if cards:
        return cards

    # Pattern: Q: ... A: ...
    pairs = re.findall(
        r'(?:Q|السؤال)\s*:\s*(.+?)\s*(?:A|الجواب)\s*:\s*(.+?)(?=(?:Q|السؤال)\s*:|\Z)',
        text, re.DOTALL | re.IGNORECASE
    )
    for front, back in pairs:
        f, b = front.strip(), back.strip()
        if f and b:
            cards.append({"front": f, "back": b})

    return cards


# ============================================================
# API Functions
# ============================================================
def get_existing_folders() -> List[str]:
    """
    جلب أسماء المجلدات الموجودة.

    Returns:
        قائمة أسماء المجلدات
    """
    try:
        response = _api_request("GET", f"{BASE_URL}/folders")
        if response.ok:
            data = response.json()
            folders = data.get("data", data) if isinstance(data, dict) else data
            if isinstance(folders, list):
                return [f.get("name") for f in folders if f.get("name")]
    except Exception:
        pass
    return []


def get_or_create_folder(folder_name: str) -> Optional[str]:
    """
    البحث عن مجلد بالاسم، أو إنشاء واحد جديد.

    Returns:
        folder_id أو None
    """
    try:
        # البحث في المجلدات الموجودة
        response = _api_request("GET", f"{BASE_URL}/folders")
        if response.ok:
            data = response.json()
            folders = data.get("data", data) if isinstance(data, dict) else data
            if isinstance(folders, list):
                for f in folders:
                    if f.get("name") == folder_name:
                        return f.get("id")

        # إنشاء مجلد جديد
        response = _api_request(
            "POST", f"{BASE_URL}/folders",
            json={"name": folder_name},
        )
        if response.ok:
            data = response.json()
            result = data.get("data", data) if isinstance(data, dict) else data
            if isinstance(result, dict):
                return result.get("id")

    except Exception as e:
        print(f"⚠️ خطأ في المجلدات: {e}")

    return None


def create_deck(title: str, description: str = "") -> Optional[str]:
    """
    إنشاء مجموعة بطاقات جديدة.

    Returns:
        deck_id أو None
    """
    try:
        payload = {"title": title}
        if description:
            payload["description"] = description

        response = _api_request(
            "POST", f"{BASE_URL}/decks",
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        result = data.get("data", data) if isinstance(data, dict) else data
        return result.get("id") if isinstance(result, dict) else None

    except Exception as e:
        raise RuntimeError(f"فشل إنشاء المجموعة: {e}") from e


def move_deck_to_folder(folder_id: str, deck_id: str) -> bool:
    """نقل مجموعة إلى مجلد."""
    try:
        response = _api_request(
            "POST", f"{BASE_URL}/folders/{folder_id}/move-deck",
            json={"deck_id": deck_id},
        )
        return response.ok
    except Exception:
        return False


def add_card(deck_id: str, question: str, answer: str) -> bool:
    """إضافة بطاقة إلى مجموعة."""
    try:
        response = _api_request(
            "POST", f"{BASE_URL}/decks/{deck_id}/cards",
            json={"question": question, "answer": answer},
        )
        return response.ok
    except Exception:
        return False


# ============================================================
# الدالة الرئيسية
# ============================================================
def export_to_flashcards(
    flashcards_text: str,
    deck_name: str,
    folder: str,
    description: str = "",
    progress_callback=None,
) -> dict:
    """
    تصدير الفلاش كاردز إلى تطبيق Flash Cards.

    Args:
        flashcards_text: النص الناتج من AI (Prompt 3)
        deck_name: اسم المجموعة
        folder: اسم المجلد (يُنشأ تلقائياً لو ما موجود)
        description: وصف المجموعة (اختياري)
        progress_callback: callback(message) للتحديثات

    Returns:
        {"success": bool, "deck_id": str, "cards_count": int, "errors": [str]}
    """
    result = {
        "success": False,
        "deck_id": None,
        "cards_count": 0,
        "errors": [],
    }

    def _log(msg):
        if progress_callback:
            progress_callback(msg)

    # ── 1. تحليل البطاقات ──
    _log("🔍 جاري تحليل بطاقات الفلاش كارد...")
    cards = parse_flashcards(flashcards_text)

    if not cards:
        result["errors"].append("لم يتم العثور على بطاقات في النص")
        _log("❌ لم يتم العثور على بطاقات")
        return result

    _log(f"📋 تم العثور على {len(cards)} بطاقة")

    # ── 2. إنشاء/إيجاد المجلد ──
    _log(f"📁 جاري تجهيز المجلد: {folder}...")
    folder_id = get_or_create_folder(folder)
    if folder_id:
        _log(f"✅ المجلد جاهز (ID: {folder_id})")
    else:
        _log("⚠️ فشل إنشاء المجلد — سيتم إنشاء المجموعة بدون مجلد")
        result["errors"].append("فشل إنشاء/إيجاد المجلد")

    # ── 3. إنشاء المجموعة ──
    _log(f"🎴 جاري إنشاء المجموعة: {deck_name}...")
    try:
        deck_id = create_deck(deck_name, description)
    except RuntimeError as e:
        result["errors"].append(str(e))
        _log(f"❌ {e}")
        return result

    if not deck_id:
        result["errors"].append("فشل إنشاء المجموعة — لم يتم إرجاع ID")
        _log("❌ فشل إنشاء المجموعة")
        return result

    result["deck_id"] = deck_id
    _log(f"✅ تم إنشاء المجموعة (ID: {deck_id})")

    # ── 4. نقل المجموعة للمجلد ──
    if folder_id:
        if move_deck_to_folder(folder_id, deck_id):
            _log(f"📁 تم نقل المجموعة إلى المجلد: {folder}")
        else:
            result["errors"].append("فشل نقل المجموعة للمجلد")
            _log("⚠️ فشل نقل المجموعة للمجلد")

    # ── 5. إضافة البطاقات ──
    _log(f"🎴 جاري إضافة {len(cards)} بطاقة...")
    added = 0
    failed = 0

    for i, card in enumerate(cards, 1):
        success = add_card(deck_id, card["front"], card["back"])
        if success:
            added += 1
        else:
            failed += 1
            result["errors"].append(f"فشل إضافة البطاقة {i}")

        # تحديث كل 10 بطاقات
        if i % 10 == 0 or i == len(cards):
            _log(f"   🎴 {i}/{len(cards)} بطاقة...")

    result["cards_count"] = added
    result["success"] = added > 0

    if failed:
        _log(f"⚠️ تم إضافة {added}/{len(cards)} بطاقة ({failed} فشلت)")
    else:
        _log(f"✅ تم إضافة جميع البطاقات ({added} بطاقة)")

    return result
