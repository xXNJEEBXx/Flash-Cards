import React, { useState, useEffect } from 'react';
import './ReorderDecksModal.css';

const ReorderDecksModal = ({ decks = [], onSave, onClose, folderName = '' }) => {
    const [items, setItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Initialize items with current decks
    useEffect(() => {
        setItems([...decks]);
    }, [decks]);

    // Move single item up
    const moveUp = (index) => {
        if (index <= 0) return;
        setItems(prev => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index - 1];
            next[index - 1] = temp;
            return next;
        });
    };

    // Move single item down
    const moveDown = (index) => {
        if (index >= items.length - 1) return;
        setItems(prev => {
            const next = [...prev];
            const temp = next[index];
            next[index] = next[index + 1];
            next[index + 1] = temp;
            return next;
        });
    };

    // Move single item to top
    const moveToTop = (index) => {
        if (index <= 0) return;
        setItems(prev => {
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.unshift(item);
            return next;
        });
    };

    // Move single item to bottom
    const moveToBottom = (index) => {
        if (index >= items.length - 1) return;
        setItems(prev => {
            const next = [...prev];
            const [item] = next.splice(index, 1);
            next.push(item);
            return next;
        });
    };

    // Smart natural sort (handles Chapter 1, Chapter 2, Chapter 3, L1, L2, L10, etc.)
    const sortByChapter = () => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        const sorted = [...items].sort((a, b) => collator.compare(a.title || '', b.title || ''));
        setItems(sorted);
        setStatusMsg('✨ تم تطبيق الترتيب الذكي للأرقام والفصول');
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Alphabetical sort (A-Z)
    const sortByAlphabetical = () => {
        const sorted = [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setItems(sorted);
        setStatusMsg('🔤 تم تطبيق الترتيب الأبجدي');
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Reverse order
    const reverseOrder = () => {
        setItems(prev => [...prev].reverse());
        setStatusMsg('🔄 تم عكس الترتيب');
        setTimeout(() => setStatusMsg(''), 3000);
    };

    // Drag & Drop handlers
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        setItems(prev => {
            const next = [...prev];
            const [draggedItem] = next.splice(draggedIndex, 1);
            next.splice(targetIndex, 0, draggedItem);
            return next;
        });

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Save handler
    const handleSave = async () => {
        setIsSaving(true);
        setStatusMsg('جاري حفظ الترتيب الجديد...');
        try {
            const orderedDeckIds = items.map(d => d.id);
            await onSave(orderedDeckIds);
            setStatusMsg('✅ تم حفظ الترتيب بنجاح!');
            setTimeout(() => {
                onClose();
            }, 600);
        } catch (error) {
            console.error('Failed to save reorder:', error);
            setStatusMsg('❌ فشل حفظ الترتيب: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="reorder-decks-overlay" onClick={onClose}>
            <div className="reorder-decks-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="reorder-decks-header">
                    <div className="reorder-decks-title-area">
                        <span className="reorder-decks-icon">↕️</span>
                        <div>
                            <h3>إعادة ترتيب المجموعات (Reorder Decks)</h3>
                            <p className="reorder-decks-subtitle">
                                {folderName ? `في المجلد: ${folderName}` : 'ترتيب مجموعات البطاقات حسب رغبتك'}
                            </p>
                        </div>
                    </div>
                    <button className="reorder-decks-close-btn" onClick={onClose} title="إغلاق">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="reorder-decks-body">
                    {/* Quick Smart Presets */}
                    <div className="reorder-presets-toolbar">
                        <button
                            type="button"
                            className="preset-btn highlight"
                            onClick={sortByChapter}
                            title="ترتيب تلقائي ذكي حسب رقم الشابتر والدرس (Chapter 1, 2, 3...)"
                        >
                            <span>🔢</span>
                            <span>ترتيب ذكي للفصول (Chapter 1, 2, 3...)</span>
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={sortByAlphabetical}
                            title="ترتيب أبجدي من أ إلى ي"
                        >
                            <span>🔤</span>
                            <span>أبجدي (A - Z)</span>
                        </button>
                        <button
                            type="button"
                            className="preset-btn"
                            onClick={reverseOrder}
                            title="عكس الترتيب الحالي"
                        >
                            <span>🔄</span>
                            <span>عكس الترتيب</span>
                        </button>
                    </div>

                    <div className="reorder-list-instruction">
                        <span>اسحب المجموعة للأعلى أو للأسفل، أو استخدم الأسهم (⬆️ ⬇️):</span>
                        <span>{items.length} مجموعة</span>
                    </div>

                    {/* Decks Reorder List */}
                    <div className="reorder-items-list">
                        {items.map((deck, index) => {
                            const isFirst = index === 0;
                            const isLast = index === items.length - 1;
                            const isDraggingThis = draggedIndex === index;
                            const isOverThis = dragOverIndex === index;

                            return (
                                <div
                                    key={deck.id}
                                    className={`reorder-item ${isDraggingThis ? 'is-dragging' : ''} ${isOverThis ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    {/* Drag Handle */}
                                    <div className="reorder-drag-handle" title="اسحب لإعادة الترتيب">
                                        ⠿
                                    </div>

                                    {/* Number Badge */}
                                    <div className="reorder-item-number">
                                        {index + 1}
                                    </div>

                                    {/* Info */}
                                    <div className="reorder-item-info">
                                        <span className="reorder-item-title" title={deck.title}>
                                            {deck.title}
                                        </span>
                                        <span className="reorder-item-meta">
                                            <span>🗃️ {deck.cards?.length || 0} بطاقة</span>
                                        </span>
                                    </div>

                                    {/* Quick Arrow Buttons */}
                                    <div className="reorder-item-actions">
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={() => moveToTop(index)}
                                            disabled={isFirst}
                                            title="إلى البداية مباشرة"
                                        >
                                            ⏫
                                        </button>
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={() => moveUp(index)}
                                            disabled={isFirst}
                                            title="تحريك لأعلى (⬆️)"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={() => moveDown(index)}
                                            disabled={isLast}
                                            title="تحريك لأسفل (⬇️)"
                                        >
                                            ▼
                                        </button>
                                        <button
                                            type="button"
                                            className="arrow-btn"
                                            onClick={() => moveToBottom(index)}
                                            disabled={isLast}
                                            title="إلى النهاية مباشرة"
                                        >
                                            ⏬
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="reorder-decks-footer">
                    <div className="reorder-status-msg">
                        {statusMsg}
                    </div>
                    <div className="reorder-footer-btns">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            إلغاء
                        </button>
                        <button
                            type="button"
                            className="btn-save-reorder"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <span>💾</span>
                            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الترتيب'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReorderDecksModal;
