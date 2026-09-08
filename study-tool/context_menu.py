"""
تثبيت/إزالة قائمة كلك يمين (Context Menu) على Windows
======================================================
يضيف خيار "PDF Study Tool" عند الضغط كلك يمين على ملف PDF.

الاستخدام:
  python context_menu.py install    ← تثبيت القائمة
  python context_menu.py uninstall  ← إزالة القائمة

⚠️ يجب تشغيله كمسؤول (Run as Administrator)
"""

import sys
import os
import ctypes
import winreg


def is_admin() -> bool:
    """التحقق من صلاحيات المسؤول."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        return False


def get_python_path() -> str:
    """الحصول على مسار Python."""
    return sys.executable


def get_script_path() -> str:
    """الحصول على مسار gui.py."""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), "gui.py")


def install_context_menu():
    """تثبيت قائمة كلك يمين لملفات PDF."""
    python_path = get_python_path()
    script_path = get_script_path()

# مسارات Registry للملفات المدعومة
TARGET_EXTENSIONS = [".pdf", ".pptx", ".ppt"]


def install_context_menu():
    """تثبيت قائمة كلك يمين لملفات PDF و PowerPoint."""
    python_path = get_python_path()
    script_path = get_script_path()
    command = f'"{python_path}" "{script_path}" "%1"'
    menu_name = "📚 Study Tool (PDF & PowerPoint)"

    success_count = 0

    for ext in TARGET_EXTENSIONS:
        reg_path = rf"SystemFileAssociations\{ext}\shell\PDFStudyTool"
        try:
            # إنشاء مفتاح القائمة
            key = winreg.CreateKey(winreg.HKEY_CLASSES_ROOT, reg_path)
            winreg.SetValue(key, "", winreg.REG_SZ, menu_name)
            winreg.SetValueEx(key, "Icon", 0, winreg.REG_SZ, f"{python_path},0")
            winreg.CloseKey(key)

            # إنشاء مفتاح الأمر
            cmd_key = winreg.CreateKey(winreg.HKEY_CLASSES_ROOT, reg_path + r"\command")
            winreg.SetValue(cmd_key, "", winreg.REG_SZ, command)
            winreg.CloseKey(cmd_key)

            success_count += 1
        except Exception as e:
            print(f"⚠️ تعذر تثبيت القائمة لـ {ext}: {e}")

    if success_count > 0:
        print("✅ تم تثبيت قائمة كلك يمين بنجاح لملفات PDF و PowerPoint (.pptx / .ppt)!")
        print()
        print("الآن يمكنك:")
        print("  1. اضغط كلك يمين على أي ملف PDF أو PowerPoint")
        print("  2. اختر 'Study Tool (PDF & PowerPoint)'")
        print("  3. البرنامج بيسوي مجلد فيه 3 ملفات Word")
        print()
        print(f"Python: {python_path}")
        print(f"Script: {script_path}")
    else:
        print("❌ فشل في تثبيت القوائم.")


def uninstall_context_menu():
    """إزالة قائمة كلك يمين لجميع الصيغ المدعومة."""
    for ext in TARGET_EXTENSIONS:
        reg_path = rf"SystemFileAssociations\{ext}\shell\PDFStudyTool"
        try:
            try:
                winreg.DeleteKey(winreg.HKEY_CLASSES_ROOT, reg_path + r"\command")
            except FileNotFoundError:
                pass

            try:
                winreg.DeleteKey(winreg.HKEY_CLASSES_ROOT, reg_path)
            except FileNotFoundError:
                pass

            print(f"✅ تم إزالة قائمة كلك يمين لـ {ext}")
        except Exception as e:
            print(f"⚠️ خطأ أثناء إزالة {ext}: {e}")


def main():
    print("=" * 50)
    print("   PDF Study Tool - تثبيت قائمة كلك يمين")
    print("=" * 50)
    print()

    if len(sys.argv) < 2:
        print("الاستخدام:")
        print("  python context_menu.py install    ← تثبيت")
        print("  python context_menu.py uninstall  ← إزالة")
        print()

        # واجهة تفاعلية
        choice = input("اختر (install/uninstall): ").strip().lower()
        if choice not in ("install", "uninstall"):
            print("اختيار غير صحيح.")
            input("\nاضغط Enter للإغلاق...")
            return
    else:
        choice = sys.argv[1].lower()

    if not is_admin():
        print("⚠️  يجب تشغيل البرنامج كمسؤول!")
        print("   اضغط كلك يمين → Run as Administrator")
        print()

        # محاولة إعادة التشغيل كمسؤول
        try:
            ctypes.windll.shell32.ShellExecuteW(
                None, "runas", sys.executable,
                f'"{os.path.abspath(__file__)}" {choice}',
                None, 1
            )
            return
        except Exception:
            print("❌ فشل في الحصول على صلاحيات مسؤول.")
            input("\nاضغط Enter للإغلاق...")
            return

    if choice == "install":
        install_context_menu()
    elif choice == "uninstall":
        uninstall_context_menu()
    else:
        print(f"أمر غير معروف: {choice}")

    input("\nاضغط Enter للإغلاق...")


if __name__ == "__main__":
    main()
