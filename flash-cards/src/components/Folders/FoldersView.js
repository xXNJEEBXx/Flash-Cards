import React, { useContext, useState } from 'react';
import { FoldersContext } from '../../context/FoldersContext';
import FolderItem from '../Folders/FolderItem';
import FolderForm from '../Folders/FolderForm';
import MoveFolderModal from '../Folders/MoveFolderModal';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './FoldersView.css';

const FoldersView = ({ onSelectDeck, onStudyDeck, decks }) => {
    const {
        folders,
        loading,
        createFolder,
        updateFolder,
        deleteFolder,
        moveFolder,
        moveDeckToFolder,
        removeDeckFromFolder
    } = useContext(FoldersContext);

    const [showFolderForm, setShowFolderForm] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [parentFolderId, setParentFolderId] = useState(null);
    const [folderToMove, setFolderToMove] = useState(null);
    const [draggedDeck, setDraggedDeck] = useState(null);

    // Get decks not in any folder
    const rootDecks = decks.filter(deck => !deck.folder_id);

    const handleCreateFolder = async (folderData) => {
        try {
            await createFolder(folderData);
            setShowFolderForm(false);
            setParentFolderId(null);
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('فشل إنشاء المجلد. تأكد من:\n1. تشغيل Backend (Laravel)\n2. تشغيل Migration: cd backend && php artisan migrate\n\nالخطأ: ' + error.message);
        }
    };

    const handleUpdateFolder = async (folderData) => {
        try {
            await updateFolder(editingFolder.id, folderData);
            setShowFolderForm(false);
            setEditingFolder(null);
        } catch (error) {
            alert('Failed to update folder: ' + error.message);
        }
    };

    const handleDeleteFolder = async (folderId) => {
        const folder = folders.find(f => f.id === folderId);
        const folderName = folder ? folder.name : '';

        if (!confirmDeleteWithPassword('المجلد', folderName)) {
            return;
        }

        try {
            await deleteFolder(folderId);
        } catch (error) {
            alert('Failed to delete folder: ' + error.message);
        }
    };

    const handleSelectFolder = (data) => {
        if (data.action === 'create-subfolder') {
            setParentFolderId(data.parentId);
            setShowFolderForm(true);
        } else {
            // Handle folder selection if needed
            console.log('Selected folder:', data);
        }
    };

    const handleEditFolder = (folder) => {
        setEditingFolder(folder);
        setShowFolderForm(true);
    };

    const handleDragStart = (deck) => {
        setDraggedDeck(deck);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (folderId) => {
        if (draggedDeck) {
            try {
                await moveDeckToFolder(folderId, draggedDeck.id);
                setDraggedDeck(null);
            } catch (error) {
                alert('Failed to move deck: ' + error.message);
            }
        }
    };

    const handleRemoveDeckFromFolder = async (deckId) => {
        try {
            await removeDeckFromFolder(deckId);
        } catch (error) {
            alert('Failed to remove deck from folder: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="folders-view">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading folders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="folders-view">
            <div className="folders-header">
                <h2>📁 My Folders</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setParentFolderId(null);
                        setEditingFolder(null);
                        setShowFolderForm(true);
                    }}
                >
                    <span className="btn-icon">➕</span>
                    Create Folder
                </button>
            </div>

            <div className="folders-container">
                {folders.length === 0 && rootDecks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No folders yet</h3>
                        <p>Create folders to organize your flash card decks</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowFolderForm(true)}
                        >
                            Create Your First Folder
                        </button>
                    </div>
                ) : (
                    <>
                        {folders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                onSelectFolder={handleSelectFolder}
                                onEditFolder={handleEditFolder}
                                onDeleteFolder={handleDeleteFolder}
                                onRequestMoveFolder={(f) => setFolderToMove(f)}
                                onMoveFolderToRoot={async (id) => {
                                    try {
                                        await moveFolder(id, null);
                                    } catch (err) {
                                        alert('فشل إخراج المجلد: ' + err.message);
                                    }
                                }}
                                onMoveFolder={moveFolder}
                                onDrop={handleDrop}
                            />
                        ))}

                        {rootDecks.length > 0 && (
                            <div className="root-decks">
                                <h3 className="root-decks-title">📚 Decks (Not in folders)</h3>
                                {rootDecks.map(deck => (
                                    <div
                                        key={deck.id}
                                        className="folder-deck-item"
                                        draggable
                                        onDragStart={() => handleDragStart(deck)}
                                    >
                                        <span className="deck-icon">🎯</span>
                                        <span className="deck-name">{deck.title}</span>
                                        <span className="deck-cards">{deck.cards?.length || 0} cards</span>
                                        <div className="deck-actions">
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => onStudyDeck(deck.id)}
                                                title="Study"
                                            >
                                                🎓
                                            </button>
                                            <button
                                                className="btn-icon-small"
                                                onClick={() => onSelectDeck(deck.id)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {showFolderForm && (
                <FolderForm
                    folder={editingFolder}
                    parentFolderId={parentFolderId}
                    folders={folders}
                    onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
                    onCancel={() => {
                        setShowFolderForm(false);
                        setEditingFolder(null);
                        setParentFolderId(null);
                    }}
                />
            )}

            {folderToMove && (
                <MoveFolderModal
                    folder={folderToMove}
                    folders={folders}
                    onMove={moveFolder}
                    onClose={() => setFolderToMove(null)}
                />
            )}
        </div>
    );
};

export default FoldersView;
