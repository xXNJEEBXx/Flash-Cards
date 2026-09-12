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

from config import (
    load_config, save_config, get_api_key, get_model, CONFIG_FILE,
    AVAILABLE_MODELS, get_provider_display_name, detect_provider,
    clean_model_id, get_model_combobox_list, parse_model_choice,
    resolve_effective_model, find_combobox_display_value
)
from pdf_extractor import extract_text_from_pdf, get_pdf_info
from pptx_extractor import is_powerpoint_file, convert_pptx_to_pdf, extract_text_and_visuals_from_pptx, get_pptx_info
from ai_processor import (
    AIProcessor, PROMPT_1_TRANSLATION, PROMPT_2_SIMPLIFIED, PROMPT_3_FLASHCARDS,
    test_connection
)
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

        self.prompt_tab_combos = {}
        self.prompt_tab_badges = {}
        self.settings_prompt_combos = {}
        self.settings_prompt_badges = {}

        self._build_window()
        self._build_ui()
        self._refresh_all_badges()
        self._refresh_active_models_summary()

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

            # ── شريط اختيار النموذج للمهمة ──
            model_bar = tk.Frame(tab_frame, bg=COLORS["bg_card"], padx=10, pady=6)
            model_bar.pack(fill="x", pady=(0, 6))

            tk.Label(
                model_bar, text="🤖 النموذج لهذه المهمة:",
                font=("Segoe UI", 9, "bold"),
                fg=COLORS["accent"], bg=COLORS["bg_card"],
            ).pack(side="left", padx=(0, 6))

            model_combo = ttk.Combobox(
                model_bar,
                values=get_model_combobox_list(include_default=True),
                font=("Segoe UI", 9),
                width=38,
            )
            model_combo.pack(side="left", padx=(0, 8))

            init_val = find_combobox_display_value(self.config.get(f"{key}_model", ""))
            model_combo.set(init_val)
            self.prompt_tab_combos[key] = model_combo

            # Badge
            badge_lbl = tk.Label(
                model_bar, text="", font=("Segoe UI", 8, "bold"),
                bg=COLORS["bg_card"], cursor="hand2"
            )
            badge_lbl.pack(side="left", padx=(0, 6))
            badge_lbl.bind("<Button-1>", lambda e: self._switch_tab(1))
            self.prompt_tab_badges[key] = badge_lbl

            # Test button
            btn_test = tk.Button(
                model_bar, text="⚡ فحص",
                font=("Segoe UI", 8, "bold"),
                fg=COLORS["fg"], bg=COLORS["bg_input"],
                activeforeground=COLORS["accent"], activebackground=COLORS["bg_secondary"],
                relief="flat", padx=8, pady=2,
                cursor="hand2",
                command=lambda k=key: self._test_model_for_prompt(k)
            )
            btn_test.pack(side="right")

            # Bindings
            model_combo.bind("<<ComboboxSelected>>", lambda e, k=key, cb=model_combo: self._on_prompt_model_change(k, cb.get(), "prompts_tab"))
            model_combo.bind("<KeyRelease>", lambda e, k=key, cb=model_combo: self._on_prompt_model_change(k, cb.get(), "prompts_tab"))

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
    def _build_active_models_summary_card(self, parent):
        """بناء بطاقة ملخص النماذج النشطة في أعلى تبويب الإعدادات."""
        card = tk.Frame(parent, bg=COLORS["bg_secondary"], padx=14, pady=12, highlightthickness=1, highlightbackground=COLORS["border"])
        card.pack(fill="x", padx=8, pady=(0, 14))

        header = tk.Frame(card, bg=COLORS["bg_secondary"])
        header.pack(fill="x", pady=(0, 8))

        tk.Label(
            header, text="📋 ملخص النماذج الفعالة للمهام (Active Models Overview)",
            font=("Segoe UI", 10, "bold"), fg=COLORS["accent"], bg=COLORS["bg_secondary"]
        ).pack(side="left")

        tk.Label(
            header, text="يتحدث تلقائياً عند تغيير أي نموذج أو مفتاح",
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_secondary"]
        ).pack(side="right")

        self.summary_rows_frame = tk.Frame(card, bg=COLORS["bg_secondary"])
        self.summary_rows_frame.pack(fill="x")

    def _refresh_active_models_summary(self):
        """تحديث بطاقة ملخص النماذج الفعالة في تبويب الإعدادات."""
        if not hasattr(self, 'summary_rows_frame') or not self.summary_rows_frame:
            return

        for widget in self.summary_rows_frame.winfo_children():
            widget.destroy()

        tasks = [
            ("prompt_1", "📘 المهمة 1: الترجمة والتنسيق"),
            ("prompt_2", "💡 المهمة 2: التبسيط والزبدة"),
            ("prompt_3", "🎴 المهمة 3: بطاقات الفلاش كارد"),
        ]

        for p_key, p_label in tasks:
            prov, mod, is_custom, has_key = resolve_effective_model(self.config, p_key)
            prov_name = get_provider_display_name(prov)

            row = tk.Frame(self.summary_rows_frame, bg=COLORS["bg_card"], padx=10, pady=6)
            row.pack(fill="x", pady=2)

            # اسم المهمة
            tk.Label(
                row, text=p_label, font=("Segoe UI", 9, "bold"),
                fg=COLORS["fg"], bg=COLORS["bg_card"], width=28, anchor="w"
            ).pack(side="left")

            # اسم النموذج والمزود
            custom_tag = " (مخصص)" if is_custom else " (افتراضي)"
            model_info = f"{mod}  [{prov_name}]{custom_tag}"
            tk.Label(
                row, text=model_info, font=("Consolas", 9, "bold"),
                fg=COLORS["accent"], bg=COLORS["bg_card"], anchor="w"
            ).pack(side="left", fill="x", expand=True, padx=6)

            # الجاهزية
            status_text = "🟢 المفتاح جاهز" if has_key else f"⚠️ مفتاح {prov_name} غير مدخل"
            status_fg = COLORS["success"] if has_key else COLORS["error"]
            tk.Label(
                row, text=status_text, font=("Segoe UI", 8, "bold"),
                fg=status_fg, bg=COLORS["bg_card"]
            ).pack(side="right")

    def _update_prompt_badge(self, prompt_key: str):
        """تحديث شارة الجاهزية لمهمة معينة في تبويبي Prompts والإعدادات."""
        prov, mod, is_custom, has_key = resolve_effective_model(self.config, prompt_key)
        prov_name = get_provider_display_name(prov)

        if has_key:
            text = f"🟢 جاهز ({prov_name})"
            fg = COLORS["success"]
        else:
            text = f"⚠️ مفتاح {prov_name} غير مدخل (انقر للإعداد)"
            fg = COLORS["error"]

        if prompt_key in self.prompt_tab_badges:
            self.prompt_tab_badges[prompt_key].configure(text=text, fg=fg)

        if prompt_key in self.settings_prompt_badges:
            self.settings_prompt_badges[prompt_key].configure(text=text, fg=fg)

    def _refresh_all_badges(self):
        """تحديث كافة الشارات وحالات المفاتيح في كامل الواجهة."""
        for p in ["gemini", "openai", "openrouter"]:
            self._update_key_status_label(p)
        for k in ["prompt_1", "prompt_2", "prompt_3"]:
            self._update_prompt_badge(k)

    def _update_key_status_label(self, provider: str):
        """تحديث مؤشر توفر المفتاح."""
        entry = getattr(self, f"{provider}_key_entry", None)
        lbl = getattr(self, f"lbl_{provider}_key_status", None)
        if entry and lbl:
            has_key = bool(entry.get().strip())
            lbl.configure(
                text="🟢 المفتاح مضاف" if has_key else "⚪ غير مدخل",
                fg=COLORS["success"] if has_key else COLORS["fg_dim"]
            )

    def _on_key_entry_changed(self, provider: str):
        """عند تعديل حقل مفتاح API."""
        key_entry = getattr(self, f"{provider}_key_entry", None)
        if key_entry:
            self.config[f"{provider}_api_key"] = key_entry.get().strip()
        self._update_key_status_label(provider)
        self._refresh_all_badges()
        self._refresh_active_models_summary()

    def _on_prompt_model_change(self, prompt_key: str, new_value: str, from_source: str = "prompts_tab"):
        """معالجة تغيير النموذج لمهمة معينة ومزامنة الواجهة والإعدادات فوراً."""
        clean_id = clean_model_id(new_value)
        if not clean_id or "الافتراضي" in new_value or "⭐" in new_value:
            self.config[f"{prompt_key}_model"] = ""
        else:
            prov = detect_provider(new_value)
            self.config[f"{prompt_key}_model"] = f"{prov}:{clean_id}"

        save_config(self.config)
        self._update_prompt_badge(prompt_key)
        self._refresh_active_models_summary()

        # مزامنة القائمة المنسدلة في التبويب الآخر
        display_val = find_combobox_display_value(self.config.get(f"{prompt_key}_model", ""))
        if from_source == "prompts_tab" and prompt_key in self.settings_prompt_combos:
            self.settings_prompt_combos[prompt_key].set(display_val)
        elif from_source == "settings_tab" and prompt_key in self.prompt_tab_combos:
            self.prompt_tab_combos[prompt_key].set(display_val)

    def _test_model_for_prompt(self, prompt_key: str):
        """اختبار النموذج المحدد لمهمة معينة."""
        prov, mod, _, has_key = resolve_effective_model(self.config, prompt_key)
        api_key = self.config.get(f"{prov}_api_key", "").strip()
        self._run_connection_test(prov, api_key, mod, f"المهمة ({prompt_key.replace('prompt_', '')})")

    def _run_connection_test(self, provider: str, api_key: str, model: str, context_label: str = ""):
        """تشغيل فحص الاتصال بالذكاء الاصطناعي في thread منفصل لتجنب تجميد الواجهة."""
        prov_name = get_provider_display_name(provider)
        clean_mod = clean_model_id(model) or model
        self._log(f"⚡ جاري فحص الاتصال بـ {prov_name} ({clean_mod})...")

        def _test():
            success, msg = test_connection(provider, api_key, clean_mod)
            if success:
                self._log(f"✅ {msg}")
                self.root.after(0, lambda: messagebox.showinfo("نجاح الاتصال! ⚡", f"{msg}\n\nالنموذج جاهز تماماً للاستخدام."))
            else:
                self._log(f"❌ {msg}")
                self.root.after(0, lambda: messagebox.showerror("فشل الاتصال", f"{msg}\n\nيرجى التحقق من مفتاح API وصحة اسم النموذج."))

        threading.Thread(target=_test, daemon=True).start()

    # ────────────────────────────────────────
    # تبويب الإعدادات
    # ────────────────────────────────────────
    def _build_settings_tab(self):
        """تبويب الإعدادات المطور مع لوحة النماذج واختيار القوائم وفحص الاتصال."""
        frame = tk.Frame(self.tab_container, bg=COLORS["bg"])
        self.tab_frames.append(frame)

        # Scrollable canvas
        canvas = tk.Canvas(frame, bg=COLORS["bg"], highlightthickness=0)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        inner = tk.Frame(canvas, bg=COLORS["bg"])

        inner.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas_window = canvas.create_window((0, 0), window=inner, anchor="nw")

        def _on_canvas_configure(event):
            canvas.itemconfig(canvas_window, width=event.width)
        canvas.bind("<Configure>", _on_canvas_configure)
        canvas.configure(yscrollcommand=scrollbar.set)

        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # ── 1. لوحة النماذج النشطة في الأعلى (Active Models Dashboard) ──
        self._build_active_models_summary_card(inner)

        # ── 2. قسم تخصيص النماذج لكل مهمة (Task-Specific Models) ──
        self._settings_section(inner, "🎯 تخصيص نموذج لكل مهمة (Task Models)")

        task_models_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=12)
        task_models_frame.pack(fill="x", padx=8, pady=(0, 12))

        tk.Label(
            task_models_frame,
            text="اختر النموذج المناسب لكل مهمة من القائمة، أو اكتب اسم أي نموذج تريده.\n"
                 "يمكنك استخدام نماذج مختلفة في نفس الوقت (مثال: Gemini للترجمة و GPT-4o للتبسيط).",
            font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            justify="right", anchor="e"
        ).pack(fill="x", pady=(0, 10))

        tasks = [
            ("prompt_1", "📘 مهمة 1 - الترجمة والتنسيق:", "prompt_1_model"),
            ("prompt_2", "💡 مهمة 2 - التبسيط والزبدة:", "prompt_2_model"),
            ("prompt_3", "🎴 مهمة 3 - الفلاش كارد:", "prompt_3_model"),
        ]

        combobox_options = get_model_combobox_list(include_default=True)

        for p_key, p_label, config_field in tasks:
            row = tk.Frame(task_models_frame, bg=COLORS["bg_card"])
            row.pack(fill="x", pady=4)

            tk.Label(
                row, text=p_label, font=("Segoe UI", 9, "bold"),
                fg=COLORS["fg"], bg=COLORS["bg_card"], width=24, anchor="w"
            ).pack(side="left")

            cb = ttk.Combobox(row, values=combobox_options, font=("Segoe UI", 9), width=36)
            cb.pack(side="left", padx=(4, 8), fill="x", expand=True)

            init_val = find_combobox_display_value(self.config.get(config_field, ""))
            cb.set(init_val)
            self.settings_prompt_combos[p_key] = cb

            badge = tk.Label(row, text="", font=("Segoe UI", 8, "bold"), bg=COLORS["bg_card"])
            badge.pack(side="left", padx=(0, 8))
            self.settings_prompt_badges[p_key] = badge

            btn_test = tk.Button(
                row, text="⚡ فحص",
                font=("Segoe UI", 8, "bold"),
                fg=COLORS["fg"], bg=COLORS["bg_input"],
                activeforeground=COLORS["accent"], activebackground=COLORS["bg_secondary"],
                relief="flat", padx=8, pady=2, cursor="hand2",
                command=lambda k=p_key: self._test_model_for_prompt(k)
            )
            btn_test.pack(side="right")

            cb.bind("<<ComboboxSelected>>", lambda e, k=p_key, box=cb: self._on_prompt_model_change(k, box.get(), "settings_tab"))
            cb.bind("<KeyRelease>", lambda e, k=p_key, box=cb: self._on_prompt_model_change(k, box.get(), "settings_tab"))

        # ── 3. المزود الافتراضي العام ──
        self._settings_section(inner, "🌐 المزود الافتراضي العام (Default Provider)")

        provider_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=10)
        provider_frame.pack(fill="x", padx=8, pady=(0, 12))

        self.provider_var = tk.StringVar(value=self.config.get("provider", "gemini"))

        for val, label in [("gemini", "Google Gemini"), ("openai", "OpenAI"), ("openrouter", "OpenRouter")]:
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

        # ── 4. Google Gemini ──
        self._settings_section(inner, "🔑 Google Gemini")

        gemini_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=12)
        gemini_frame.pack(fill="x", padx=8, pady=(0, 12))

        key_header_g = tk.Frame(gemini_frame, bg=COLORS["bg_card"])
        key_header_g.pack(fill="x", pady=(0, 2))
        tk.Label(key_header_g, text="API Key:", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(side="left")
        self.lbl_gemini_key_status = tk.Label(key_header_g, text="", font=("Segoe UI", 8, "bold"), bg=COLORS["bg_card"])
        self.lbl_gemini_key_status.pack(side="right")

        self.gemini_key_entry = tk.Entry(
            gemini_frame, font=("Consolas", 10), show="•",
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.gemini_key_entry.pack(fill="x", pady=(2, 6))
        self.gemini_key_entry.insert(0, self.config.get("gemini_api_key", ""))
        self.gemini_key_entry.bind("<KeyRelease>", lambda e: self._on_key_entry_changed("gemini"))

        ctrl_row_g = tk.Frame(gemini_frame, bg=COLORS["bg_card"])
        ctrl_row_g.pack(fill="x", pady=(0, 8))

        self.show_gemini_key = tk.BooleanVar(value=False)
        tk.Checkbutton(
            ctrl_row_g, text="إظهار المفتاح",
            variable=self.show_gemini_key,
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            command=lambda: self.gemini_key_entry.configure(show="" if self.show_gemini_key.get() else "•"),
        ).pack(side="left")

        btn_test_g = tk.Button(
            ctrl_row_g, text="⚡ فحص اتصال Gemini",
            font=("Segoe UI", 8, "bold"),
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            activeforeground=COLORS["accent"], activebackground=COLORS["bg_secondary"],
            relief="flat", padx=10, pady=2, cursor="hand2",
            command=lambda: self._run_connection_test("gemini", self.gemini_key_entry.get().strip(), clean_model_id(self.gemini_model_combo.get()) or self.gemini_model_combo.get().strip())
        )
        btn_test_g.pack(side="right")

        tk.Label(gemini_frame, text="النموذج الافتراضي لـ Gemini (اختر أو اكتب):", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(4, 2))
        gemini_model_opts = get_model_combobox_list(include_default=False, provider_filter="gemini")
        self.gemini_model_combo = ttk.Combobox(
            gemini_frame, values=gemini_model_opts,
            font=("Segoe UI", 9)
        )
        self.gemini_model_combo.pack(fill="x", pady=(0, 4))
        self.gemini_model_combo.set(find_combobox_display_value(self.config.get("gemini_model", "gemini-2.0-flash"), include_default=False, provider_filter="gemini"))
        self.gemini_model_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_active_models_summary())
        self.gemini_model_combo.bind("<KeyRelease>", lambda e: self._refresh_active_models_summary())

        # ── 5. OpenAI ──
        self._settings_section(inner, "🔑 OpenAI")

        openai_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=12)
        openai_frame.pack(fill="x", padx=8, pady=(0, 12))

        key_header_o = tk.Frame(openai_frame, bg=COLORS["bg_card"])
        key_header_o.pack(fill="x", pady=(0, 2))
        tk.Label(key_header_o, text="API Key:", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(side="left")
        self.lbl_openai_key_status = tk.Label(key_header_o, text="", font=("Segoe UI", 8, "bold"), bg=COLORS["bg_card"])
        self.lbl_openai_key_status.pack(side="right")

        self.openai_key_entry = tk.Entry(
            openai_frame, font=("Consolas", 10), show="•",
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.openai_key_entry.pack(fill="x", pady=(2, 6))
        self.openai_key_entry.insert(0, self.config.get("openai_api_key", ""))
        self.openai_key_entry.bind("<KeyRelease>", lambda e: self._on_key_entry_changed("openai"))

        ctrl_row_o = tk.Frame(openai_frame, bg=COLORS["bg_card"])
        ctrl_row_o.pack(fill="x", pady=(0, 8))

        self.show_openai_key = tk.BooleanVar(value=False)
        tk.Checkbutton(
            ctrl_row_o, text="إظهار المفتاح",
            variable=self.show_openai_key,
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            command=lambda: self.openai_key_entry.configure(show="" if self.show_openai_key.get() else "•"),
        ).pack(side="left")

        btn_test_o = tk.Button(
            ctrl_row_o, text="⚡ فحص اتصال OpenAI",
            font=("Segoe UI", 8, "bold"),
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            activeforeground=COLORS["accent"], activebackground=COLORS["bg_secondary"],
            relief="flat", padx=10, pady=2, cursor="hand2",
            command=lambda: self._run_connection_test("openai", self.openai_key_entry.get().strip(), clean_model_id(self.openai_model_combo.get()) or self.openai_model_combo.get().strip())
        )
        btn_test_o.pack(side="right")

        tk.Label(openai_frame, text="النموذج الافتراضي لـ OpenAI (اختر أو اكتب):", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(4, 2))
        openai_model_opts = get_model_combobox_list(include_default=False, provider_filter="openai")
        self.openai_model_combo = ttk.Combobox(
            openai_frame, values=openai_model_opts,
            font=("Segoe UI", 9)
        )
        self.openai_model_combo.pack(fill="x", pady=(0, 4))
        self.openai_model_combo.set(find_combobox_display_value(self.config.get("openai_model", "gpt-4o-mini"), include_default=False, provider_filter="openai"))
        self.openai_model_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_active_models_summary())
        self.openai_model_combo.bind("<KeyRelease>", lambda e: self._refresh_active_models_summary())

        # ── 6. OpenRouter ──
        self._settings_section(inner, "🌐 OpenRouter")

        openrouter_frame = tk.Frame(inner, bg=COLORS["bg_card"], padx=16, pady=12)
        openrouter_frame.pack(fill="x", padx=8, pady=(0, 12))

        key_header_r = tk.Frame(openrouter_frame, bg=COLORS["bg_card"])
        key_header_r.pack(fill="x", pady=(0, 2))
        tk.Label(key_header_r, text="API Key:", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(side="left")
        self.lbl_openrouter_key_status = tk.Label(key_header_r, text="", font=("Segoe UI", 8, "bold"), bg=COLORS["bg_card"])
        self.lbl_openrouter_key_status.pack(side="right")

        self.openrouter_key_entry = tk.Entry(
            openrouter_frame, font=("Consolas", 10), show="•",
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            insertbackground=COLORS["accent"], relief="flat",
        )
        self.openrouter_key_entry.pack(fill="x", pady=(2, 6))
        self.openrouter_key_entry.insert(0, self.config.get("openrouter_api_key", ""))
        self.openrouter_key_entry.bind("<KeyRelease>", lambda e: self._on_key_entry_changed("openrouter"))

        ctrl_row_r = tk.Frame(openrouter_frame, bg=COLORS["bg_card"])
        ctrl_row_r.pack(fill="x", pady=(0, 8))

        self.show_openrouter_key = tk.BooleanVar(value=False)
        tk.Checkbutton(
            ctrl_row_r, text="إظهار المفتاح",
            variable=self.show_openrouter_key,
            font=("Segoe UI", 8), fg=COLORS["fg_dim"], bg=COLORS["bg_card"],
            selectcolor=COLORS["bg_input"],
            command=lambda: self.openrouter_key_entry.configure(show="" if self.show_openrouter_key.get() else "•"),
        ).pack(side="left")

        btn_test_r = tk.Button(
            ctrl_row_r, text="⚡ فحص اتصال OpenRouter",
            font=("Segoe UI", 8, "bold"),
            fg=COLORS["fg"], bg=COLORS["bg_input"],
            activeforeground=COLORS["accent"], activebackground=COLORS["bg_secondary"],
            relief="flat", padx=10, pady=2, cursor="hand2",
            command=lambda: self._run_connection_test("openrouter", self.openrouter_key_entry.get().strip(), clean_model_id(self.openrouter_model_combo.get()) or self.openrouter_model_combo.get().strip())
        )
        btn_test_r.pack(side="right")

        tk.Label(openrouter_frame, text="النموذج الافتراضي لـ OpenRouter (اختر أو اكتب):", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["bg_card"]).pack(anchor="w", pady=(4, 2))
        openrouter_model_opts = get_model_combobox_list(include_default=False, provider_filter="openrouter")
        self.openrouter_model_combo = ttk.Combobox(
            openrouter_frame, values=openrouter_model_opts,
            font=("Segoe UI", 9)
        )
        self.openrouter_model_combo.pack(fill="x", pady=(0, 4))
        self.openrouter_model_combo.set(find_combobox_display_value(self.config.get("openrouter_model", "google/gemini-2.0-flash-001"), include_default=False, provider_filter="openrouter"))
        self.openrouter_model_combo.bind("<<ComboboxSelected>>", lambda e: self._refresh_active_models_summary())
        self.openrouter_model_combo.bind("<KeyRelease>", lambda e: self._refresh_active_models_summary())

        # ── 7. أسماء الملفات ──
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

        # ── 8. تصدير الفلاش كاردز ──
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

        # ── زر حفظ الإعدادات ──
        save_btn_frame = tk.Frame(inner, bg=COLORS["bg"], pady=12)
        save_btn_frame.pack(fill="x", padx=8)

        tk.Button(
            save_btn_frame, text="💾 حفظ جميع الإعدادات",
            font=("Segoe UI", 11, "bold"),
            fg=COLORS["bg"], bg=COLORS["success"],
            activeforeground=COLORS["bg"], activebackground="#7dd3a0",
            relief="flat", padx=20, pady=10,
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
        """عند تغيير مزود AI الافتراضي."""
        self.config["provider"] = self.provider_var.get()
        self._refresh_all_badges()
        self._refresh_active_models_summary()

    def _save_settings(self):
        """حفظ جميع الإعدادات."""
        self.config["provider"] = self.provider_var.get()
        self.config["gemini_api_key"] = self.gemini_key_entry.get().strip()
        self.config["gemini_model"] = clean_model_id(self.gemini_model_combo.get()) or self.gemini_model_combo.get().strip() or "gemini-2.0-flash"
        self.config["openai_api_key"] = self.openai_key_entry.get().strip()
        self.config["openai_model"] = clean_model_id(self.openai_model_combo.get()) or self.openai_model_combo.get().strip() or "gpt-4o-mini"
        self.config["openrouter_api_key"] = self.openrouter_key_entry.get().strip()
        self.config["openrouter_model"] = clean_model_id(self.openrouter_model_combo.get()) or self.openrouter_model_combo.get().strip() or "google/gemini-2.0-flash-001"

        # حفظ الموديل المخصص لكل مهمة
        for p_key in ["prompt_1", "prompt_2", "prompt_3"]:
            cb = self.settings_prompt_combos.get(p_key)
            if cb:
                val = cb.get().strip()
                clean_id = clean_model_id(val)
                if not clean_id or "الافتراضي" in val or "⭐" in val:
                    self.config[f"{p_key}_model"] = ""
                else:
                    prov = detect_provider(val)
                    self.config[f"{p_key}_model"] = f"{prov}:{clean_id}"

        # حفظ إعدادات تصدير الفلاش كاردز
        self.config["flashcard_export_enabled"] = self.flashcard_export_var.get()

        for key, entry in self.file_entries.items():
            self.config[key] = entry.get().strip()

        save_config(self.config)
        self._refresh_all_badges()
        self._refresh_active_models_summary()
        self._log("✅ تم حفظ جميع الإعدادات وتحديث النماذج بنجاح")
        messagebox.showinfo("تم الحفظ 💾", "تم حفظ جميع الإعدادات وتحديث النماذج بنجاح!")

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

        # استخراج المزودات والموديلات الفعلية لكل مهمة
        prompt_tasks = [
            ("prompt_1", "1️⃣ الترجمة مع التنسيق"),
            ("prompt_2", "2️⃣ التبسيط والشرح"),
            ("prompt_3", "3️⃣ بطاقات الفلاش كارد"),
        ]

        effective_models = {}
        needed_providers = set()

        for key, name in prompt_tasks:
            prov, mod, _, _ = resolve_effective_model(self.config, key)
            effective_models[key] = (prov, mod)
            needed_providers.add(prov)

        # التحقق من وجود مفتاح API لكل مزود مطلوب
        missing_keys = []
        for prov in needed_providers:
            key_val = self.config.get(f"{prov}_api_key", "").strip()
            if not key_val:
                tasks_using = [name for k, name in prompt_tasks if effective_models[k][0] == prov]
                missing_keys.append(f"• مزود {prov.upper()}: مطلوب لـ ({', '.join(tasks_using)})")

        if missing_keys:
            messagebox.showerror(
                "مفاتيح API مفقودة",
                "لا يمكن بدء المعالجة لأن بعض المفاتيح غير مضافة:\n\n"
                + "\n".join(missing_keys) +
                "\n\nيرجى التوجه لتبويب 'الإعدادات' وإدخال المفتاح أولاً."
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
            args=(effective_models,),
            daemon=True,
        )
        thread.start()

    def _process_thread(self, effective_models: dict):
        """Thread المعالجة الفعلية."""
        try:
            # ── 1. استخراج المحتوى (PDF أو PowerPoint) ──
            is_ppt = is_powerpoint_file(self.pdf_path)
            converted_pdf = None
            if is_ppt:
                self._update_status("📊 جاري فحص وتحويل عرض PowerPoint إلى PDF...", 3)
                self._log("📊 تم اكتشاف عرض PowerPoint — جاري التحويل فائق الدقة إلى PDF عبر PowerPoint...")
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

            # إظهار الموديلات الفعالة لكل مهمة في السجل للمستخدم
            self._log("⚙️ النماذج والمزودات المعتمدة للمعالجة:")
            self._log(f"   1️⃣ الترجمة: [{effective_models['prompt_1'][0].upper()}] {effective_models['prompt_1'][1]}")
            self._log(f"   2️⃣ التبسيط: [{effective_models['prompt_2'][0].upper()}] {effective_models['prompt_2'][1]}")
            self._log(f"   3️⃣ البطاقات: [{effective_models['prompt_3'][0].upper()}] {effective_models['prompt_3'][1]}")
            self._log("🔗 السلسلة: الترجمة (الأصل + المخططات) → التبسيط (الشرح) → البطاقات (الفلاش كارد)")

            self._update_status(f"✅ تم استخراج {len(pages)} صفحة ({chunks_count} دفعة)", 10)

            # ── 2. تجهيز معالجات الذكاء الاصطناعي ──
            needed_providers = {prov for prov, _ in effective_models.values()}
            processors = {}
            for prov in needed_providers:
                prov_key = self.config.get(f"{prov}_api_key", "").strip()
                processors[prov] = AIProcessor(prov, prov_key, None, self.config)

            # الحصول على الـ Prompts الحالية من المحررات
            current_prompts = {}
            for key, editor in self.prompt_editors.items():
                current_prompts[key] = editor.get("1.0", "end-1c")

            def ai_progress(step, total, message):
                # تحويل تقدم AI إلى 10%-90%
                pct = 10 + int(80 * step / total)
                self._update_status(f"🤖 {message}", pct)
                self._log(f"  {message}")

            # معالجة السلسلة
            ai_results = self._process_multi_provider(
                pages, current_prompts, effective_models, processors, ai_progress
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

            # إذا كان الملف الأصلي PowerPoint، نحفظ نسخة PDF المحولة داخل مجلد المخرجات مع ملفات Word
            if is_ppt:
                import shutil
                target_pdf_path = os.path.join(output_folder, f"{pdf_name}.pdf")
                if converted_pdf and os.path.exists(converted_pdf):
                    try:
                        if os.path.abspath(converted_pdf) != os.path.abspath(target_pdf_path):
                            shutil.copy2(converted_pdf, target_pdf_path)
                            # تنظيف النسخة المؤقتة إن كانت تحمل لاحقة _converted.pdf
                            if converted_pdf.endswith("_converted.pdf"):
                                try:
                                    os.remove(converted_pdf)
                                except Exception:
                                    pass
                        created.append(target_pdf_path)
                    except Exception as copy_err:
                        self._log(f"⚠️ تعذر نقل ملف PDF إلى مجلد المخرجات: {copy_err}")
                else:
                    # محاولة إنشاء PDF مباشرة في مجلد المخرجات لو لم يكن متوفراً
                    try:
                        new_pdf = convert_pptx_to_pdf(self.pdf_path, output_pdf_path=target_pdf_path)
                        if new_pdf and os.path.exists(new_pdf):
                            created.append(new_pdf)
                    except Exception as conv_err:
                        self._log(f"⚠️ تعذر إنشاء ملف PDF من PowerPoint: {conv_err}")

            self.output_folder_path = output_folder
            self._log(f"📝 تم إنشاء {len(created)} ملفات في المجلد:")

            for f in created:
                ext = os.path.splitext(f)[1].lower()
                icon = "📑" if ext == ".pdf" else "📄"
                extra = " (ملف PDF المحول من PowerPoint)" if ext == ".pdf" else ""
                self._log(f"   {icon} {os.path.basename(f)}{extra}")

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

                # طلب من AI اقتراح الأسماء (باستخدام معالج الترجمة أو المتاح)
                try:
                    p1_prov, p1_mod = effective_models["prompt_1"]
                    naming_proc = processors.get(p1_prov) or list(processors.values())[0]
                    deck_info = naming_proc.suggest_deck_info(
                        ai_results["translation"],
                        use_provider=p1_prov,
                        use_model=p1_mod,
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

    def _process_multi_provider(self, pages, prompts, effective_models, processors, progress_callback):
        """
        معالجة السلسلة عبر المزودات والنماذج المحددة لكل مهمة.
        كل prompt يستخدم المعالج والنموذج المخصص له.
        السلسلة: Prompt1(PDF) → Prompt2(نتيجة 1) → Prompt3(نتيجة 2)
        """
        import time
        from ai_processor import PROMPT_1_TRANSLATION, PROMPT_2_SIMPLIFIED, PROMPT_3_FLASHCARDS

        results = {}

        p1 = prompts.get("prompt_1", PROMPT_1_TRANSLATION)
        p2 = prompts.get("prompt_2", PROMPT_2_SIMPLIFIED)
        p3 = prompts.get("prompt_3", PROMPT_3_FLASHCARDS)

        prov1, mod1 = effective_models["prompt_1"]
        prov2, mod2 = effective_models["prompt_2"]
        prov3, mod3 = effective_models["prompt_3"]

        proc1 = processors[prov1]
        proc2 = processors[prov2]
        proc3 = processors[prov3]

        # ── Prompt 1: الترجمة — على محتوى PDF الأصلي ──
        label1 = f" [{prov1.upper()}: {mod1}]"
        if progress_callback:
            progress_callback(1, 6, f"جاري إنشاء: الترجمة{label1}...")

        results["translation"] = proc1.process_chunked(
            pages, p1, use_provider=prov1, use_model=mod1,
            progress_callback=lambda c, t, m: progress_callback(1, 6, f"الترجمة{label1}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ── Prompt 2: التبسيط — على نتيجة Prompt 1 ──
        label2 = f" [{prov2.upper()}: {mod2}]"
        if progress_callback:
            progress_callback(3, 6, f"جاري إنشاء: التبسيط{label2} (معتمد على الترجمة)...")

        results["simplified"] = proc2.process_text_chunked(
            results["translation"], p2, use_provider=prov2, use_model=mod2,
            progress_callback=lambda c, t, m: progress_callback(3, 6, f"التبسيط{label2}: {m}") if progress_callback else None
        )
        time.sleep(3)

        # ── Prompt 3: فلاش كارد — على نتيجة Prompt 2 ──
        # (مستثنى من قاعدة الـ 10 صفحات — يرسل كل المحتوى مرة واحدة)
        label3 = f" [{prov3.upper()}: {mod3}]"
        if progress_callback:
            progress_callback(5, 6, f"جاري إنشاء: بطاقات الفلاش كارد{label3} (معتمد على التبسيط)...")

        results["flashcards"] = proc3.process(
            results["simplified"], p3, use_provider=prov3, use_model=mod3
        )

        if progress_callback:
            progress_callback(6, 6, "تمت المعالجة الذكية بالكامل!")

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
