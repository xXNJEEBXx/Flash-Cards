import React, { useState } from 'react';
import './FolderForm.css';

const FolderForm = ({ folder, parentFolderId, onSubmit, onCancel }) => {
    const [name, setName] = useState(folder?.name || '');
    const [description, setDescription] = useState(folder?.description || '');
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) {
            newErrors.name = 'Folder name is required';
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
                parent_folder_id: parentFolderId || folder?.parent_folder_id || null
            });
        }
    };

    return (
        <div className="folder-form-overlay">
            <div className="folder-form-container">
                <div className="folder-form-header">
                    <h2>{folder ? 'Edit Folder' : 'Create New Folder'}</h2>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="folder-form">
                    <div className="form-group">
                        <label htmlFor="folder-name">
                            Folder Name <span className="required">*</span>
                        </label>
                        <input
                            id="folder-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Programming, Languages, Science"
                            className={errors.name ? 'error' : ''}
                            autoFocus
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="folder-description">Description</label>
                        <textarea
                            id="folder-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional description for this folder"
                            rows="3"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {folder ? 'Update Folder' : 'Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FolderForm;
