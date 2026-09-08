"""
معالجة واستخراج عروض PowerPoint التقديمية (.pptx / .ppt)
======================================================
يدعم:
1. تحويل PPTX/PPT إلى PDF عالي الدقة عبر PowerPoint COM (على Windows).
2. استخراج مباشر للنصوص والجداول والملاحظات والصور عبر مكتبة python-pptx (كخيار مستقل/احتياطي).
"""

import os
import sys
import io
import tempfile
import subprocess
from typing import List, Dict, Optional
from PIL import Image

try:
    from pptx import Presentation
    from pptx.enum.shapes import MSO_SHAPE_TYPE
    PPTX_LIB_AVAILABLE = True
except ImportError:
    PPTX_LIB_AVAILABLE = False


def is_powerpoint_file(file_path: str) -> bool:
    """التحقق مما إذا كان الملف عرضاً تقديمياً لـ PowerPoint."""
    ext = os.path.splitext(file_path)[1].lower()
    return ext in [".pptx", ".ppt"]


def convert_pptx_to_pdf(pptx_path: str, output_pdf_path: Optional[str] = None) -> Optional[str]:
    """
    تحويل ملف PowerPoint إلى PDF باستخدام PowerPoint COM على Windows.
    يضمن الحفاظ بنسبة 100% على التنسيقات، المعادلات، الخطوط، والصور.
    """
    if not os.path.exists(pptx_path):
        raise FileNotFoundError(f"ملف PowerPoint غير موجود: {pptx_path}")

    abs_pptx = os.path.abspath(pptx_path)
    if not output_pdf_path:
        base, _ = os.path.splitext(abs_pptx)
        output_pdf_path = f"{base}_converted.pdf"
    abs_pdf = os.path.abspath(output_pdf_path)

    # تشغيل PowerShell لتحويل PPTX إلى PDF عبر COM
    ps_cmd = f"""
    $ErrorActionPreference = 'Stop'
    try {{
        $ppt = New-Object -ComObject PowerPoint.Application
        $pres = $ppt.Presentations.Open('{abs_pptx}', 0, 0, 0)
        $pres.SaveAs('{abs_pdf}', 32)
        $pres.Close()
        $ppt.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
        exit 0
    }} catch {{
        Write-Error $_.Exception.Message
        exit 1
    }}
    """
    try:
        res = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_cmd],
            capture_output=True,
            text=True,
            timeout=40,
        )
        if res.returncode == 0 and os.path.exists(abs_pdf) and os.path.getsize(abs_pdf) > 0:
            return abs_pdf
    except Exception as e:
        print(f"⚠️ فشل التحويل عبر PowerPoint COM: {e}")

    return None


def extract_text_and_visuals_from_pptx(pptx_path: str, max_image_dimension: int = 1200) -> List[Dict]:
    """
    استخراج محتوى PowerPoint مباشرة (نصوص + أشكال + جداول + ملاحظات + صور)
    باستخدام مكتبة python-pptx دون الحاجة لبرنامج خارجي.
    """
    if not PPTX_LIB_AVAILABLE:
        raise ImportError("مكتبة python-pptx غير مثبتة. يرجى تثبيتها عبر: pip install python-pptx")

    prs = Presentation(pptx_path)
    slides = []

    for slide_idx, slide in enumerate(prs.slides, start=1):
        slide_text_parts = []
        slide_images = []

        # 1. استخراج عنوان السلايد إن وجد
        if slide.shapes.title and slide.shapes.title.text:
            title_text = slide.shapes.title.text.strip()
            if title_text:
                slide_text_parts.append(f"Title: {title_text}")

        # 2. استخراج جميع النصوص والأشكال والجداول والصور
        for shape in slide.shapes:
            # تجاهل العنوان لأنه أُضيف مسبقاً
            if shape == slide.shapes.title:
                continue

            # استخراج نصوص الأشكال
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    p_text = paragraph.text.strip()
                    if p_text and p_text not in slide_text_parts:
                        slide_text_parts.append(p_text)

            # استخراج محتوى الجداول
            if shape.has_table:
                table_lines = []
                for row in shape.table.rows:
                    row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                    table_lines.append(" | ".join(row_cells))
                if table_lines:
                    slide_text_parts.append("\n[جدول / Table]:\n" + "\n".join(table_lines))

            # استخراج الصور المضمنة
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                try:
                    image_bytes = shape.image.blob
                    pil_img = Image.open(io.BytesIO(image_bytes))
                    if pil_img.mode != "RGB":
                        pil_img = pil_img.convert("RGB")
                    if max(pil_img.size) > max_image_dimension:
                        pil_img.thumbnail((max_image_dimension, max_image_dimension), Image.Resampling.LANCZOS)
                    slide_images.append(pil_img)
                except Exception as img_err:
                    print(f"⚠️ تعذر استخراج صورة في سلايد {slide_idx}: {img_err}")

        # 3. استخراج ملاحظات المحاضر (Speaker Notes)
        if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
            notes_text = slide.notes_slide.notes_text_frame.text.strip()
            if notes_text:
                slide_text_parts.append(f"[ملاحظات الشرح / Notes]: {notes_text}")

        full_slide_text = "\n".join(slide_text_parts).strip()

        slides.append({
            "page_number": slide_idx,
            "text": full_slide_text,
            "images": slide_images,
            "has_visuals": len(slide_images) > 0,
        })

    return slides


def get_pptx_info(pptx_path: str) -> Dict:
    """معلومات أساسية عن ملف PowerPoint."""
    file_size = os.path.getsize(pptx_path) / (1024 * 1024)
    total_slides = 0

    if PPTX_LIB_AVAILABLE:
        try:
            prs = Presentation(pptx_path)
            total_slides = len(prs.slides)
        except Exception:
            pass

    return {
        "filename": os.path.basename(pptx_path),
        "total_pages": total_slides,
        "file_size_mb": round(file_size, 2),
        "is_powerpoint": True,
    }
