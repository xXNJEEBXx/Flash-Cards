"""
واجهة المستخدم التفاعلية - PDF Study Tool
==========================================
واجهة رسومية لمعالجة ملفات PDF وتحويلها إلى مواد دراسية.
تدعم تعديل الـ Prompts وإعدادات AI.
"""

import os
import sys
import json
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext

# ضمان إن Python يلاقي الموديولات بجانب هذا الملف
# (مهم عند التشغيل من كلك يمين أو pythonw)
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if _SCRIPT_DIR not in sys.path:
    sys.path.insert(0, _SCRIPT_DIR)

from config import load_config, save_config, get_api_key, get_model, CONFIG_FILE
from pdf_extractor import extract_text_from_pdf, get_pdf_info
from pptx_extractor import is_powerpoint_file, convert_pptx_to_pdf, extract_text_and_visuals_from_pptx, get_pptx_info
from ai_processor import AIProcessor, PROMPT_1_TRANSLATION, PROMPT_2_SIMPLIFIED, PROMPT_3_FLASHCARDS
from word_generator import generate_all_documents
from flashcard_exporter import export_to_flashcards, get_existing_folders


# ============================================================
# ملف حفظ الـ Prompts المخصصة
# ============================================================
PROMPTS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prompts.json")

DEFAULT_PROMPTS = {
    "prompt_1": PROMPT_1_TRANSLATION,
    "prompt_2": PROMPT_2_SIMPLIFIED,
    "prompt_3": PROMPT_3_FLASHCARDS,
}


def load_prompts() -> dict:
    """تحميل الـ Prompts المحفوظة."""
    if os.path.exists(PROMPTS_FILE):
        try:
            with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
            return {**DEFAULT_PROMPTS, **saved}
        except Exception:
            return DEFAULT_PROMPTS.copy()
    return DEFAULT_PROMPTS.copy()


def save_prompts(prompts: dict):
    """حفظ الـ Prompts."""
    with open(PROMPTS_FILE, "w", encoding="utf-8") as f:
        json.dump(prompts, f, indent=2, ensure_ascii=False)


# ============================================================
# الألوان والثيم
# ============================================================
COLORS = {
    "bg": "#1e1e2e",
    "bg_secondary": "#282840",
    "bg_card": "#313150",
    "bg_input": "#3b3b5c",
    "fg": "#cdd6f4",
    "fg_dim": "#a6adc8",
    "accent": "#89b4fa",
    "accent_hover": "#74c7ec",
    "success": "#a6e3a1",
    "warning": "#f9e2af",
    "error": "#f38ba8",
    "border": "#45475a",
    "tab_active": "#89b4fa",
    "tab_inactive": "#45475a",
}


