import React, { useState } from 'react';
import './FolderItem.css';

const FolderItem = ({ folder, onSelectFolder, onEditFolder, onDeleteFolder, onMoveFolder, onDrop, level = 0 }) => {
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
        if (window.confirm(`Are you sure you want to delete "${folder.name}"? All decks and subfolders will be moved to parent level.`)) {
            onDeleteFolder(folder.id);
        }
    };

    const handleCreateSubfolder = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        onSelectFolder({ action: 'create-subfolder', parentId: folder.id });
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
                
                <div className="folder-info" onClick={() => onSelectFolder(folder)}>
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
                    </div>
                </div>

                <div className="folder-actions">
                    <button 
                        className="folder-menu-btn"
                        onClick={handleMenuClick}
                    >
                        ⋮
                    </button>
                    {showMenu && (
                        <div className="folder-menu">
                            <button onClick={handleEdit}>✏️ Edit</button>
                            <button onClick={handleCreateSubfolder}>➕ Add Subfolder</button>
                            <button onClick={handleDelete} className="danger">🗑️ Delete</button>
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
                            onMoveFolder={onMoveFolder}
                            onDrop={onDrop}
                            level={level + 1}
                        />
                    ))}
                    
                    {/* Render decks */}
                    {hasDecks && folder.decks.map(deck => (
                        <div key={deck.id} className="folder-deck-item" style={{ marginLeft: `${(level + 1) * 20}px` }}>
                            <span className="deck-icon">🎯</span>
                            <span className="deck-name">{deck.title}</span>
                            <span className="deck-cards">{deck.cards?.length || 0} cards</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FolderItem;
