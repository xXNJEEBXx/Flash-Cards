import React, { useContext, useState, useMemo, useEffect } from 'react';
import { CardsContext } from '../../context/CardsContext';
import { FoldersContext } from '../../context/FoldersContext';
import SearchFilter from '../Search/SearchFilter';
import FolderItem from '../Folders/FolderItem';
import FolderForm from '../Folders/FolderForm';
import MoveFolderModal from '../Folders/MoveFolderModal';
import MoveDeckModal from '../Folders/MoveDeckModal';
import ReorderDecksModal from '../Folders/ReorderDecksModal';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './DeckList.css';
import '../Folders/FoldersView.css';

const DeckListWithFolders = ({ onSelectDeck, onStudyDeck, onOpenFolder }) => {
    const { decks, deleteDeck, updateDeckFolder, reorderDecks } = useContext(CardsContext);
    const {
        folders,
        createFolder,
        updateFolder,
        deleteFolder,
        moveFolder,
        moveDeckToFolder,
        removeDeckFromFolder
    } = useContext(FoldersContext);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [editingFolder, setEditingFolder] = useState(null);
    const [parentFolderId, setParentFolderId] = useState(null);
    const [folderToMove, setFolderToMove] = useState(null);
    const [deckToMove, setDeckToMove] = useState(null);
    const [openDeckMenuId, setOpenDeckMenuId] = useState(null);
    const [draggedDeck, setDraggedDeck] = useState(null);
    const [draggedFolder, setDraggedFolder] = useState(null);
    const [viewMode, setViewMode] = useState('both'); // 'both', 'folders', 'decks'

    // Get decks not in any folder sorted by custom order (or all decks as fallback if folders are empty)
    const rootDecks = useMemo(() => {
        const hasFolders = folders && folders.length > 0;
        const unassigned = hasFolders
            ? decks.filter(deck => !deck.folder_id && !deck.title?.includes('تجريبية'))
            : decks.filter(deck => !deck.title?.includes('تجريبية'));

        return [...unassigned].sort((a, b) => {
            const orderA = a.order !== undefined && a.order !== null ? a.order : 999999;
            const orderB = b.order !== undefined && b.order !== null ? b.order : 999999;
            if (orderA !== orderB) return orderA - orderB;
            return a.id - b.id;
        });
    }, [decks, folders]);

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
    // eslint-disable-next-line no-unused-vars
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
            default:
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
            default:
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

    const handleMoveFolderToRoot = async (folderId) => {
        try {
            await moveFolder(folderId, null);
        } catch (error) {
            alert('فشل إخراج المجلد إلى الصفحة الرئيسية: ' + error.message);
        }
    };

    // Root decks reordering handlers
    const handleQuickMoveUpRoot = async (deckId) => {
        const index = rootDecks.findIndex(d => d.id === deckId);
        if (index <= 0) return;
        const newOrder = [...rootDecks];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index - 1];
        newOrder[index - 1] = temp;
        const orderedIds = newOrder.map(d => d.id);
        await reorderDecks(orderedIds);
    };

    const handleQuickMoveDownRoot = async (deckId) => {
        const index = rootDecks.findIndex(d => d.id === deckId);
        if (index < 0 || index >= rootDecks.length - 1) return;
        const newOrder = [...rootDecks];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index + 1];
        newOrder[index + 1] = temp;
        const orderedIds = newOrder.map(d => d.id);
        await reorderDecks(orderedIds);
    };

    const handleSaveReorderRoot = async (orderedDeckIds) => {
        await reorderDecks(orderedDeckIds);
    };

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDeckMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleMoveDeck = async (deckId, targetFolderId) => {
        try {
            if (targetFolderId === null || targetFolderId === '' || targetFolderId === '0') {
                await removeDeckFromFolder(deckId);
            } else {
                await moveDeckToFolder(targetFolderId, deckId);
            }
            if (updateDeckFolder) {
                updateDeckFolder(deckId, targetFolderId);
            }
        } catch (error) {
            console.error('Failed to move deck:', error);
            alert('فشل نقل المجموعة: ' + error.message);
            throw error;
        }
    };

    const handleDragStart = (deck) => {
        setDraggedDeck(deck);
    };

    const handleDrop = async (targetFolderId) => {
        if (draggedDeck) {
            try {
                await moveDeckToFolder(targetFolderId, draggedDeck.id);
                if (updateDeckFolder) {
                    updateDeckFolder(draggedDeck.id, targetFolderId);
                }
                setDraggedDeck(null);
            } catch (error) {
                alert('فشل نقل المجموعة: ' + error.message);
                setDraggedDeck(null);
            }
        } else if (draggedFolder) {
            if (draggedFolder.id === targetFolderId) {
                setDraggedFolder(null);
                return;
            }
            try {
                await moveFolder(draggedFolder.id, targetFolderId);
                setDraggedFolder(null);
            } catch (error) {
                alert('فشل نقل المجلد: ' + error.message);
                setDraggedFolder(null);
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

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {rootDecks.length > 1 && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowReorderModal(true)}
                            title="ترتيب المجموعات الرئيسية"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <span>↕️</span>
                            <span>ترتيب المجموعات</span>
                        </button>
                    )}
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
            </div>

            {/* Unified Section - All Items Together */}
            {draggedFolder && draggedFolder.parent_folder_id && (
                <div
                    className="drag-to-root-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                        e.preventDefault();
                        await handleMoveFolderToRoot(draggedFolder.id);
                        setDraggedFolder(null);
                    }}
                    style={{
                        border: '2px dashed #3b82f6',
                        borderRadius: '10px',
                        padding: '14px',
                        textAlign: 'center',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        color: '#2563eb',
                        fontWeight: 600,
                        marginBottom: '16px',
                        cursor: 'pointer'
                    }}
                >
                    🏠 أفلت هنا لإخراج المجلد "{draggedFolder.name}" إلى الصفحة الرئيسية
                </div>
            )}
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
                                onRequestMoveFolder={(f) => setFolderToMove(f)}
                                onMoveFolderToRoot={handleMoveFolderToRoot}
                                onMoveFolder={moveFolder}
                                onDrop={handleDrop}
                                onOpenFolder={onOpenFolder}
                                onDragStartFolder={(f) => setDraggedFolder(f)}
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
                            default:
                                break;
                        }

                        if (!passesFilter) return null;

                        const rootDeckIndex = rootDecks.findIndex(d => d.id === deck.id);

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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {/* Quick Move Up/Down Buttons */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickMoveUpRoot(deck.id);
                                            }}
                                            disabled={rootDeckIndex <= 0}
                                            title="تقديم للأعلى (Move Up)"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '4px',
                                                cursor: rootDeckIndex <= 0 ? 'not-allowed' : 'pointer',
                                                opacity: rootDeckIndex <= 0 ? 0.25 : 0.8,
                                                padding: '2px 6px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickMoveDownRoot(deck.id);
                                            }}
                                            disabled={rootDeckIndex < 0 || rootDeckIndex === rootDecks.length - 1}
                                            title="تأخير للأسفل (Move Down)"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '4px',
                                                cursor: (rootDeckIndex < 0 || rootDeckIndex === rootDecks.length - 1) ? 'not-allowed' : 'pointer',
                                                opacity: (rootDeckIndex < 0 || rootDeckIndex === rootDecks.length - 1) ? 0.25 : 0.8,
                                                padding: '2px 6px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ▼
                                        </button>
                                        <div className="deck-menu-container">
                                            <button
                                                type="button"
                                                className="deck-menu-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenDeckMenuId(openDeckMenuId === deck.id ? null : deck.id);
                                                }}
                                                title="خيارات المجموعة"
                                            >
                                                ⋮
                                            </button>
                                            {openDeckMenuId === deck.id && (
                                                <div className="deck-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenDeckMenuId(null);
                                                            handleQuickMoveUpRoot(deck.id);
                                                        }}
                                                        disabled={rootDeckIndex <= 0}
                                                    >
                                                        ▲ تقديم للأعلى (Move Up)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenDeckMenuId(null);
                                                            handleQuickMoveDownRoot(deck.id);
                                                        }}
                                                        disabled={rootDeckIndex < 0 || rootDeckIndex === rootDecks.length - 1}
                                                    >
                                                        ▼ تأخير للأسفل (Move Down)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenDeckMenuId(null);
                                                            onStudyDeck(deck.id);
                                                        }}
                                                        disabled={deck.cards.length === 0}
                                                    >
                                                        🎓 دراسة (Study)
                                                    </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenDeckMenuId(null);
                                                        onSelectDeck(deck.id);
                                                    }}
                                                >
                                                    ✏️ تعديل (Edit)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenDeckMenuId(null);
                                                        setDeckToMove(deck);
                                                    }}
                                                >
                                                    📦 نقل المجموعة (Move Deck)
                                                </button>
                                                <button
                                                    type="button"
                                                    className="danger"
                                                    onClick={() => {
                                                        setOpenDeckMenuId(null);
                                                        if (confirmDeleteWithPassword('المجموعة', deck.title)) {
                                                            deleteDeck(deck.id);
                                                        }
                                                    }}
                                                >
                                                    🗑️ حذف (Delete)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    </div>
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
                                        className="btn btn-secondary deck-action-btn deck-move-btn"
                                        onClick={() => setDeckToMove(deck)}
                                        title="نقل المجموعة لمجلد آخر"
                                    >
                                        <span className="btn-icon">📦</span>
                                        Move
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
                    folders={folders}
                    onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
                    onCancel={() => {
                        setShowFolderForm(false);
                        setEditingFolder(null);
                        setParentFolderId(null);
                    }}
                />
            )}

            {/* Move Folder Modal */}
            {folderToMove && (
                <MoveFolderModal
                    folder={folderToMove}
                    folders={folders}
                    onMove={moveFolder}
                    onClose={() => setFolderToMove(null)}
                />
            )}

            {/* Move Deck Modal */}
            {deckToMove && (
                <MoveDeckModal
                    deck={deckToMove}
                    folders={folders}
                    onMove={handleMoveDeck}
                    onClose={() => setDeckToMove(null)}
                />
            )}

            {/* Reorder Decks Modal */}
            {showReorderModal && (
                <ReorderDecksModal
                    decks={rootDecks}
                    onSave={handleSaveReorderRoot}
                    onClose={() => setShowReorderModal(false)}
                />
            )}
        </div>
    );
};

export default DeckListWithFolders;
