import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardsContext } from '../../context/CardsContext';
import { FoldersContext } from '../../context/FoldersContext';
import { foldersAPI } from '../../services/apiService';
import MoveFolderModal from './MoveFolderModal';
import MoveDeckModal from './MoveDeckModal';
import ReorderDecksModal from './ReorderDecksModal';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './FolderView.css';

const FolderView = ({ folderId, onBack, onSelectDeck, onStudyDeck }) => {
    const navigate = useNavigate();
    const { decks, deleteDeck, updateDeckFolder, reorderDecks } = useContext(CardsContext);
    const { folders, loading: foldersLoading, removeDeckFromFolder, moveDeckToFolder, moveFolder, findFolderById } = useContext(FoldersContext);
    const [fetchedFolder, setFetchedFolder] = useState(null);
    const [isFetchingDirect, setIsFetchingDirect] = useState(false);
    const [folderToMove, setFolderToMove] = useState(null);
    const [deckToMove, setDeckToMove] = useState(null);
    const [showReorderModal, setShowReorderModal] = useState(false);
    const [sortBy, setSortBy] = useState('custom'); // 'custom', 'chapter', 'name', 'date-newest', 'date-oldest'
    const [openDeckMenuId, setOpenDeckMenuId] = useState(null);

    // Find the current folder (support deep nested folders)
    const contextFolder = useMemo(() => {
        if (!folderId) return null;
        if (findFolderById) {
            return findFolderById(folderId);
        }
        return folders.find(f => Number(f.id) === Number(folderId));
    }, [folders, folderId, findFolderById]);

    const folder = contextFolder || fetchedFolder;

    // Direct fetch fallback if not found in loaded tree
    useEffect(() => {
        if (!contextFolder && folderId) {
            setIsFetchingDirect(true);
            foldersAPI.getFolder(folderId)
                .then(data => {
                    if (data) setFetchedFolder(data);
                })
                .catch(err => {
                    console.error('Error fetching folder directly:', err);
                })
                .finally(() => {
                    setIsFetchingDirect(false);
                });
        }
    }, [contextFolder, folderId]);

    // Raw decks in this folder
    const rawFolderDecks = useMemo(() => {
        if (!folder) return [];
        const matched = decks
            .filter(d => !d.title?.includes('تجريبية'))
            .filter(d => Number(d.folder_id) === Number(folderId));
        if (matched.length > 0) return matched;
        if (folder.decks && Array.isArray(folder.decks)) {
            return folder.decks.filter(d => !d.title?.includes('تجريبية'));
        }
        return [];
    }, [decks, folderId, folder]);

    // Decks sorted according to active sort setting (Custom / Chapter numbers / Name / Date)
    const folderDecks = useMemo(() => {
        const list = [...rawFolderDecks];
        if (sortBy === 'chapter') {
            const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
            return list.sort((a, b) => collator.compare(a.title || '', b.title || ''));
        } else if (sortBy === 'name') {
            return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else if (sortBy === 'date-newest') {
            return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } else if (sortBy === 'date-oldest') {
            return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        }
        // Default: 'custom' order
        return list.sort((a, b) => {
            const orderA = a.order !== undefined && a.order !== null ? a.order : 999999;
            const orderB = b.order !== undefined && b.order !== null ? b.order : 999999;
            if (orderA !== orderB) return orderA - orderB;
            return a.id - b.id;
        });
    }, [rawFolderDecks, sortBy]);

    // Get subfolders
    const subfolders = useMemo(() => {
        if (!folder) return [];
        return folder.subfolders || [];
    }, [folder]);

    useEffect(() => {
        const handleClickOutside = () => {
            setOpenDeckMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle moving deck to any folder or root
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

    // Handle removing deck from folder
    const handleRemoveFromFolder = async (deckId) => {
        if (window.confirm('Remove this deck from the folder?\n\nThe deck will be moved to the main list.')) {
            try {
                await removeDeckFromFolder(deckId);
                if (updateDeckFolder) {
                    updateDeckFolder(deckId, null);
                }
            } catch (error) {
                alert('Failed to remove deck from folder: ' + error.message);
            }
        }
    };

    // Quick move deck up
    const handleQuickMoveUp = async (deckId) => {
        const index = folderDecks.findIndex(d => d.id === deckId);
        if (index <= 0) return;
        const newOrder = [...folderDecks];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index - 1];
        newOrder[index - 1] = temp;
        const orderedIds = newOrder.map(d => d.id);
        setSortBy('custom');
        await reorderDecks(orderedIds);
    };

    // Quick move deck down
    const handleQuickMoveDown = async (deckId) => {
        const index = folderDecks.findIndex(d => d.id === deckId);
        if (index < 0 || index >= folderDecks.length - 1) return;
        const newOrder = [...folderDecks];
        const temp = newOrder[index];
        newOrder[index] = newOrder[index + 1];
        newOrder[index + 1] = temp;
        const orderedIds = newOrder.map(d => d.id);
        setSortBy('custom');
        await reorderDecks(orderedIds);
    };

    // Save reorder from modal
    const handleSaveReorder = async (orderedDeckIds) => {
        await reorderDecks(orderedDeckIds);
        setSortBy('custom');
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

    if ((foldersLoading || isFetchingDirect) && !folder) {
        return (
            <div className="folder-view-loading" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
                <p style={{ fontSize: '18px', color: '#6b7280' }}>جاري تحميل محتويات المجلد...</p>
            </div>
        );
    }

    if (!folder) {
        return (
            <div className="folder-view-error">
                <h2>❌ Folder not found</h2>
                <button className="btn btn-primary" onClick={onBack}>
                    ← Back to All Decks
                </button>
            </div>
        );
    }

    const totalCards = folderDecks.reduce((sum, deck) => sum + deck.cards.length, 0);
    const learnedCards = folderDecks.reduce((sum, deck) =>
        sum + deck.cards.filter(card => card.known).length, 0);
    const progress = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

    return (
        <div className="folder-view">
            {/* Breadcrumb / Back Button */}
            <div className="folder-breadcrumb">
                <button className="btn-back" onClick={onBack}>
                    ← Back to All
                </button>
                <span className="breadcrumb-separator">/</span>
                <span className="current-folder">📁 {folder.name}</span>
            </div>

            {/* Folder Header */}
            <div className="folder-view-header">
                <div className="folder-title-section">
                    <h1 className="folder-title">
                        <span className="folder-emoji">📁</span>
                        {folder.name}
                    </h1>
                    {folder.description && (
                        <p className="folder-description">{folder.description}</p>
                    )}
                    <div className="folder-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowReorderModal(true)}
                            title="ترتيب مجموعات البطاقات في هذا المجلد"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '6px' }}
                        >
                            <span>↕️</span>
                            <span>ترتيب المجموعات</span>
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setFolderToMove(folder)}
                            title="نقل هذا المجلد إلى مجلد آخر"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '6px' }}
                        >
                            <span>📦</span>
                            <span>نقل هذا المجلد</span>
                        </button>
                        {folder.parent_folder_id && (
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={async () => {
                                    if (window.confirm(`هل تريد إخراج المجلد "${folder.name}" إلى الصفحة الرئيسية؟`)) {
                                        try {
                                            await moveFolder(folder.id, null);
                                        } catch (err) {
                                            alert('فشل إخراج المجلد: ' + err.message);
                                        }
                                    }
                                }}
                                title="إخراج هذا المجلد إلى المستوى الرئيسي"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '6px' }}
                            >
                                <span>📤</span>
                                <span>إخراج للرئيسية</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Folder Statistics */}
                <div className="folder-statistics">
                    <div className="stat-box">
                        <span className="stat-icon">📚</span>
                        <div className="stat-content">
                            <span className="stat-number">{folderDecks.length}</span>
                            <span className="stat-label">Decks</span>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">🗃️</span>
                        <div className="stat-content">
                            <span className="stat-number">{totalCards}</span>
                            <span className="stat-label">Cards</span>
                        </div>
                    </div>
                    <div className="stat-box">
                        <span className="stat-icon">✅</span>
                        <div className="stat-content">
                            <span className="stat-number">{learnedCards}</span>
                            <span className="stat-label">Learned</span>
                        </div>
                    </div>
                    <div className="stat-box progress-box">
                        <span className="stat-icon">📊</span>
                        <div className="stat-content">
                            <span className="stat-number">{progress}%</span>
                            <span className="stat-label">Progress</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subfolders Section */}
            {subfolders.length > 0 && (
                <div className="subfolders-section">
                    <h2 className="section-heading">
                        <span className="section-icon">📂</span>
                        Subfolders
                    </h2>
                    <div className="subfolders-grid">
                        {subfolders.map(subfolder => {
                            const subDecks = decks.filter(d => d.folder_id === subfolder.id);
                            const subCards = subDecks.reduce((sum, d) => sum + d.cards.length, 0);
                            return (
                                <div
                                    key={subfolder.id}
                                    className="subfolder-card"
                                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                                    onClick={() => navigate(`/folder/${subfolder.id}`)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <span className="subfolder-icon">📁</span>
                                        <h3>{subfolder.name}</h3>
                                        <div className="subfolder-stats">
                                            <span>{subDecks.length} decks</span>
                                            <span>•</span>
                                            <span>{subCards} cards</span>
                                        </div>
                                    </div>
                                    <div
                                        className="subfolder-actions"
                                        style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '12px',
                                            paddingTop: '10px',
                                            borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFolderToMove(subfolder);
                                            }}
                                            title="نقل المجلد"
                                            style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                                        >
                                            📦 نقل
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`هل تريد إخراج المجلد "${subfolder.name}" إلى الصفحة الرئيسية؟`)) {
                                                    try {
                                                        await moveFolder(subfolder.id, null);
                                                    } catch (err) {
                                                        alert('فشل إخراج المجلد: ' + err.message);
                                                    }
                                                }
                                            }}
                                            title="إخراج للصفحة الرئيسية"
                                            style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                                        >
                                            📤 إخراج
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Decks Section */}
            <div className="folder-decks-section">
                <div className="folder-decks-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <h2 className="section-heading" style={{ margin: 0 }}>
                        <span className="section-icon">📚</span>
                        مجموعات البطاقات في هذا المجلد ({folderDecks.length})
                    </h2>
                    {folderDecks.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-select"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    background: 'var(--card-bg, #ffffff)',
                                    color: 'var(--text-primary, #1e293b)',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="custom">↕️ الترتيب المخصص (يدوي)</option>
                                <option value="chapter">🔢 ترتيب ذكي للفصول (Chapter 1, 2, 3...)</option>
                                <option value="name">🔤 أبجدي (A - Z)</option>
                                <option value="date-newest">📅 الأحدث أولاً</option>
                                <option value="date-oldest">📅 الأقدم أولاً</option>
                            </select>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => setShowReorderModal(true)}
                                title="إعادة ترتيب المجموعات بالسحب أو الأسهم"
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', fontWeight: 600 }}
                            >
                                <span>↕️</span>
                                <span>ترتيب المجموعات</span>
                            </button>
                        </div>
                    )}
                </div>

                {folderDecks.length === 0 ? (
                    <div className="no-decks-message">
                        <span className="no-decks-icon">📭</span>
                        <p>No decks in this folder yet.</p>
                        <p className="hint">Drag and drop decks here from the main view!</p>
                    </div>
                ) : (
                    <div className="folder-decks-grid">
                        {folderDecks.map((deck, deckIndex) => (
                            <div key={deck.id} className="deck-card">
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
                                                handleQuickMoveUp(deck.id);
                                            }}
                                            disabled={deckIndex === 0}
                                            title="تقديم للأعلى (Move Up)"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '4px',
                                                cursor: deckIndex === 0 ? 'not-allowed' : 'pointer',
                                                opacity: deckIndex === 0 ? 0.25 : 0.8,
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
                                                handleQuickMoveDown(deck.id);
                                            }}
                                            disabled={deckIndex === folderDecks.length - 1}
                                            title="تأخير للأسفل (Move Down)"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(0,0,0,0.1)',
                                                borderRadius: '4px',
                                                cursor: deckIndex === folderDecks.length - 1 ? 'not-allowed' : 'pointer',
                                                opacity: deckIndex === folderDecks.length - 1 ? 0.25 : 0.8,
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
                                                            handleQuickMoveUp(deck.id);
                                                        }}
                                                        disabled={deckIndex === 0}
                                                    >
                                                        ▲ تقديم للأعلى (Move Up)
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setOpenDeckMenuId(null);
                                                            handleQuickMoveDown(deck.id);
                                                        }}
                                                        disabled={deckIndex === folderDecks.length - 1}
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
                                                    onClick={() => {
                                                        setOpenDeckMenuId(null);
                                                        handleRemoveFromFolder(deck.id);
                                                    }}
                                                >
                                                    📤 إخراج للرئيسية (Move to Root)
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
                                        className="btn btn-warning deck-action-btn"
                                        onClick={() => handleRemoveFromFolder(deck.id)}
                                        title="إخراج إلى الصفحة الرئيسية"
                                    >
                                        <span className="btn-icon">📤</span>
                                        Root
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
                        ))}
                    </div>
                )}
            </div>

            {folderToMove && (
                <MoveFolderModal
                    folder={folderToMove}
                    folders={folders}
                    onMove={moveFolder}
                    onClose={() => setFolderToMove(null)}
                />
            )}

            {deckToMove && (
                <MoveDeckModal
                    deck={deckToMove}
                    folders={folders}
                    onMove={handleMoveDeck}
                    onClose={() => setDeckToMove(null)}
                />
            )}

            {showReorderModal && (
                <ReorderDecksModal
                    decks={rawFolderDecks}
                    folderName={folder?.name || ''}
                    onSave={handleSaveReorder}
                    onClose={() => setShowReorderModal(false)}
                />
            )}
        </div>
    );
};

export default FolderView;