class PDFStudyToolGUI:
    """الواجهة الرئيسية للبرنامج."""

    def __init__(self, pdf_path: str = None):
        self.pdf_path = pdf_path
        self.config = load_config()
        self.prompts = load_prompts()
        self.is_processing = False
        self.pages_data = None

        self._build_window()
        self._build_ui()

        if self.pdf_path:
            self._load_pdf_info()

    # ────────────────────────────────────────
    # بناء النافذة
    # ────────────────────────────────────────
    def _build_window(self):
        """إنشاء النافذة الرئيسية."""
        self.root = tk.Tk()
        self.root.title("PDF Study Tool 📚")
        self.root.geometry("900x720")
        self.root.minsize(800, 600)
        self.root.configure(bg=COLORS["bg"])

        # أيقونة النافذة
        try:
            self.root.iconbitmap(default="")
        except Exception:
            pass

        # تمركز النافذة
        self.root.update_idletasks()
        w = self.root.winfo_width()
        h = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (w // 2)
        y = (self.root.winfo_screenheight() // 2) - (h // 2)
        self.root.geometry(f"+{x}+{y}")

    def _build_ui(self):
        """بناء عناصر الواجهة."""
        # ── الشريط العلوي ──
        self._build_header()

        # ── التبويبات ──
        self._build_tabs()

        # ── الشريط السفلي (التقدم + الأزرار) ──
        self._build_footer()

    # ────────────────────────────────────────
    # الشريط العلوي
    # ────────────────────────────────────────
    def _build_header(self):
        """شريط العنوان ومعلومات الملف."""
        header = tk.Frame(self.root, bg=COLORS["bg_secondary"], pady=12, padx=16)
        header.pack(fill="x")

        title = tk.Label(
            header, text="📚 PDF Study Tool",
            font=("Segoe UI", 18, "bold"),
            fg=COLORS["accent"], bg=COLORS["bg_secondary"]
        )
        title.pack(side="left")

        # زر اختيار ملف
        btn_frame = tk.Frame(header, bg=COLORS["bg_secondary"])
        btn_frame.pack(side="right")

        self.btn_choose = tk.Button(
            btn_frame, text="📄 اختر ملف PDF",
            font=("Segoe UI", 10),
            fg=COLORS["bg"], bg=COLORS["accent"],
            activeforeground=COLORS["bg"], activebackground=COLORS["accent_hover"],
            relief="flat", padx=16, pady=6,
            cursor="hand2",
            command=self._choose_pdf,
        )
        self.btn_choose.pack(side="right")

        # معلومات الملف
        self.file_info_frame = tk.Frame(self.root, bg=COLORS["bg"], pady=6, padx=16)
        self.file_info_frame.pack(fill="x")

        self.lbl_file_info = tk.Label(
            self.file_info_frame,
            text="لم يتم اختيار ملف" if not self.pdf_path else "",
            font=("Segoe UI", 10),
            fg=COLORS["fg_dim"], bg=COLORS["bg"],
            anchor="w",
        )
        self.lbl_file_info.pack(fill="x")

    # ────────────────────────────────────────
    # التبويبات
    # ────────────────────────────────────────
    def _build_tabs(self):
        """بناء نظام التبويبات."""
        # أزرار التبويبات
        tab_bar = tk.Frame(self.root, bg=COLORS["bg"], padx=16)
        tab_bar.pack(fill="x", pady=(4, 0))

        self.tab_buttons = []
        self.tab_frames = []
        self.current_tab = 0

        tab_names = [
            ("📝 الـ Prompts", "prompts"),
            ("⚙️ الإعدادات", "settings"),
            ("📋 السجل", "log"),
        ]

        for i, (name, key) in enumerate(tab_names):
            btn = tk.Button(
                tab_bar, text=name,
                font=("Segoe UI", 10, "bold"),
                fg=COLORS["fg"] if i != 0 else COLORS["bg"],
                bg=COLORS["tab_inactive"] if i != 0 else COLORS["tab_active"],
                relief="flat", padx=16, pady=6,
                cursor="hand2",
                command=lambda idx=i: self._switch_tab(idx),
            )
            btn.pack(side="left", padx=(0, 4))
            self.tab_buttons.append(btn)

        # حاوية التبويبات
        self.tab_container = tk.Frame(self.root, bg=COLORS["bg"], padx=16, pady=8)
        self.tab_container.pack(fill="both", expand=True)

        # بناء محتوى كل تبويب
        self._build_prompts_tab()
        self._build_settings_tab()
        self._build_log_tab()

        # إظهار التبويب الأول
        self._switch_tab(0)

    def _switch_tab(self, idx: int):
        """تبديل التبويب النشط."""
        self.current_tab = idx

        # تحديث أزرار التبويبات
        for i, btn in enumerate(self.tab_buttons):
            if i == idx:
                btn.configure(bg=COLORS["tab_active"], fg=COLORS["bg"])
            else:
                btn.configure(bg=COLORS["tab_inactive"], fg=COLORS["fg"])

        # إخفاء الكل ثم إظهار المطلوب
        for frame in self.tab_frames:
            frame.pack_forget()

        self.tab_frames[idx].pack(in_=self.tab_container, fill="both", expand=True)

    # ────────────────────────────────────────
    # تبويب الـ Prompts
    # ────────────────────────────────────────
    def _build_prompts_tab(self):
        """تبويب تعديل الـ Prompts."""
        frame = tk.Frame(self.tab_container, bg=COLORS["bg"])
        self.tab_frames.append(frame)

        # Notebook داخلي للـ 3 prompts
        self.prompt_notebook = ttk.Notebook(frame)
        self.prompt_notebook.pack(fill="both", expand=True, pady=(0, 8))

        # ستايل Notebook
        style = ttk.Style()
        style.theme_use("default")
        style.configure("TNotebook", background=COLORS["bg"], borderwidth=0)
        style.configure("TNotebook.Tab",
                        background=COLORS["bg_card"],
                        foreground=COLORS["fg"],
                        padding=[12, 6],
                        font=("Segoe UI", 9))
        style.map("TNotebook.Tab",
                   background=[("selected", COLORS["accent"])],
                   foreground=[("selected", COLORS["bg"])])

        prompt_configs = [
            ("1️⃣ ترجمة + تنسيق", "prompt_1", "الملف الأول: ترجمة المحتوى مع الحفاظ على التنسيق"),
            ("2️⃣ تبسيط (الزبدة)", "prompt_2", "الملف الثاني: شرح مبسط لكل مفهوم"),
            ("3️⃣ فلاش كارد", "prompt_3", "الملف الثالث: بطاقات مذاكرة"),
        ]

        self.prompt_editors = {}

        for title, key, description in prompt_configs:
            tab_frame = tk.Frame(self.prompt_notebook, bg=COLORS["bg_secondary"], padx=10, pady=10)
            self.prompt_notebook.add(tab_frame, text=title)

            # وصف
            desc_label = tk.Label(
                tab_frame, text=description,
                font=("Segoe UI", 9),
                fg=COLORS["fg_dim"], bg=COLORS["bg_secondary"],
                anchor="w",
            )
            desc_label.pack(fill="x", pady=(0, 6))

            # محرر النص
            editor = scrolledtext.ScrolledText(
                tab_frame,
                font=("Consolas", 10),
                fg=COLORS["fg"], bg=COLORS["bg_input"],
                insertbackground=COLORS["accent"],
                selectbackground=COLORS["accent"],
                selectforeground=COLORS["bg"],
                relief="flat",
                padx=10, pady=10,
                wrap="word",
                undo=True,
            )
            editor.pack(fill="both", expand=True)
            editor.insert("1.0", self.prompts.get(key, ""))

            # قائمة كلك يمين (نسخ/لصق/قص/تحديد الكل)
            self._add_context_menu(editor)

            self.prompt_editors[key] = editor

            # أزرار تحت المحرر
            btn_row = tk.Frame(tab_frame, bg=COLORS["bg_secondary"], pady=6)
            btn_row.pack(fill="x")

            tk.Button(
                btn_row, text="↩️ استعادة الافتراضي",
                font=("Segoe UI", 9),
                fg=COLORS["warning"], bg=COLORS["bg_card"],
                relief="flat", padx=10, pady=4,
                cursor="hand2",
                command=lambda k=key, e=editor: self._reset_prompt(k, e),
            ).pack(side="left")

            tk.Button(
                btn_row, text="💾 حفظ التعديلات",
                font=("Segoe UI", 9),
                fg=COLORS["success"], bg=COLORS["bg_card"],
                relief="flat", padx=10, pady=4,
                cursor="hand2",
                command=self._save_prompts,
            ).pack(side="right")

    def _reset_prompt(self, key: str, editor: scrolledtext.ScrolledText):
        """استعادة prompt للنص الافتراضي."""
        if messagebox.askyesno("استعادة الافتراضي", "هل تريد استعادة النص الافتراضي؟\nسيتم فقدان التعديلات الحالية."):
            editor.delete("1.0", "end")
            editor.insert("1.0", DEFAULT_PROMPTS[key])

    def _save_prompts(self):
        """حفظ جميع الـ Prompts."""
        for key, editor in self.prompt_editors.items():
            self.prompts[key] = editor.get("1.0", "end-1c")
        save_prompts(self.prompts)
        self._log("✅ تم حفظ الـ Prompts بنجاح")

    def _add_context_menu(self, widget):
        """إضافة قائمة كلك يمين (نسخ/لصق/قص/تحديد الكل) لأي Text widget."""
        menu = tk.Menu(
            widget, tearoff=0,
            font=("Segoe UI", 10),
            bg=COLORS["bg_card"], fg=COLORS["fg"],
            activebackground=COLORS["accent"], activeforeground=COLORS["bg"],
        )
        menu.add_command(label="قص          Ctrl+X", command=lambda: widget.event_generate("<<Cut>>"))
        menu.add_command(label="نسخ         Ctrl+C", command=lambda: widget.event_generate("<<Copy>>"))
        menu.add_command(label="لصق         Ctrl+V", command=lambda: widget.event_generate("<<Paste>>"))
        menu.add_separator()
        menu.add_command(label="تحديد الكل   Ctrl+A", command=lambda: self._select_all(widget))

        def show_menu(event):
            menu.tk_popup(event.x_root, event.y_root)

        widget.bind("<Button-3>", show_menu)

        # Ctrl+A ما يشتغل بالعادة في tkinter Text — نضيفه يدوياً
        widget.bind("<Control-a>", lambda e: self._select_all(widget))
        widget.bind("<Control-A>", lambda e: self._select_all(widget))

    @staticmethod
    def _select_all(widget):
        """تحديد كل النص."""
        widget.tag_add("sel", "1.0", "end-1c")
        widget.mark_set("insert", "end-1c")
        widget.see("insert")
        return "break"

    # ────────────────────────────────────────
    # تبويب الإعدادات
    # ────────────────────────────────────────
    def _build_settings_tab(self):
        """تبويب الإعدادات."""
        frame = tk.Frame(self.tab_container, bg=COLORS["bg"])
        self.tab_frames.append(frame)

        # Scrollable
        canvas = tk.Canvas(frame, bg=COLORS["bg"], highlightthickness=0)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        inner = tk.Frame(canvas, bg=COLORS["bg"])

        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # ── مزود AI ──
        self._settings_section(inner, "🤖 مزود الذكاء الاصطناعي")

        provider_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        provider_frame.pack(fill="x", padx=8, pady=(0, 12))

        self.provider_var = tk.StringVar(value=self.config.get("provider", "gemini"))

        for val, label in [("gemini", "Google Gemini"), ("openai", "OpenAI")]:
            rb = tk.Radiobutton(
                provider_frame, text=label, variable=self.provider_var, value=val,
                font=("Segoe UI", 10),
                fg=COLORS["fg"], bg=COLORS["bg_card"],
                selectcolor=COLORS["bg_input"],
                activeforeground=COLORS["accent"],
                activebackground=COLORS["bg_card"],
                command=self._on_provider_change,
            )
            rb.pack(side="left", padx=(0, 20))

        # ── Gemini ──
        self._settings_section(inner, "🔑 Google Gemini")

        gemini_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        gemini_frame.pack(fill="x", padx=8, pady=(0, 12))

        tk.Label(gemini_frame, text="API Key:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w")
        self.gemini_key_entry = tk.Entry(
            gemini_frame, font=("Consolas", 10), show="•",
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.gemini_key_entry.pack(fill="x", pady=(2, 8))
        self.gemini_key_entry.insert(0, self.config.get("gemini_api_key", ""))

        # زر إظهار/إخفاء
        self.show_gemini_key = tk.BooleanVar(value=False)
        tk.Checkbutton(
            gemini_frame, text="إظهار المفتاح",
            variable=self.show_gemini_key,
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            command=lambda: self.gemini_key_entry.configure(show="" if self.show_gemini_key.get() else "•"),
        ).pack(anchor="w")

        tk.Label(gemini_frame, text="Model:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(8, 0))
        self.gemini_model_entry = tk.Entry(
            gemini_frame, font=("Consolas", 10),
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.gemini_model_entry.pack(fill="x", pady=(2, 0))
        self.gemini_model_entry.insert(0, self.config.get("gemini_model", "gemini-2.0-flash"))

        # ── OpenAI ──
        self._settings_section(inner, "🔑 OpenAI")

        openai_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        openai_frame.pack(fill="x", padx=8, pady=(0, 12))

        tk.Label(openai_frame, text="API Key:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w")
        self.openai_key_entry = tk.Entry(
            openai_frame, font=("Consolas", 10), show="•",
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.openai_key_entry.pack(fill="x", pady=(2, 8))
        self.openai_key_entry.insert(0, self.config.get("openai_api_key", ""))

        self.show_openai_key = tk.BooleanVar(value=False)
        tk.Checkbutton(
            openai_frame, text="إظهار المفتاح",
            variable=self.show_openai_key,
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            command=lambda: self.openai_key_entry.configure(show="" if self.show_openai_key.get() else "•"),
        ).pack(anchor="w")

        tk.Label(openai_frame, text="Model:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(8, 0))
        self.openai_model_entry = tk.Entry(
            openai_frame, font=("Consolas", 10),
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.openai_model_entry.pack(fill="x", pady=(2, 0))
        self.openai_model_entry.insert(0, self.config.get("openai_model", "gpt-4o-mini"))

        # ── موديل مخصص لكل Prompt ──
        self._settings_section(inner, "🎯 موديل مخصص لكل Prompt")

        permodel_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        permodel_frame.pack(fill="x", padx=8, pady=(0, 12))

        tk.Label(
            permodel_frame,
            text="حدد موديل مختلف لكل Prompt (اتركه فاضي لاستخدام الافتراضي)\n"
                 "الصيغة:  provider:model  —  مثال:  gemini:gemini-2.0-flash  أو  openai:gpt-4o",
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            justify="right", anchor="e",
        ).pack(anchor="w", pady=(0, 8))

        self.prompt_model_entries = {}
        for key, label in [
            ("prompt_1_model", "Prompt 1 - الترجمة:"),
            ("prompt_2_model", "Prompt 2 - التبسيط:"),
            ("prompt_3_model", "Prompt 3 - فلاش كارد:"),
        ]:
            row = tk.Frame(permodel_frame, bg=COLORS["bg_card"])
            row.pack(fill="x", pady=(2, 4))

            tk.Label(row, text=label, font=("Segoe UI", 9), fg=COLORS["fg_dim"],
                     bg=COLORS["bg_card"], width=22, anchor="w").pack(side="left")

            entry = tk.Entry(
                row, font=("Consolas", 10),
                fg=COLORS["fg"], bg=COLORS["bg_input"],
                insertbackground=COLORS["accent"], relief="flat",
            )
            entry.pack(side="left", fill="x", expand=True, padx=(4, 0))
            entry.insert(0, self.config.get(key, ""))
            self.prompt_model_entries[key] = entry

        # ── أسماء الملفات ──
        self._settings_section(inner, "📁 أسماء الملفات الناتجة")

        files_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        files_frame.pack(fill="x", padx=8, pady=(0, 12))

        self.file_entries = {}
        for key, label, default in [
            ("output_folder_template", "اسم المجلد ({name} = اسم PDF):", "{name}_study"),
            ("file1_name", "ملف الترجمة:", "01_Translation.docx"),
            ("file2_name", "ملف التبسيط:", "02_Simplified.docx"),
            ("file3_name", "ملف الفلاش كارد:", "03_FlashCards.docx"),
        ]:
            tk.Label(files_frame, text=label, font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(4, 0))
            entry = tk.Entry(
                files_frame, font=("Consolas", 10),
                fg=COLORS["fg"], bg=COLORS["bg_input"],
                insertbackground=COLORS["accent"], relief="flat",
            )
            entry.pack(fill="x", pady=(2, 4))
            entry.insert(0, self.config.get(key, default))
            self.file_entries[key] = entry

        # ── تصدير الفلاش كاردز ──
        self._settings_section(inner, "🎴 تصدير Flash Cards")

        fc_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        fc_frame.pack(fill="x", padx=8, pady=(0, 12))

        self.flashcard_export_var = tk.BooleanVar(
            value=self.config.get("flashcard_export_enabled", False)
        )
        tk.Checkbutton(
            fc_frame,
            text="تصدير البطاقات تلقائياً إلى تطبيق Flash Cards بعد المعالجة",
            variable=self.flashcard_export_var,
            font=("Segoe UI", 10),
            fg=COLORS["fg"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            activeforeground=COLORS["accent"],
            activebackground=COLORS["bg_card"],
        ).pack(anchor="w", pady=(0, 8))

        tk.Label(
            fc_frame,
            text="🧠 AI يحدد اسم المجلد (المادة) واسم المجموعة (الموضوع) تلقائياً من المحتوى",
            font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
        ).pack(anchor="w")

        # زر حفظ الإعدادات
        save_btn_frame = tk.Frame(inner, bg=COLORS["bg"], pady=8)
        save_btn_frame.pack(fill="x", padx=8)

        tk.Button(
            save_btn_frame, text="💾 حفظ جميع الإعدادات",
            font=("Segoe UI", 11, "bold"),
            fg=COLORS["bg"], bg=COLORS["success"],
            activeforeground=COLORS["bg"], activebackground="#7dd3a0",
            relief="flat", padx=20, pady=8,
            cursor="hand2",
            command=self._save_settings,
        ).pack(fill="x")

    def _settings_section(self, parent, title: str):
        """عنوان قسم في الإعدادات."""
        lbl = tk.Label(
            parent, text=title,
            font=("Segoe UI", 11, "bold"),
            fg=COLORS["accent"], bg=COLORS["bg"],
            anchor="w",
        )
        lbl.pack(fill="x", padx=8, pady=(12, 4))

    def _on_provider_change(self):
        """عند تغيير مزود AI."""
        pass  # تحديث فوري عند الحفظ

    def _save_settings(self):
        """حفظ جميع الإعدادات."""
        self.config["provider"] = self.provider_var.get()
        self.config["gemini_api_key"] = self.gemini_key_entry.get().strip()
        self.config["gemini_model"] = self.gemini_model_entry.get().strip()
        self.config["openai_api_key"] = self.openai_key_entry.get().strip()
        self.config["openai_model"] = self.openai_model_entry.get().strip()

        # حفظ الموديل المخصص لكل prompt
        for key, entry in self.prompt_model_entries.items():
            self.config[key] = entry.get().strip()

        # حفظ إعدادات تصدير الفلاش كاردز
        self.config["flashcard_export_enabled"] = self.flashcard_export_var.get()

        for key, entry in self.file_entries.items():
            self.config[key] = entry.get().strip()

        save_config(self.config)
        self._log("✅ تم حفظ الإعدادات بنجاح")

    # ────────────────────────────────────────
    # تبويب السجل
    # ────────────────────────────────────────
    def _build_log_tab(self):
        """تبويب سجل العمليات."""
        frame = tk.Frame(self.tab_container, bg=COLORS["bg"])
        self.tab_frames.append(frame)

        self.log_text = scrolledtext.ScrolledText(
            frame,
            font=("Consolas", 10),
            fg=COLORS["fg"], bg=COLORS["bg_secondary"],
            insertbackground=COLORS["accent"],
            relief="flat",
            padx=10, pady=10,
            state="disabled",
        )
        self.log_text.pack(fill="both", expand=True)

        # أزرار
        btn_row = tk.Frame(frame, bg=COLORS["bg"], pady=6)
        btn_row.pack(fill="x")

        tk.Button(
            btn_row, text="🗑️ مسح السجل",
            font=("Segoe UI", 9),
            fg=COLORS["error"], bg=COLORS["bg_card"],
            relief="flat", padx=10, pady=4,
            cursor="hand2",
            command=self._clear_log,
        ).pack(side="left")

    # ────────────────────────────────────────
    # الشريط السفلي
    # ────────────────────────────────────────
    def _build_footer(self):
        """شريط التقدم وأزرار التشغيل."""
        footer = tk.Frame(self.root, bg=COLORS["bg_secondary"], pady=12, padx=16)
        footer.pack(fill="x", side="bottom")

        # شريط التقدم
        progress_frame = tk.Frame(footer, bg=COLORS["bg_secondary"])
        progress_frame.pack(fill="x", pady=(0, 8))

        self.lbl_status = tk.Label(
            progress_frame, text="جاهز",
            font=("Segoe UI", 9),
            fg=COLORS["fg_dim"], bg=COLORS["bg_secondary"],
            anchor="w",
        )
        self.lbl_status.pack(fill="x")

        style = ttk.Style()
        style.configure("Custom.Horizontal.TProgressbar",
                        troughcolor=COLORS["bg_card"],
                        background=COLORS["accent"],
                        thickness=8)

        self.progress = ttk.Progressbar(
            progress_frame, style="Custom.Horizontal.TProgressbar",
            mode="determinate", maximum=100,
        )
        self.progress.pack(fill="x", pady=(4, 0))

        # أزرار
        btn_frame = tk.Frame(footer, bg=COLORS["bg_secondary"])
        btn_frame.pack(fill="x")

        self.btn_start = tk.Button(
            btn_frame, text="🚀 ابدأ المعالجة",
            font=("Segoe UI", 12, "bold"),
            fg=COLORS["bg"], bg=COLORS["accent"],
            activeforeground=COLORS["bg"], activebackground=COLORS["accent_hover"],
            relief="flat", padx=30, pady=10,
            cursor="hand2",
            command=self._start_processing,
        )
        self.btn_start.pack(side="right")

        self.btn_open_folder = tk.Button(
            btn_frame, text="📂 فتح المجلد",
            font=("Segoe UI", 10),
            fg=COLORS["fg"], bg=COLORS["bg_card"],
            relief="flat", padx=16, pady=8,
            cursor="hand2",
            state="disabled",
            command=self._open_output_folder,
        )
        self.btn_open_folder.pack(side="right", padx=(0, 8))

        self.output_folder_path = None

    # ────────────────────────────────────────
    # وظائف الملف
    # ────────────────────────────────────────
    def _choose_pdf(self):
        """فتح مربع حوار اختيار ملف PDF أو PowerPoint."""
        path = filedialog.askopenfilename(
            title="اختر ملف عرض تقديمي أو PDF",
            filetypes=[
                ("العروض والملفات المدعومة", "*.pdf;*.pptx;*.ppt"),
                ("PDF files", "*.pdf"),
                ("PowerPoint files", "*.pptx;*.ppt"),
                ("All files", "*.*"),
            ],
        )
        if path:
            self.pdf_path = path
            self._load_pdf_info()

    def _load_pdf_info(self):
        """تحميل وعرض معلومات ملف PDF أو PowerPoint."""
        try:
            if is_powerpoint_file(self.pdf_path):
                info = get_pptx_info(self.pdf_path)
                self.lbl_file_info.configure(
                    text=f"📊 {info['filename']}  |  📃 {info['total_pages']} سلايد  |  💾 {info['file_size_mb']} MB",
                    fg=COLORS["success"],
                )
                self._log(f"تم تحميل عرض PowerPoint: {info['filename']} ({info['total_pages']} سلايد)")
            else:
                info = get_pdf_info(self.pdf_path)
                self.lbl_file_info.configure(
                    text=f"📄 {info['filename']}  |  📃 {info['total_pages']} صفحة  |  💾 {info['file_size_mb']} MB",
                    fg=COLORS["success"],
                )
                self._log(f"تم تحميل: {info['filename']} ({info['total_pages']} صفحة)")
        except Exception as e:
            self.lbl_file_info.configure(
                text=f"❌ خطأ في قراءة الملف: {e}",
                fg=COLORS["error"],
            )

    # ────────────────────────────────────────
    # المعالجة
    # ────────────────────────────────────────
    def _start_processing(self):
        """بدء المعالجة في thread منفصل."""
        if self.is_processing:
            return

        if not self.pdf_path:
            messagebox.showwarning("تنبيه", "اختر ملف PDF أولاً!")
            return

        # حفظ الإعدادات والـ Prompts قبل البدء
        self._save_settings()
        self._save_prompts()

        # تحديد المزودات المطلوبة (الافتراضي + أي موديل مخصص)
        default_provider = self.config["provider"]
        needed_providers = {default_provider}

        model_overrides = {}
        for key in ["prompt_1_model", "prompt_2_model", "prompt_3_model"]:
            val = self.config.get(key, "").strip()
            if val and ":" in val:
                prov = val.split(":", 1)[0].strip()
                needed_providers.add(prov)
                prompt_key = key.replace("_model", "")  # prompt_1, prompt_2, prompt_3
                model_overrides[prompt_key] = val

        # التحقق من API Keys لكل مزود مطلوب
        for prov in needed_providers:
            key_field = f"{prov}_api_key"
            if not self.config.get(key_field, "").strip():
                messagebox.showerror(
                    "خطأ",
                    f"مفتاح {prov.upper()} API غير موجود!\n\n"
                    f"أنت تستخدم {prov} في أحد الـ Prompts.\n"
                    f"اذهب لتبويب الإعدادات وأضف المفتاح."
                )
                self._switch_tab(1)
                return

        self.is_processing = True
        self.btn_start.configure(state="disabled", text="⏳ جاري المعالجة...")
        self.btn_open_folder.configure(state="disabled")
        self.progress["value"] = 0

        # تشغيل في thread منفصل
        thread = threading.Thread(
            target=self._process_thread,
            args=(model_overrides,),
            daemon=True,
        )
        thread.start()

    def _process_thread(self, model_overrides: dict):
        """Thread المعالجة الفعلية."""
        try:
            # ── 1. استخراج المحتوى (PDF أو PowerPoint) ──
            if is_powerpoint_file(self.pdf_path):
                self._update_status("📊 جاري فحص وتحويل عرض PowerPoint...", 3)
                self._log("📊 تم اكتشاف ملف PowerPoint — محاولة التحويل عبر PowerPoint COM...")
                converted_pdf = convert_pptx_to_pdf(self.pdf_path)
                if converted_pdf:
                    self._log("✅ تم تحويل PowerPoint إلى PDF بنجاح بدقة 100%")
                    pages = extract_text_from_pdf(converted_pdf)
                else:
                    self._log("ℹ️ جاري استخراج محتوى PowerPoint مباشرة عبر python-pptx...")
                    pages = extract_text_and_visuals_from_pptx(self.pdf_path)
            else:
                self._update_status("📖 جاري استخراج النصوص والمخططات من PDF...", 5)
                pages = extract_text_from_pdf(self.pdf_path)

            self._log(f"✅ تم استخراج {len(pages)} سلايد/صفحة بنجاح")

            # فحص الرسوم التوضيحية
            visuals_count = sum(1 for p in pages if p.get("has_visuals"))
            if visuals_count > 0:
                self._log(f"👁️ تم رصد {visuals_count} سلايد يحتوي على مخططات/رسوم بيانية سيتم إرسالها وتحليلها بصرياً عبر AI")

            chunks_count = max(1, -(-len(pages) // 10))  # ceil division
            self._log(f"📦 سيتم المعالجة على {chunks_count} دفعة (كل دفعة 10 صفحات كحد أقصى)")

            if model_overrides:
                for k, v in model_overrides.items():
                    self._log(f"🎯 {k}: {v}")
            self._log("🔗 السلسلة: Prompt1 (الأصل + المخططات) → Prompt2 (التبسيط) → Prompt3 (البطاقات)")

            self._update_status(f"✅ تم استخراج {len(pages)} صفحة ({chunks_count} دفعة)", 10)

            # ── 2. معالجة AI ──
            # المعالج الأساسي يستخدم المزود الافتراضي
            # كل prompt يمكنه استخدام موديل مختلف عبر model_overrides
            provider = self.config["provider"]
            api_key = get_api_key(self.config)
            model = get_model(self.config)

            # إنشاء معالجات إضافية حسب الحاجة
            # AIProcessor الأساسي للمزود الافتراضي
            processors = {provider: AIProcessor(provider, api_key, model)}

            # معالجات إضافية للمزودات الأخرى
            for key, val in model_overrides.items():
                prov = val.split(":", 1)[0].strip()
                if prov not in processors:
                    prov_key = self.config.get(f"{prov}_api_key", "")
                    prov_model = self.config.get(f"{prov}_model", "")
                    processors[prov] = AIProcessor(prov, prov_key, prov_model)

            # نستخدم المعالج الافتراضي — process_all_three يتعامل مع model_overrides
            main_processor = processors[provider]

            # الحصول على الـ Prompts الحالية من المحررات
            current_prompts = {}
            for key, editor in self.prompt_editors.items():
                current_prompts[key] = editor.get("1.0", "end-1c")

            def ai_progress(step, total, message):
                # تحويل تقدم AI إلى 10%-90%
                pct = 10 + int(80 * step / total)
                self._update_status(f"🤖 {message}", pct)
                self._log(f"  {message}")

            # لكل prompt مزود مختلف محتمل — نحتاج ضمان صحة API keys
            # model_overrides بصيغة {"prompt_1": "gemini:gemini-2.0-flash", ...}
            # process_all_three يعرف يتعامل مع provider:model لكل prompt

            # لكن المعالج الواحد يحمل api_key واحد فقط
            # اذا فيه أكثر من مزود نحتاج معالج لكل مزود
            # الحل: نعيد بناء process_all_three من هنا لو فيه أكثر من مزود

            has_multi_provider = len(processors) > 1
            if has_multi_provider:
                # معالجة يدوية — كل prompt بمعالجه الخاص
                ai_results = self._process_multi_provider(
                    pages, current_prompts, model_overrides, processors, ai_progress
                )
            else:
                ai_results = main_processor.process_all_three(
                    pages, prompts=current_prompts,
                    model_overrides=model_overrides,
                    progress_callback=ai_progress,
                )

            self._log("✅ تمت جميع المعالجات بنجاح")
            self._update_status("📝 جاري إنشاء ملفات Word...", 90)

            # ── 3. إنشاء الملفات ──
            pdf_name = os.path.splitext(os.path.basename(self.pdf_path))[0]
            pdf_dir = os.path.dirname(self.pdf_path)

            folder_name = self.config.get("output_folder_template", "{name}_study").format(name=pdf_name)
            output_folder = os.path.join(pdf_dir, folder_name)

            file_names = {
                "file1": self.config.get("file1_name", "01_Translation.docx"),
                "file2": self.config.get("file2_name", "02_Simplified.docx"),
                "file3": self.config.get("file3_name", "03_FlashCards.docx"),
            }

            created = generate_all_documents(ai_results, pdf_name, output_folder, file_names)

            self.output_folder_path = output_folder
            self._log(f"📝 تم إنشاء {len(created)} ملفات Word")

            for f in created:
                self._log(f"   📄 {os.path.basename(f)}")

            # ── 4. تصدير الفلاش كاردز ──
            if self.config.get("flashcard_export_enabled", False):
                self._update_status("🧠 AI يحدد اسم المجموعة والمجلد...", 92)
                self._log("🧠 جاري تحديد اسم المجلد والمجموعة بالذكاء الاصطناعي...")

                # جلب المجلدات الموجودة عشان AI يختار منها لو مناسبة
                existing_folders = []
                try:
                    existing_folders = get_existing_folders()
                    if existing_folders:
                        self._log(f"   📂 المجلدات الموجودة: {', '.join(existing_folders[:5])}{'...' if len(existing_folders) > 5 else ''}")
                except Exception:
                    pass

                # طلب من AI اقتراح الأسماء
                try:
                    deck_info = main_processor.suggest_deck_info(
                        ai_results["translation"],
                        existing_folders=existing_folders,
                    )
                    fc_folder = deck_info["folder"] or pdf_name
                    fc_deck = deck_info["deck"] or pdf_name
                except Exception as naming_err:
                    self._log(f"⚠️ فشل تحديد الأسماء بالـ AI ({naming_err}) — سيتم استخدام اسم الملف")
                    fc_folder = pdf_name
                    fc_deck = pdf_name

                self._log(f"   📁 المجلد: {fc_folder}")
                self._log(f"   🎴 المجموعة: {fc_deck}")

                self._update_status("🎴 جاري تصدير الفلاش كاردز...", 95)
                self._log("🎴 جاري تصدير البطاقات إلى تطبيق Flash Cards...")

                try:
                    export_result = export_to_flashcards(
                        flashcards_text=ai_results["flashcards"],
                        deck_name=fc_deck,
                        folder=fc_folder,
                        description=f"Generated from {pdf_name}",
                        progress_callback=lambda msg: self._log(f"   {msg}"),
                    )

                    if export_result["success"]:
                        self._log(f"✅ تم تصدير {export_result['cards_count']} بطاقة إلى Flash Cards")
                    else:
                        errors = "; ".join(export_result["errors"][:3])
                        self._log(f"⚠️ فشل التصدير: {errors}")
                except Exception as export_err:
                    self._log(f"⚠️ خطأ في تصدير الفلاش كاردز: {export_err}")

            self._update_status("🎉 تم بنجاح!", 100)
            self._log(f"🎉 تم بنجاح! المجلد: {output_folder}")

            # تفعيل زر فتح المجلد
            self.root.after(0, lambda: self.btn_open_folder.configure(state="normal"))

            # سؤال فتح المجلد
            self.root.after(100, lambda: self._ask_open_folder(output_folder))

        except Exception as e:
            self._update_status(f"❌ خطأ: {e}", 0)
            self._log(f"❌ خطأ: {e}")
            self.root.after(0, lambda err=str(e): messagebox.showerror("خطأ", err))

        finally:
            self.is_processing = False
            self.root.after(0, lambda: self.btn_start.configure(state="normal", text="🚀 ابدأ المعالجة"))

    def _process_multi_provider(self, pages, prompts, model_overrides, processors, progress_callback):
        """
        معالجة السلسلة عندما تكون هناك عدة مزودات AI.
        كل prompt يستخدم المعالج المناسب لمزوده.
        السلسلة: Prompt1(PDF) → Prompt2(نتيجة 1) → Prompt3(نتيجة 2)
        """
        import time
        from ai_processor import PROMPT_1_TRANSLATION, PROMPT_2_SIMPLIFIED, PROMPT_3_FLASHCARDS

        results = {}

        p1 = prompts.get("prompt_1", PROMPT_1_TRANSLATION)
        p2 = prompts.get("prompt_2", PROMPT_2_SIMPLIFIED)
        p3 = prompts.get("prompt_3", PROMPT_3_FLASHCARDS)

        default_provider = self.config["provider"]

        def _get_processor_and_model(prompt_key):
            """إرجاع المعالج والموديل المناسبين لـ prompt معين."""
            val = model_overrides.get(prompt_key, "").strip()
            if val and ":" in val:
                prov, mod = val.split(":", 1)
                prov, mod = prov.strip(), mod.strip()
                return processors[prov], mod
            return processors[default_provider], None

        # ── Prompt 1: الترجمة — على محتوى PDF الأصلي ──
        proc1, mod1 = _get_processor_and_model("prompt_1")
        label1 = f" [{proc1.provider}:{mod1 or proc1.model}]"

        if progress_callback:
            progress_callback(1, 6, f"جاري إنشاء: الترجمة{label1}...")

        results["translation"] = proc1.process_chunked(
            pages, p1, use_model=mod1,
            progress_callback=lambda c, t, m: progress_callback(1, 6, f"الترجمة{label1}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ── Prompt 2: التبسيط — على نتيجة Prompt 1 ──
        proc2, mod2 = _get_processor_and_model("prompt_2")
        label2 = f" [{proc2.provider}:{mod2 or proc2.model}]"

        if progress_callback:
            progress_callback(3, 6, f"جاري إنشاء: التبسيط{label2} (معتمد على الترجمة)...")

        results["simplified"] = proc2.process_text_chunked(
            results["translation"], p2, use_model=mod2,
            progress_callback=lambda c, t, m: progress_callback(3, 6, f"التبسيط{label2}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ── Prompt 3: فلاش كارد — على نتيجة Prompt 2 ──
        # (مستثنى من قاعدة الـ 10 صفحات — يرسل كل المحتوى مرة واحدة)
        proc3, mod3 = _get_processor_and_model("prompt_3")
        label3 = f" [{proc3.provider}:{mod3 or proc3.model}]"

        if progress_callback:
            progress_callback(5, 6, f"جاري إنشاء: فلاش كارد{label3} (معتمد على التبسيط)...")

        results["flashcards"] = proc3.process(
            results["simplified"], p3, use_model=mod3
        )

        if progress_callback:
            progress_callback(6, 6, "تم!")

        return results

    def _ask_open_folder(self, folder: str):
        """سؤال المستخدم عن فتح المجلد."""
        if messagebox.askyesno("تم بنجاح! 🎉", f"تم إنشاء الملفات في:\n{folder}\n\nهل تريد فتح المجلد؟"):
            os.startfile(folder)

    def _open_output_folder(self):
        """فتح مجلد النتائج."""
        if self.output_folder_path and os.path.exists(self.output_folder_path):
            os.startfile(self.output_folder_path)

    # ────────────────────────────────────────
    # مساعدات
    # ────────────────────────────────────────
    def _update_status(self, text: str, progress: int):
        """تحديث شريط الحالة."""
        self.root.after(0, lambda: self.lbl_status.configure(text=text))
        self.root.after(0, lambda: self.progress.configure(value=progress))

    def _log(self, message: str):
        """إضافة رسالة للسجل."""
        import datetime
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")

        def _append():
            self.log_text.configure(state="normal")
            self.log_text.insert("end", f"[{timestamp}] {message}\n")
            self.log_text.see("end")
            self.log_text.configure(state="disabled")

        self.root.after(0, _append)

    def _clear_log(self):
        """مسح السجل."""
        self.log_text.configure(state="normal")
        self.log_text.delete("1.0", "end")
        self.log_text.configure(state="disabled")

    # ────────────────────────────────────────
    # التشغيل
    # ────────────────────────────────────────
    def run(self):
        """تشغيل الواجهة."""
        self.root.mainloop()


def launch_gui(pdf_path: str = None):
    """تشغيل الواجهة التفاعلية."""
    # التأكد من أن working directory هو مجلد البرنامج
    # (مهم عند التشغيل من كلك يمين — Windows يشغّله من مكان ثاني)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    app = PDFStudyToolGUI(pdf_path)
    app.run()


if __name__ == "__main__":
    try:
        # ضبط المسار
        os.chdir(os.path.dirname(os.path.abspath(__file__)))

        pdf = sys.argv[1] if len(sys.argv) > 1 else None
        launch_gui(pdf)
    except Exception as e:
        # لو صار خطأ مع pythonw (ما فيه console) — نعرض رسالة خطأ
        import traceback
        error_msg = traceback.format_exc()
        try:
            import tkinter as tk
            from tkinter import messagebox
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("PDF Study Tool - خطأ", f"حدث خطأ:\n\n{error_msg}")
            root.destroy()
        except Exception:
            # آخر حل: حفظ الخطأ في ملف
            log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "error_log.txt")
            with open(log_path, "w", encoding="utf-8") as f:
                f.write(error_msg)
