import React, { useState, useMemo } from 'react';
import './MoveFolderModal.css';

/**
 * Helper to collect all descendant IDs of a folder recursively
 */
const getDescendantIds = (folder) => {
    const ids = new Set();
    const collect = (item) => {
        if (item.subfolders && item.subfolders.length > 0) {
            for (const sub of item.subfolders) {
                ids.add(sub.id);
                collect(sub);
            }
        }
    };
    collect(folder);
    return ids;
};

/**
 * Helper to build a flat list of all folders with tree indentation
 */
const flattenFolders = (foldersList, depth = 0) => {
    let result = [];
    for (const f of foldersList) {
        result.push({
            id: f.id,
            name: f.name,
            parent_folder_id: f.parent_folder_id,
            depth,
            folder: f,
        });
        if (f.subfolders && f.subfolders.length > 0) {
            result = result.concat(flattenFolders(f.subfolders, depth + 1));
        }
    }
    return result;
};

const MoveFolderModal = ({ folder, folders = [], onMove, onClose }) => {
    // Determine the initial selection: current parent or root
    const currentParentId = folder?.parent_folder_id || null;
    const [selectedDestination, setSelectedDestination] = useState(currentParentId);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Set of forbidden IDs (the folder itself + its descendants)
    const forbiddenIds = useMemo(() => {
        if (!folder) return new Set();
        const set = getDescendantIds(folder);
        set.add(folder.id);
        return set;
    }, [folder]);

    // Flat list of available folders
    const flattened = useMemo(() => {
        return flattenFolders(folders);
    }, [folders]);

    if (!folder) return null;

    const isCurrentLocation = (selectedDestination === null && currentParentId === null) ||
        (selectedDestination !== null && String(selectedDestination) === String(currentParentId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCurrentLocation) {
            setErrorMsg('المجلد موجود بالفعل في هذا الموقع');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg('');
        try {
            await onMove(folder.id, selectedDestination);
            onClose();
        } catch (err) {
            console.error('Failed to move folder:', err);
            setErrorMsg(err.message || 'فشل نقل المجلد، يرجى المحاولة مرة أخرى');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="move-folder-overlay" onClick={onClose}>
            <div className="move-folder-container" onClick={(e) => e.stopPropagation()}>
                <div className="move-folder-header">
                    <div className="move-folder-title-area">
                        <span className="move-folder-icon">📦</span>
                        <div>
                            <h3>نقل المجلد</h3>
                            <p className="move-folder-target-name">"{folder.name}"</p>
                        </div>
                    </div>
                    <button className="move-folder-close-btn" onClick={onClose} title="إغلاق">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="move-folder-body">
                    <p className="move-folder-instruction">
                        اختر الوجهة التي تريد نقل هذا المجلد إليها:
                    </p>

                    {errorMsg && (
                        <div className="move-folder-error">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <div className="move-folder-destinations-list">
                        {/* Option 1: Root / Main View */}
                        <div
                            className={`destination-item ${selectedDestination === null ? 'selected' : ''} ${currentParentId === null ? 'is-current' : ''}`}
                            onClick={() => setSelectedDestination(null)}
                        >
                            <span className="destination-icon">🏠</span>
                            <span className="destination-name">
                                الصفحة الرئيسية (المستوى العام / بدون مجلد أب)
                            </span>
                            {currentParentId === null && (
                                <span className="current-badge">الموقع الحالي</span>
                            )}
                        </div>

                        {/* Other Folders */}
                        {flattened.map((item) => {
                            const isForbidden = forbiddenIds.has(item.id);
                            const isCurrent = String(currentParentId) === String(item.id);
                            const isSelected = String(selectedDestination) === String(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className={`destination-item ${isSelected ? 'selected' : ''} ${isForbidden ? 'disabled' : ''} ${isCurrent ? 'is-current' : ''}`}
                                    style={{ paddingRight: `${14 + item.depth * 20}px` }}
                                    onClick={() => {
                                        if (!isForbidden) {
                                            setSelectedDestination(item.id);
                                        }
                                    }}
                                >
                                    <span className="destination-icon">
                                        {item.depth > 0 ? '↳ 📂' : '📁'}
                                    </span>
                                    <span className="destination-name">{item.name}</span>
                                    {isCurrent && (
                                        <span className="current-badge">الموقع الحالي</span>
                                    )}
                                    {isForbidden && (
                                        <span className="disabled-badge">
                                            {item.id === folder.id ? 'نفس المجلد' : 'مجلد فرعي'}
                                        </span>
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
                            {isSubmitting ? 'جاري النقل...' : 'نقل المجلد الآن'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MoveFolderModal;
