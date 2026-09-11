import React, { useState, useContext, useEffect, useMemo } from 'react';
import { CardsContext } from '../../context/CardsContext';
import { FoldersContext } from '../../context/FoldersContext';
import './DeckForm.css';

const flattenFolderOptions = (foldersList, depth = 0) => {
    let options = [];
    for (const folder of foldersList) {
        options.push({
            id: folder.id,
            name: `${'— '.repeat(depth)}📁 ${folder.name}`,
        });
        if (folder.subfolders && folder.subfolders.length > 0) {
            options = options.concat(flattenFolderOptions(folder.subfolders, depth + 1));
        }
    }
    return options;
};

const DeckForm = ({ deckId = null, defaultFolderId = null, onSave, onCancel }) => {
    const { decks, addDeck, editDeck } = useContext(CardsContext);
    const { folders = [], loadFolders } = useContext(FoldersContext) || {};
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        folder_id: defaultFolderId ? String(defaultFolderId) : ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const folderOptions = useMemo(() => {
        return flattenFolderOptions(folders);
    }, [folders]);

    // Load deck data if editing an existing deck
    useEffect(() => {
        if (deckId) {
            const deck = decks.find(d => d.id === deckId);
            if (deck) {
                setFormData({
                    title: deck.title,
                    description: deck.description || '',
                    folder_id: deck.folder_id ? String(deck.folder_id) : ''
                });
            }
        } else if (defaultFolderId) {
            setFormData(prev => ({
                ...prev,
                folder_id: String(defaultFolderId)
            }));
        }
    }, [deckId, decks, defaultFolderId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'اسم المجموعة مطلوب';
        } else if (formData.title.length > 50) {
            newErrors.title = 'اسم المجموعة يجب ألا يتجاوز 50 حرفاً';
        }

        if (formData.description && formData.description.length > 200) {
            newErrors.description = 'الوصف يجب ألا يتجاوز 200 حرفاً';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);
            const selectedFolderId = formData.folder_id ? Number(formData.folder_id) : null;
            const payload = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                folder_id: selectedFolderId
            };

            try {
                if (deckId) {
                    // Edit existing deck
                    await editDeck({
                        id: deckId,
                        ...payload
                    });
                } else {
                    // Add new deck
                    await addDeck(payload);
                }

                if (loadFolders) {
                    await loadFolders();
                }

                onSave();
            } catch (err) {
                console.error('Error saving deck:', err);
                setErrors({ submit: 'حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="deck-form-container">
            <h2>{deckId ? 'تعديل المجموعة' : 'إنشاء مجموعة جديدة'}</h2>
            <form onSubmit={handleSubmit} className="deck-form">
                {errors.submit && <div className="error-message">{errors.submit}</div>}

                <div className="form-group">
                    <label htmlFor="title">اسم المجموعة *</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="أدخل اسم المجموعة"
                        className={errors.title ? 'input-error' : ''}
                    />
                    {errors.title && <div className="error-message">{errors.title}</div>}
                </div>

                <div className="form-group">
                    <label htmlFor="folder_id">المجلد التابع له</label>
                    <select
                        id="folder_id"
                        name="folder_id"
                        value={formData.folder_id}
                        onChange={handleChange}
                    >
                        <option value="">🏠 الصفحة الرئيسية (بدون مجلد / Root)</option>
                        {folderOptions.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">الوصف</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="أدخل وصف المجموعة (اختياري)"
                        rows="3"
                        className={errors.description ? 'input-error' : ''}
                    ></textarea>
                    {errors.description && <div className="error-message">{errors.description}</div>}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSubmitting}>
                        إلغاء
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'جاري الحفظ...' : (deckId ? 'تحديث المجموعة' : 'إنشاء المجموعة')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeckForm;