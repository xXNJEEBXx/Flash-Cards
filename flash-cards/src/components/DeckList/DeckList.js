import React, { useContext, useState, useMemo } from 'react';
import { CardsContext } from '../../context/CardsContext';
import SearchFilter from '../Search/SearchFilter';
import './DeckList.css';

const DeckList = ({ onSelectDeck, onStudyDeck }) => {
    const { decks, deleteDeck } = useContext(CardsContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    // Filter and sort decks
    const filteredAndSortedDecks = useMemo(() => {
        let filtered = decks.filter(deck => 
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
    }, [decks, searchTerm, filterType, sortBy]);

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const handleFilter = (filter, sort) => {
        setFilterType(filter);
        setSortBy(sort);
    };

    if (decks.length === 0) {
        return (
            <div className="no-decks">
                <div className="no-decks-content">
                    <div className="no-decks-icon">📚</div>
                    <h2>No decks available</h2>
                    <p>Create your first deck to get started with your flash cards!</p>
                    <div className="no-decks-illustration">
                        <div className="floating-card">💡</div>
                        <div className="floating-card">🎯</div>
                        <div className="floating-card">📖</div>
                    </div>
                </div>
            </div>
        );
    }

    if (filteredAndSortedDecks.length === 0) {
        return (
            <div className="deck-list">
                <SearchFilter 
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                    totalDecks={filteredAndSortedDecks.length}
                />
                <div className="no-results">
                    <div className="no-results-content">
                        <div className="no-results-icon">🔍</div>
                        <h3>No decks match your search</h3>
                        <p>Try adjusting your search terms or filters</p>
                        <button 
                            className="btn btn-outline"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterType('all');
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (cards) => {
        if (cards.length === 0) return '#e2e8f0';
        const learnedRatio = cards.filter(card => card.known).length / cards.length;
        if (learnedRatio >= 0.8) return '#48bb78'; // Green
        if (learnedRatio >= 0.5) return '#ed8936'; // Orange  
        return '#f56565'; // Red
    };

    const getDifficultyLabel = (cards) => {
        if (cards.length === 0) return 'Empty';
        const learnedRatio = cards.filter(card => card.known).length / cards.length;
        if (learnedRatio >= 0.8) return 'Mastered';
        if (learnedRatio >= 0.5) return 'In Progress';
        return 'Needs Practice';
    };

    return (
        <div className="deck-list">
            <SearchFilter 
                onSearch={handleSearch}
                onFilter={handleFilter}
                totalDecks={filteredAndSortedDecks.length}
            />
            
            <div className="deck-list-header">
                <div className="deck-stats-summary">
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
                    <div className="stat-card">
                        <span className="stat-icon">⏳</span>
                        <div className="stat-info">
                            <span className="stat-number">{filteredAndSortedDecks.length}</span>
                            <span className="stat-label">Showing</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="decks-grid">
                {filteredAndSortedDecks.map(deck => (
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
                                className="btn btn-danger deck-action-btn deck-delete-btn"
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${deck.title}"? This action cannot be undone.`)) {
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
        </div>
    );
};

export default DeckList;