import React, { useState } from 'react';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './FolderItem.css';

const FolderItem = ({
    folder,
    onSelectFolder,
    onEditFolder,
    onDeleteFolder,
    onRequestMoveFolder,
    onMoveFolderToRoot,
    onMoveFolder,
    onDrop,
    onOpenFolder,
    onDragStartFolder,
    level = 0
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
    const hasDecks = folder.decks && folder.decks.length > 0;
    const totalCards = folder.decks?.reduce((sum, deck) => sum + (deck.cards?.length || 0), 0) || 0;
    const learnedCards = folder.decks?.reduce((sum, deck) =>
        sum + (deck.cards?.filter(card => card.known).length || 0), 0) || 0;

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        onEditFolder(folder);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (confirmDeleteWithPassword('المجلد', folder.name)) {
            onDeleteFolder(folder.id);
        }
    };

    const handleCreateSubfolder = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        onSelectFolder({ action: 'create-subfolder', parentId: folder.id });
    };

    const handleRequestMove = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onRequestMoveFolder) {
            onRequestMoveFolder(folder);
        }
    };

    const handleMoveToRoot = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        if (onMoveFolderToRoot) {
            onMoveFolderToRoot(folder.id);
        }
    };

    const handleDragStart = (e) => {
        e.stopPropagation();
        if (onDragStartFolder) {
            onDragStartFolder(folder);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (onDrop) {
            onDrop(folder.id);
        }
    };

    return (
        <div
            className={`folder-item ${isDragOver ? 'drag-over' : ''}`}
            style={{ marginLeft: `${level * 20}px` }}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="folder-header">
                <button
                    className="folder-toggle"
                    onClick={toggleExpand}
                >
                    {hasSubfolders || hasDecks ? (isExpanded ? '📂' : '📁') : '📁'}
                </button>

                <div className="folder-info" onClick={() => onOpenFolder && onOpenFolder(folder.id)}>
                    <span className="folder-name">{folder.name}</span>
                    {folder.description && (
                        <span className="folder-description">{folder.description}</span>
                    )}
                    <div className="folder-stats">
                        <span className="folder-stat">
                            {folder.decks?.length || 0} {folder.decks?.length === 1 ? 'deck' : 'decks'}
                        </span>
                        {totalCards > 0 && (
                            <span className="folder-stat">
                                {learnedCards}/{totalCards} cards learned
                            </span>
                        )}
                        <span className="folder-link-hint">Click to open →</span>
                    </div>
                </div>

                <div className="folder-actions">
                    <button
                        className="folder-menu-btn"
                        onClick={handleMenuClick}
                        title="خيارات المجلد"
                    >
                        ⋮
                    </button>
                    {showMenu && (
                        <div className="folder-menu">
                            <button onClick={handleEdit}>✏️ تعديل</button>
                            <button onClick={handleCreateSubfolder}>➕ مجلد فرعي</button>
                            <button onClick={handleRequestMove}>📦 نقل المجلد</button>
                            {folder.parent_folder_id && (
                                <button onClick={handleMoveToRoot}>📤 إخراج للرئيسية</button>
                            )}
                            <button onClick={handleDelete} className="danger">🗑️ حذف</button>
                        </div>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="folder-content">
                    {/* Render subfolders */}
                    {hasSubfolders && folder.subfolders.map(subfolder => (
                        <FolderItem
                            key={subfolder.id}
                            folder={subfolder}
                            onSelectFolder={onSelectFolder}
                            onEditFolder={onEditFolder}
                            onDeleteFolder={onDeleteFolder}
                            onRequestMoveFolder={onRequestMoveFolder}
                            onMoveFolderToRoot={onMoveFolderToRoot}
                            onMoveFolder={onMoveFolder}
                            onDrop={onDrop}
                            onOpenFolder={onOpenFolder}
                            onDragStartFolder={onDragStartFolder}
                            level={level + 1}
                        />
                    ))}

                    {/* Show deck count only */}
                    {hasDecks && (
                        <div className="folder-decks-summary" style={{ marginLeft: `${(level + 1) * 20}px` }}>
                            📚 {folder.decks.length} deck{folder.decks.length !== 1 ? 's' : ''} inside - Click folder to view
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FolderItem;
