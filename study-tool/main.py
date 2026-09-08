"""
PDF Study Tool - الأداة الرئيسية
================================
كلك يمين على ملف PDF → يسوي مجلد فيه 3 ملفات Word:
  1. ترجمة مع تنسيق (إنجليزي + عربي)
  2. تبسيط وشرح (الزبدة)
  3. بطاقات فلاش كارد
"""

import sys
import os
import time

from config import load_config, get_api_key, get_model, save_config
from pdf_extractor import extract_text_from_pdf, format_pages_for_prompt, get_pdf_info
from ai_processor import AIProcessor
from word_generator import generate_all_documents


def print_header():
    """طباعة رأس البرنامج."""
    print("=" * 60)
    print("   PDF Study Tool - أداة تحويل PDF إلى مواد دراسية")
    print("=" * 60)
    print()


def print_progress(step: int, total: int, message: str):
    """طباعة شريط التقدم."""
    bar_width = 30
    filled = int(bar_width * step / total)
    bar = "█" * filled + "░" * (bar_width - filled)
    print(f"\r  [{bar}] {step}/{total} - {message}", end="", flush=True)
    if step == total:
        print()  # سطر جديد بعد الاكتمال


def main():
    """نقطة الدخول الرئيسية — تفتح الواجهة التفاعلية."""
    from gui import launch_gui

    pdf_path = sys.argv[1] if len(sys.argv) > 1 else None
    launch_gui(pdf_path)


if __name__ == "__main__":
    main()
