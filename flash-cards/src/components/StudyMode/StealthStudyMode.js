import React, { useState, useEffect, useCallback, useRef } from 'react';
import './StealthStudyMode.css';

const StealthStudyMode = ({
  deck,
  cards = [],
  currentIndex = 0,
  onIndexChange,
  onToggleKnown,
  onToggleStyle,
  onBack,
  onUndo,
  canUndo = false,
  smartModeEnabled = false,
  onToggleSmartMode,
  reviewMode = false,
  unmasteredCount = 0,
  unmasteredLimit = 6,
  shuffleMode = false,
  onToggleShuffle,
  onResetProgress,
}) => {
  const [localPdfUrl, setLocalPdfUrl] = useState(() => {
    try {
      return sessionStorage.getItem(`deck_pdf_url_${deck?.id}`) || null;
    } catch {
      return null;
    }
  });

  const [documentTitle, setDocumentTitle] = useState(() => {
    const raw = deck?.title || 'Lecture_Notes';
    return `${raw.replace(/\s+/g, '_')}_Slides.pdf`;
  });

  const [isRevealed, setIsRevealed] = useState(false);
  const [showNotesSidebar, setShowNotesSidebar] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);

  const currentCard = cards[currentIndex] || null;

  // إعادة ضبط الكشف عند تغيير البطاقة
  useEffect(() => {
    setIsRevealed(false);
  }, [currentIndex]);

  // استعراض ملف PDF محلي
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setLocalPdfUrl(url);
      setDocumentTitle(file.name);
      try {
        sessionStorage.setItem(`deck_pdf_url_${deck?.id}`, url);
      } catch {}
    }
  };

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleNextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, cards.length, onIndexChange]);

  const handleToggleKnown = useCallback(() => {
    if (currentCard && onToggleKnown) {
      onToggleKnown(currentCard.id);
    }
  }, [currentCard, onToggleKnown]);

  // اختصارات لوحة المفاتيح المتخفية
  useEffect(() => {
    const handleKeyDown = (e) => {
      // زر الطوارئ Esc: إغلاق فوري لشريط الملاحظات والبطاقات
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowNotesSidebar((prev) => !prev);
        return;
      }

      // اختصار التراجع (Ctrl+Z أو حرف u)
      if ((e.ctrlKey && e.key === 'z') || e.key === 'u' || e.key === 'U') {
        if (canUndo && onUndo) {
          e.preventDefault();
          onUndo();
          return;
        }
      }

      // إذا كان شريط الملاحظات مغلقاً، لا نعترض مفاتيح التمرير في الـ PDF
      if (!showNotesSidebar) return;

      if (e.key === ' ') {
        e.preventDefault();
        setIsRevealed((prev) => !prev);
      } else if (e.key === 'Enter' || e.key === '2') {
        e.preventDefault();
        handleToggleKnown();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextCard();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNotesSidebar, handleNextCard, handlePrevCard, handleToggleKnown, canUndo, onUndo]);

  return (
    <div className="stealth-fullscreen-container">
      {/* مدخل ملف مخفي لاختيار ملف PDF محلي */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* ── شريط أدوات Google Chrome PDF الأصلي (#323639) ── */}
      <header className="chrome-pdf-topbar">
        {/* اليسار: أيقونة القائمة واسم الملف */}
        <div className="chrome-bar-section">
          <button
            className="chrome-icon-btn"
            title="تبديل شريط الملاحظات"
            onClick={() => setShowNotesSidebar((prev) => !prev)}
          >
            ☰
          </button>

          <span
            className="chrome-doc-title"
            onClick={() => fileInputRef.current?.click()}
            title="انقر لاختيار ملف PDF من جهازك"
          >
            {documentTitle}
          </span>
        </div>

        {/* الوسط: عداد الصفحات، التقريب، خيارات الدراسة الذكية */}
        <div className="chrome-bar-section">
          <div className="chrome-page-box">
            <input
              type="text"
              className="chrome-page-input"
              value={currentIndex + 1}
              readOnly
            />
            <span>/ {cards.length || 1}</span>
          </div>

          <div className="chrome-divider"></div>

          <button
            className="chrome-icon-btn"
            onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
            title="تصغير (-)"
          >
            −
          </button>
          <span style={{ fontSize: '12px', color: '#d1d5db', minWidth: '36px', textAlign: 'center' }}>
            {zoomLevel}%
          </span>
          <button
            className="chrome-icon-btn"
            onClick={() => setZoomLevel((prev) => Math.min(160, prev + 10))}
            title="تكبير (+)"
          >
            +
          </button>

          <div className="chrome-divider"></div>

          {/* زر وضع التركيز الذكي (Smart Focus Mode - 6 بطاقات) */}
          {onToggleSmartMode && (
            <button
              className="chrome-badge-btn"
              onClick={onToggleSmartMode}
              style={{
                backgroundColor: smartModeEnabled ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                color: smartModeEnabled ? '#a5b4fc' : '#d1d5db',
                borderColor: smartModeEnabled ? '#818cf8' : 'rgba(255, 255, 255, 0.15)',
              }}
              title="تفعيل/تعطيل نظام التركيز الذكي (حصر الدراسة في 6 بطاقات غير متقنة)"
            >
              <span>🎯</span>
              <span>
                {smartModeEnabled
                  ? `نظام التركيز (${unmasteredCount}/${unmasteredLimit})`
                  : 'نظام التركيز'}
              </span>
            </button>
          )}

          {/* زر الخلط (Shuffle) */}
          {onToggleShuffle && (
            <button
              className="chrome-badge-btn"
              onClick={onToggleShuffle}
              style={{
                backgroundColor: shuffleMode ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                color: shuffleMode ? '#a5b4fc' : '#d1d5db',
                borderColor: shuffleMode ? '#818cf8' : 'rgba(255, 255, 255, 0.15)',
              }}
              title="خلط ترتيب البطاقات"
            >
              <span>🔀</span>
              <span>{shuffleMode ? 'خلط: مفعل' : 'خلط'}</span>
            </button>
          )}

          {/* زر التراجع السريع في الشريط العلوي */}
          {canUndo && onUndo && (
            <button
              className="chrome-badge-btn"
              onClick={onUndo}
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.18)',
                color: '#fbbf24',
                borderColor: 'rgba(245, 158, 11, 0.35)',
              }}
              title="تراجع عن آخر بطاقة تم تحديدها كمعروفة (Ctrl+Z)"
            >
              <span>↩</span>
              <span>تراجع</span>
            </button>
          )}
        </div>

        {/* اليمين: زر فتح ملف، تعليقات، تمويه، خيارات */}
        <div className="chrome-bar-section">
          <button
            className="chrome-open-btn"
            onClick={() => fileInputRef.current?.click()}
            title="فتح ملف PDF من جهازك محلياً (بدون رفعه إلى السيرفر)"
          >
            <span>📂</span>
            <span>{localPdfUrl ? 'تغيير PDF' : 'فتح ملف PDF'}</span>
          </button>

          <button
            className="chrome-badge-btn"
            onClick={() => setShowNotesSidebar((prev) => !prev)}
            title="إظهار/إخفاء ملاحظات الفلاش كارد المتخفية (Esc)"
          >
            <span>💬</span>
            <span>{showNotesSidebar ? 'إخفاء الملاحظات (Esc)' : 'الملاحظات (Space)'}</span>
          </button>

          {/* قائمة الخيارات الثلاث نقاط */}
          <div style={{ position: 'relative' }}>
            <button
              className="chrome-icon-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              title="خيارات إضافية"
            >
              ⋮
            </button>

            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  backgroundColor: '#282a2d',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  width: '210px',
                  padding: '6px 0',
                  zIndex: 1000,
                  fontSize: '13px',
                }}
              >
                <div
                  style={{ padding: '8px 16px', cursor: 'pointer', color: '#f1f5f9' }}
                  onClick={() => {
                    setShowMenu(false);
                    onToggleStyle();
                  }}
                >
                  🎴 النمط العادي (بطاقات 3D)
                </div>
                {onResetProgress && (
                  <div
                    style={{ padding: '8px 16px', cursor: 'pointer', color: '#fbbf24' }}
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm('هل تريد إعادة ضبط تقدم هذه المجموعة بالكامل؟')) {
                        onResetProgress();
                      }
                    }}
                  >
                    🔄 إعادة ضبط التقدم
                  </div>
                )}
                {localPdfUrl && (
                  <div
                    style={{ padding: '8px 16px', cursor: 'pointer', color: '#fca5a5' }}
                    onClick={() => {
                      setShowMenu(false);
                      setLocalPdfUrl(null);
                      sessionStorage.removeItem(`deck_pdf_url_${deck?.id}`);
                    }}
                  >
                    🗑️ إزالة ملف PDF المحمّل
                  </div>
                )}
                <div
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  onClick={() => {
                    setShowMenu(false);
                    onBack();
                  }}
                >
                  ✕ إغلاق والرجوع للموقع
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── جسم عارض السلايدات ── */}
      <div className="chrome-pdf-body">
        {/* العارض الأساسي للسلايدات */}
        {localPdfUrl ? (
          <iframe
            src={`${localPdfUrl}#toolbar=1&navpanes=1`}
            title={documentTitle}
            className="chrome-native-pdf-frame"
          />
        ) : (
          <div className="chrome-pdf-canvas-container">
            <div
              className="chrome-pdf-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ fontSize: '48px', color: '#6366f1' }}>📂</div>
              <h3>افتح سلايدات المحاضرة (ملف PDF)</h3>
              <p>
                انقر هنا لاختيار ملف السلايدات الخاص بهذه المحاضرة من جهازك.
                <br />
                <strong style={{ color: '#10b981', display: 'block', marginTop: '6px' }}>
                  ✓ الملف يعمل في متصفحك محلياً 100% دون رفعه إلى السيرفر (حفاظاً على سرعة وحجم الموقع).
                </strong>
              </p>
              <button
                className="chrome-open-btn"
                style={{ marginTop: '15px', padding: '8px 18px', background: '#3b82f6' }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                اختر ملف PDF من جهازك
              </button>
            </div>
          </div>
        )}

        {/* ── شريط الملاحظات والتعليقات المتخفي (Comments & Annotations) ── */}
        <aside
          className={`chrome-comments-sidebar ${!showNotesSidebar ? 'collapsed' : ''}`}
        >
          <div className="comments-sidebar-header">
            <span>📝 Lecture Notes ({currentIndex + 1}/{cards.length})</span>
            <button
              className="chrome-icon-btn"
              style={{ width: '24px', height: '24px', color: '#6b7280' }}
              onClick={() => setShowNotesSidebar(false)}
              title="إخفاء (Esc)"
            >
              ✕
            </button>
          </div>

          <div className="comments-sidebar-content">
            {currentCard ? (
              <div className="pdf-sticky-note">
                <div className="sticky-note-header">
                  <span>Note &bull; Slide {currentIndex + 1}</span>
                  {currentCard.known && (
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>✓ تم الفهم</span>
                  )}
                </div>

                {/* السؤال */}
                <h4 className="sticky-note-question">{currentCard.question}</h4>

                {/* الجواب يظهر كرد أو شرح تفصيلي للملاحظة */}
                <div className="sticky-note-reply">
                  <div
                    className="reply-header"
                    onClick={() => setIsRevealed((prev) => !prev)}
                  >
                    <span>Explanation & Solution</span>
                    <span style={{ color: '#6366f1' }}>
                      {isRevealed ? 'إخفاء' : 'عرض (Space)'}
                    </span>
                  </div>

                  {isRevealed ? (
                    <p className="reply-text">{currentCard.answer}</p>
                  ) : (
                    <div
                      className="reply-hidden-placeholder"
                      onClick={() => setIsRevealed(true)}
                    >
                      اضغط هنا أو زر Space لعرض الشرح...
                    </div>
                  )}
                </div>

                {/* أزرار الحالة: تم الفهم والتراجع فقط */}
                <div className="sticky-note-actions">
                  <button
                    className={`note-action-btn ${currentCard.known ? 'active-known' : ''}`}
                    onClick={handleToggleKnown}
                    title="تحديد كمفهوم معروف (Enter أو 2)"
                  >
                    <span>✓</span>
                    <span>{currentCard.known ? 'معروف ومتقن' : 'تم الفهم'}</span>
                  </button>

                  <button
                    className="note-action-btn"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="تراجع عن آخر بطاقة تم تحديدها كمعروفة (Ctrl+Z أو U)"
                  >
                    <span>↩</span>
                    <span>تراجع</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '30px 0' }}>
                لا توجد بطاقات للعرض
              </div>
            )}
          </div>

          {/* تذييل شريط الملاحظات: أزرار التنقل والاختصارات */}
          <footer className="comments-sidebar-footer">
            <button
              className="note-action-btn"
              style={{ flex: 'none', padding: '4px 12px' }}
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
            >
              ◀ السابق
            </button>

            <span className="nav-hint-text">
              <span className="nav-hint-kbd">Space</span> كشف &bull;{' '}
              <span className="nav-hint-kbd">Esc</span> تمويه
            </span>

            <button
              className="note-action-btn"
              style={{ flex: 'none', padding: '4px 12px' }}
              onClick={handleNextCard}
              disabled={currentIndex === cards.length - 1}
            >
              التالي ▶
            </button>
          </footer>
        </aside>

        {/* زر عائم صغير لفتح الملاحظات عند إخفائها */}
        {!showNotesSidebar && (
          <button
            className="floating-notes-toggle"
            onClick={() => setShowNotesSidebar(true)}
            title="فتح ملاحظات الفلاش كارد (Space أو Esc)"
          >
            <span>💬</span>
            <span>ملاحظات ({currentIndex + 1}/{cards.length})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default StealthStudyMode;
