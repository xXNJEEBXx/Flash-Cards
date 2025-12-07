import React, { useContext, useState, useMemo } from 'react';
import { CardsContext } from '../../context/CardsContext';
import { FoldersContext } from '../../context/FoldersContext';
import SearchFilter from '../Search/SearchFilter';
import FolderItem from '../Folders/FolderItem';
import FolderForm from '../Folders/FolderForm';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './DeckList.css';
import '../Folders/FoldersView.css';

const DeckListWithFolders = ({ onSelectDeck, onStudyDeck, onOpenFolder }) => {
    const { decks, deleteDeck } = useContext(CardsContext);
    const {
        folders,
        loading: foldersLoading,
        createFolder,
        updateFolder,
        deleteFolder,
        moveDeckToFolder,
        removeDeckFromFolder
    } = useContext(FoldersContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [parentFolderId, setParentFolderId] = useState(null);
    const [draggedDeck, setDraggedDeck] = useState(null);
    const [viewMode, setViewMode] = useState('both'); // 'both', 'folders', 'decks'

    // Get decks not in any folder (must be defined BEFORE unifiedItems)
    const rootDecks = useMemo(() => {
        return decks.filter(deck => !deck.folder_id);
    }, [decks]);

    // Combine folders and decks into unified items
    const unifiedItems = useMemo(() => {
        const items = [];

        // Add folders based on view mode
        if (viewMode === 'both' || viewMode === 'folders') {
            folders.forEach(folder => {
                items.push({ type: 'folder', data: folder, order: 0 });
            });
        }

        // Add decks based on view mode
        if (viewMode === 'both' || viewMode === 'decks') {
            rootDecks.forEach(deck => {
                items.push({ type: 'deck', data: deck, order: 1 });
            });
        }

        return items;
    }, [folders, rootDecks, viewMode]);

    // Filter and sort decks
    const filteredAndSortedDecks = useMemo(() => {
        let filtered = rootDecks.filter(deck =>
            deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            deck.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Apply filter
        switch (filterType) {
            case 'new':
                filtered = filtered.filter(deck => {
                    const learnedRatio = deck.cards.length > 0
                        ? deck.cards.filter(card => card.known).length / deck.cards.length
                        : 0;
                    return learnedRatio < 0.5;
                });
                break;
            case 'progress':
                filtered = filtered.filter(deck => {
                    const learnedRatio = deck.cards.length > 0
                        ? deck.cards.filter(card => card.known).length / deck.cards.length
                        : 0;
                    return learnedRatio >= 0.5 && learnedRatio < 0.8;
                });
                break;
            case 'mastered':
                filtered = filtered.filter(deck => {
                    const learnedRatio = deck.cards.length > 0
                        ? deck.cards.filter(card => card.known).length / deck.cards.length
                        : 0;
                    return learnedRatio >= 0.8;
                });
                break;
        }

        // Apply sorting
        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'cards':
                filtered.sort((a, b) => b.cards.length - a.cards.length);
                break;
            case 'progress':
                filtered.sort((a, b) => {
                    const aProgress = a.cards.length > 0
                        ? a.cards.filter(card => card.known).length / a.cards.length
                        : 0;
                    const bProgress = b.cards.length > 0
                        ? b.cards.filter(card => card.known).length / b.cards.length
                        : 0;
                    return bProgress - aProgress;
                });
                break;
        }

        return filtered;
    }, [rootDecks, searchTerm, filterType, sortBy]);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleFilter = (filter, sort) => {
        setFilterType(filter);
        setSortBy(sort);
    };

    // Folder handlers
    const handleCreateFolder = async (folderData) => {
        try {
            await createFolder(folderData);
            setShowFolderForm(false);
            setParentFolderId(null);
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('فشل إنشاء المجلد. تأكد من تشغيل Backend والـMigration.\n\nالخطأ: ' + error.message);
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
        }
    };

    const handleEditFolder = (folder) => {
        setEditingFolder(folder);
        setShowFolderForm(true);
    };

    const handleDragStart = (deck) => {
        setDraggedDeck(deck);
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

    const getDifficultyLabel = (cards) => {
        if (cards.length === 0) return 'New';
        const learnedRatio = cards.filter(card => card.known).length / cards.length;
        if (learnedRatio < 0.3) return 'Beginner';
        if (learnedRatio < 0.7) return 'Learning';
        return 'Mastered';
    };

    const getDifficultyColor = (cards) => {
        if (cards.length === 0) return '#95a5a6';
        const learnedRatio = cards.filter(card => card.known).length / cards.length;
        if (learnedRatio < 0.3) return '#e74c3c';
        if (learnedRatio < 0.7) return '#f39c12';
        return '#27ae60';
    };

    if (decks.length === 0 && folders.length === 0) {
        return (
            <div className="no-decks">
                <div className="no-decks-content">
                    <div className="no-decks-icon">📚</div>
                    <h2>No decks or folders yet</h2>
                    <p>Create your first deck or folder to get started!</p>
                    <div className="no-decks-illustration">
                        <div className="floating-card">💡</div>
                        <div className="floating-card">🎯</div>
                        <div className="floating-card">📖</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="deck-list">
            <SearchFilter
                onSearch={handleSearch}
                onFilter={handleFilter}
                totalDecks={decks.length}
            />

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
                <button
                    className={`view-btn ${viewMode === 'both' ? 'active' : ''}`}
                    onClick={() => setViewMode('both')}
                >
                    📁📚 All
                </button>
                <button
                    className={`view-btn ${viewMode === 'folders' ? 'active' : ''}`}
                    onClick={() => setViewMode('folders')}
                >
                    📁 Folders Only
                </button>
                <button
                    className={`view-btn ${viewMode === 'decks' ? 'active' : ''}`}
                    onClick={() => setViewMode('decks')}
                >
                    📚 Decks Only
                </button>
            </div>

            <div className="deck-list-header">
                <div className="deck-stats-summary">
                    <div className="stat-card">
                        <span className="stat-icon">📁</span>
                        <div className="stat-info">
                            <span className="stat-number">{folders.length}</span>
                            <span className="stat-label">Folders</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">📚</span>
                        <div className="stat-info">
                            <span className="stat-number">{decks.length}</span>
                            <span className="stat-label">Total Decks</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">🗃️</span>
                        <div className="stat-info">
                            <span className="stat-number">
                                {decks.reduce((total, deck) => total + deck.cards.length, 0)}
                            </span>
                            <span className="stat-label">Total Cards</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <span className="stat-icon">✅</span>
                        <div className="stat-info">
                            <span className="stat-number">
                                {decks.reduce((total, deck) =>
                                    total + deck.cards.filter(card => card.known).length, 0
                                )}
                            </span>
                            <span className="stat-label">Learned</span>
                        </div>
                    </div>
                </div>

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

            {/* Unified Section - All Items Together */}
            <div className="unified-content-section">
                {unifiedItems.map((item, index) => {
                    if (item.type === 'folder') {
                        return (
                            <FolderItem
                                key={`folder-${item.data.id}`}
                                folder={item.data}
                                onSelectFolder={handleSelectFolder}
                                onEditFolder={handleEditFolder}
                                onDeleteFolder={handleDeleteFolder}
                                onMoveFolder={moveDeckToFolder}
                                onDrop={handleDrop}
                                onOpenFolder={onOpenFolder}
                            />
                        );
                    } else {
                        const deck = item.data;
                        // Apply search filter
                        const matchesSearch = deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            deck.description.toLowerCase().includes(searchTerm.toLowerCase());

                        if (!matchesSearch) return null;

                        // Apply deck filter
                        const learnedRatio = deck.cards.length > 0
                            ? deck.cards.filter(card => card.known).length / deck.cards.length
                            : 0;

                        let passesFilter = true;
                        switch (filterType) {
                            case 'new':
                                passesFilter = learnedRatio < 0.5;
                                break;
                            case 'progress':
                                passesFilter = learnedRatio >= 0.5 && learnedRatio < 0.8;
                                break;
                            case 'mastered':
                                passesFilter = learnedRatio >= 0.8;
                                break;
                        }

                        if (!passesFilter) return null;

                        return (
                            <div
                                key={`deck-${deck.id}`}
                                className="deck-card"
                                draggable
                                onDragStart={() => handleDragStart(deck)}
                            >
                                <div className="deck-card-header">
                                    <div className="deck-difficulty-badge"
                                        style={{ backgroundColor: getDifficultyColor(deck.cards) }}>
                                        {getDifficultyLabel(deck.cards)}
                                    </div>
                                    <div className="deck-menu">⋮</div>
                                </div>

                                <div className="deck-card-content">
                                    <div className="deck-icon">🎯</div>
                                    <h3>{deck.title}</h3>
                                    <p className="deck-description">{deck.description}</p>

                                    <div className="deck-metrics">
                                        <div className="metric">
                                            <span className="metric-icon">🗃️</span>
                                            <span className="metric-text">{deck.cards.length} cards</span>
                                        </div>
                                        <div className="metric">
                                            <span className="metric-icon">⏱️</span>
                                            <span className="metric-text">
                                                ~{Math.max(1, Math.ceil(deck.cards.length * 0.5))} min
                                            </span>
                                        </div>
                                    </div>

                                    <div className="deck-progress">
                                        <div className="progress-header">
                                            <span className="progress-label">Progress</span>
                                            <span className="progress-percentage">
                                                {deck.cards.length > 0
                                                    ? Math.round((deck.cards.filter(card => card.known).length / deck.cards.length) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width: `${deck.cards.length > 0
                                                        ? (deck.cards.filter(card => card.known).length / deck.cards.length) * 100
                                                        : 0}%`,
                                                    backgroundColor: getDifficultyColor(deck.cards)
                                                }}
                                            ></div>
                                        </div>
                                        <div className="progress-details">
                                            <span>{deck.cards.filter(card => card.known).length} learned</span>
                                            <span>{deck.cards.filter(card => !card.known).length} remaining</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="deck-card-actions">
                                    <button
                                        className="btn btn-primary deck-action-btn"
                                        onClick={() => onStudyDeck(deck.id)}
                                        disabled={deck.cards.length === 0}
                                    >
                                        <span className="btn-icon">🎓</span>
                                        Study
                                    </button>
                                    <button
                                        className="btn btn-secondary deck-action-btn"
                                        onClick={() => onSelectDeck(deck.id)}
                                    >
                                        <span className="btn-icon">✏️</span>
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-danger deck-action-btn deck-delete-btn"
                                        onClick={() => {
                                            if (confirmDeleteWithPassword('المجموعة', deck.title)) {
                                                deleteDeck(deck.id);
                                            }
                                        }}
                                    >
                                        <span className="btn-icon">🗑️</span>
                                    </button>
                                </div>
                            </div>
                        );
                    }
                })}
            </div>

            {/* Folder Form Modal */}
            {showFolderForm && (
                <FolderForm
                    folder={editingFolder}
                    parentFolderId={parentFolderId}
                    onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
                    onCancel={() => {
                        setShowFolderForm(false);
                        setEditingFolder(null);
                        setParentFolderId(null);
                    }}
                />
            )}
        </div>
    );
};

export default DeckListWithFolders;
