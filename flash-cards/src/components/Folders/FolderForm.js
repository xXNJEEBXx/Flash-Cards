import React, { useState, useMemo } from 'react';
import './FolderForm.css';

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
            depth,
            folder: f,
        });
        if (f.subfolders && f.subfolders.length > 0) {
            result = result.concat(flattenFolders(f.subfolders, depth + 1));
        }
    }
    return result;
};

const FolderForm = ({ folder, parentFolderId, folders = [], onSubmit, onCancel }) => {
    const [name, setName] = useState(folder?.name || '');
    const [description, setDescription] = useState(folder?.description || '');
    const [selectedParentId, setSelectedParentId] = useState(() => {
        if (parentFolderId !== undefined && parentFolderId !== null) {
            return String(parentFolderId);
        }
        if (folder?.parent_folder_id) {
            return String(folder.parent_folder_id);
        }
        return '';
    });
    const [errors, setErrors] = useState({});

    // Prevent selecting the folder itself or any of its descendants as parent
    const forbiddenIds = useMemo(() => {
        if (!folder) return new Set();
        const set = getDescendantIds(folder);
        set.add(folder.id);
        return set;
    }, [folder]);

    const flattenedFolders = useMemo(() => {
        return flattenFolders(folders);
    }, [folders]);

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) {
            newErrors.name = 'اسم المجلد مطلوب (Folder name is required)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit({
                name: name.trim(),
                description: description.trim(),
                parent_folder_id: selectedParentId ? parseInt(selectedParentId, 10) : null
            });
        }
    };

    return (
        <div className="folder-form-overlay" onClick={onCancel}>
            <div className="folder-form-container" onClick={(e) => e.stopPropagation()}>
                <div className="folder-form-header">
                    <h2>{folder ? 'تعديل المجلد (Edit Folder)' : 'إنشاء مجلد جديد (New Folder)'}</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>

                <form onSubmit={handleSubmit} className="folder-form">
                    <div className="form-group">
                        <label htmlFor="folder-name">
                            اسم المجلد (Folder Name) <span className="required">*</span>
                        </label>
                        <input
                            id="folder-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="مثال: الشبكات، البرمجة، الأمن السيبراني..."
                            className={errors.name ? 'error' : ''}
                            autoFocus
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="parent-folder-select">
                            المجلد الرئيسي / الموقع (Parent Folder)
                        </label>
                        <select
                            id="parent-folder-select"
                            value={selectedParentId}
                            onChange={(e) => setSelectedParentId(e.target.value)}
                            className="form-control"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                border: '1px solid #dee2e6',
                                fontSize: '14px'
                            }}
                        >
                            <option value="">🏠 الصفحة الرئيسية (مجلد رئيسي بدون مجلد أب)</option>
                            {flattenedFolders
                                .filter((item) => !forbiddenIds.has(item.id))
                                .map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {'\u00A0\u00A0'.repeat(item.depth)}📁 {item.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="folder-description">الوصف (Description)</label>
                        <textarea
                            id="folder-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف اختياري للمجلد..."
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn btn-secondary">
                            إلغاء
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {folder ? 'حفظ التعديلات' : 'إنشاء المجلد'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FolderForm;
