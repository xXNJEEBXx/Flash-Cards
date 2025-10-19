import React, { useContext, useMemo } from 'react';
import { CardsContext } from '../../context/CardsContext';
import { FoldersContext } from '../../context/FoldersContext';
import { confirmDeleteWithPassword } from '../../utils/passwordProtection';
import './FolderView.css';

const FolderView = ({ folderId, onBack, onSelectDeck, onStudyDeck }) => {
    const { decks, deleteDeck } = useContext(CardsContext);
    const { folders, removeDeckFromFolder } = useContext(FoldersContext);

    // Find the current folder
    const folder = useMemo(() => {
        return folders.find(f => f.id === folderId);
    }, [folders, folderId]);

    // Get decks in this folder
    const folderDecks = useMemo(() => {
        if (!folder) return [];
        return decks.filter(deck => deck.folder_id === folderId);
    }, [decks, folderId, folder]);

    // Get subfolders
    const subfolders = useMemo(() => {
        if (!folder) return [];
        return folder.subfolders || [];
    }, [folder]);

    // Handle removing deck from folder
    const handleRemoveFromFolder = async (deckId) => {
        if (window.confirm('Remove this deck from the folder?\n\nThe deck will be moved to the main list.')) {
            try {
                await removeDeckFromFolder(deckId);
            } catch (error) {
                alert('Failed to remove deck from folder: ' + error.message);
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
                                <div key={subfolder.id} className="subfolder-card">
                                    <span className="subfolder-icon">📁</span>
                                    <h3>{subfolder.name}</h3>
                                    <div className="subfolder-stats">
                                        <span>{subDecks.length} decks</span>
                                        <span>•</span>
                                        <span>{subCards} cards</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Decks Section */}
            <div className="folder-decks-section">
                <h2 className="section-heading">
                    <span className="section-icon">📚</span>
                    Decks in this folder
                </h2>

                {folderDecks.length === 0 ? (
                    <div className="no-decks-message">
                        <span className="no-decks-icon">📭</span>
                        <p>No decks in this folder yet.</p>
                        <p className="hint">Drag and drop decks here from the main view!</p>
                    </div>
                ) : (
                    <div className="folder-decks-grid">
                        {folderDecks.map(deck => (
                            <div key={deck.id} className="deck-card">
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
                                        className="btn btn-warning deck-action-btn"
                                        onClick={() => handleRemoveFromFolder(deck.id)}
                                        title="Remove from folder"
                                    >
                                        <span className="btn-icon">📤</span>
                                        Move Out
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
        </div>
    );
};

export default FolderView;
