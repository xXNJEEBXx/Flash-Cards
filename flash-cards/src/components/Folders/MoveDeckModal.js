import React, { useState, useMemo } from 'react';
import './MoveFolderModal.css'; // Reuses the same polished modal styling

/**
 * Helper to build a flat list of all folders with tree indentation
 */
const flattenFolders = (foldersList, depth = 0) => {
    let result = [];
    for (const f of foldersList) {
        result.push({
            id: f.id,
            name: f.name,
            depth,
            folder: f,
        });
        if (f.subfolders && f.subfolders.length > 0) {
            result = result.concat(flattenFolders(f.subfolders, depth + 1));
        }
    }
    return result;
};

const MoveDeckModal = ({ deck, folders = [], onMove, onClose }) => {
    const currentFolderId = deck?.folder_id || null;
    const [selectedDestination, setSelectedDestination] = useState(currentFolderId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const flattened = useMemo(() => {
        return flattenFolders(folders);
    }, [folders]);

    if (!deck) return null;

    const isCurrentLocation = (selectedDestination === null && currentFolderId === null) ||
        (selectedDestination !== null && String(selectedDestination) === String(currentFolderId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCurrentLocation) {
            setErrorMsg('المجموعة موجودة بالفعل في هذا المجلد');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');
        try {
            await onMove(deck.id, selectedDestination);
            onClose();
        } catch (err) {
            console.error('Failed to move deck:', err);
            setErrorMsg(err.message || 'فشل نقل المجموعة، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="move-folder-overlay" onClick={onClose}>
            <div className="move-folder-container" onClick={(e) => e.stopPropagation()}>
                <div className="move-folder-header">
                    <div className="move-folder-title-area">
                        <span className="move-folder-icon">🎯</span>
                        <div>
                            <h3>نقل المجموعة (Move Deck)</h3>
                            <p className="move-folder-target-name">"{deck.title}"</p>
                        </div>
                    </div>
                    <button className="move-folder-close-btn" onClick={onClose} title="إغلاق">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="move-folder-body">
                    <p className="move-folder-instruction">
                        اختر المجلد الذي تريد نقل هذه المجموعة إليه:
                    </p>

                    {errorMsg && (
                        <div className="move-folder-error">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <div className="move-folder-destinations-list">
                        {/* Option 1: Root / Main View */}
                        <div
                            className={`destination-item ${selectedDestination === null ? 'selected' : ''} ${currentFolderId === null ? 'is-current' : ''}`}
                            onClick={() => setSelectedDestination(null)}
                        >
                            <span className="destination-icon">🏠</span>
                            <span className="destination-name">
                                الصفحة الرئيسية (بدون مجلد / Root)
                            </span>
                            {currentFolderId === null && (
                                <span className="current-badge">الموقع الحالي</span>
                            )}
                        </div>

                        {/* All Available Folders */}
                        {flattened.map((item) => {
                            const isCurrent = String(currentFolderId) === String(item.id);
                            const isSelected = String(selectedDestination) === String(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`destination-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'is-current' : ''}`}
                                    style={{ paddingRight: `${14 + item.depth * 20}px` }}
                                    onClick={() => setSelectedDestination(item.id)}
                                >
                                    <span className="destination-icon">
                                        {item.depth > 0 ? '↳ 📂' : '📁'}
                                    </span>
                                    <span className="destination-name">{item.name}</span>
                                    {isCurrent && (
                                        <span className="current-badge">الموقع الحالي</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="move-folder-footer">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="btn-submit-move"
                            disabled={isSubmitting || isCurrentLocation}
                        >
                            {isSubmitting ? 'جاري النقل...' : 'نقل المجموعة الآن'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoveDeckModal;
