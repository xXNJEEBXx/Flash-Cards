"""
استخراج المحتوى من ملفات PDF (نصوص + صور ومخططات)
===================================================
يستخرج النص والمخططات التوضيحية من كل صفحة (سلايد) على حدة.
يدعم الرؤية الحاسوبية (Multimodal Vision) بنقل المخططات والصور لـ Gemini و OpenAI.
"""

import os
import io
from typing import List, Dict, Optional
from PIL import Image

# استخدام pymupdf للسرعة الفائقة واستخراج الصور بدقة
try:
    import pymupdf as fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    try:
        import fitz
        PYMUPDF_AVAILABLE = True
    except ImportError:
        PYMUPDF_AVAILABLE = False

import pdfplumber


def extract_text_from_pdf(pdf_path: str, extract_visuals: bool = True, max_image_dimension: int = 1200) -> List[Dict]:
    """
    استخراج النص والمخططات/الصور من ملف PDF صفحة بصفحة (سلايد بسلايد).

    Args:
        pdf_path: المسار الكامل لملف PDF
        extract_visuals: تفعيل التقاط الرسوم التوضيحية والمخططات للنماذج البصرية (مثل Gemini)
        max_image_dimension: الحد الأقصى لأبعاد الصورة للتحسين قبل الإرسال للـ API

    Returns:
        قائمة من القواميس، كل قاموس يحتوي على:
        - page_number: رقم الصفحة
        - text: النص المستخرج
        - images: قائمة صور PIL (إن وجدت مخططات أو صور في السلايد)
        - has_visuals: هل يحتوي السلايد على رسوم/صور
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"الملف غير موجود: {pdf_path}")

    pages = []

    # إذا كانت pymupdf متوفرة نستخدمها لقدرتها العالية على قراءة النصوص والصور
    if PYMUPDF_AVAILABLE:
        doc = fitz.open(pdf_path)
        for i, page in enumerate(doc, start=1):
            text = page.get_text("text").strip()
            slide_images = []

            if extract_visuals:
                # فحص ما إذا كان السلايد يحتوي على صور أو رسوم بيانية
                raw_images = page.get_images(full=True)
                has_embedded_images = len(raw_images) > 0
                has_few_text = len(text) < 60  # سلايد قد يكون عبارة عن رسمة أو مخطط بالكامل

                if has_embedded_images or has_few_text:
                    try:
                        # تصيير لقطة عالية الوضوح للسلايد
                        pix = page.get_pixmap(dpi=130)
                        img_bytes = pix.tobytes("jpeg")
                        pil_img = Image.open(io.BytesIO(img_bytes))
                        if pil_img.mode != "RGB":
                            pil_img = pil_img.convert("RGB")
                        if max(pil_img.size) > max_image_dimension:
                            pil_img.thumbnail((max_image_dimension, max_image_dimension), Image.Resampling.LANCZOS)
                        slide_images.append(pil_img)
                    except Exception as err:
                        print(f"⚠️ تعذر تصيير سلايد {i}: {err}")

            if text or slide_images:
                pages.append({
                    "page_number": i,
                    "text": text,
                    "images": slide_images,
                    "has_visuals": len(slide_images) > 0,
                })
        doc.close()
    else:
        # البديل عبر pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = text.strip()
                if text:
                    pages.append({
                        "page_number": i,
                        "text": text,
                        "images": [],
                        "has_visuals": False,
                    })

    if not pages:
        raise ValueError("لم يتم العثور على محتوى في ملف PDF. تأكد أن الملف سليم ويحتوي على صفحات قابلة للقراءة.")

    return pages


def format_pages_for_prompt(pages: List[Dict]) -> str:
    """
    تحويل الصفحات المستخرجة إلى نص واحد منسق للإرسال إلى AI.

    Args:
        pages: قائمة الصفحات المستخرجة

    Returns:
        نص منسق فيه كل سلايد مرقم
    """
    formatted_parts = []

    for page in pages:
        visual_tag = " [يتضمن رسماً توضيحياً / Diagram Included]" if page.get("has_visuals") else ""
        formatted_parts.append(
            f"=== Slide {page['page_number']}{visual_tag} ===\n"
            f"{page.get('text', '')}\n"
        )

    return "\n".join(formatted_parts)


def get_pdf_info(pdf_path: str) -> Dict:
    """
    معلومات أساسية عن ملف PDF.

    Returns:
        قاموس فيه: filename, total_pages, file_size_mb
    """
    file_size = os.path.getsize(pdf_path) / (1024 * 1024)  # MB

    if PYMUPDF_AVAILABLE:
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        doc.close()
    else:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)

    return {
        "filename": os.path.basename(pdf_path),
        "total_pages": total_pages,
        "file_size_mb": round(file_size, 2),
    }
