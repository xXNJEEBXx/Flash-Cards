import React, { useContext } from 'react';
import { CardsContext } from '../../context/CardsContext';
import './DeckList.css';

const DeckList = ({ onSelectDeck, onStudyDeck }) => {
    const { decks, deleteDeck } = useContext(CardsContext);

    if (decks.length === 0) {
        return (
            <div className="no-decks">
                <h2>No decks available</h2>
                <p>Create your first deck to get started with your flash cards!</p>
            </div>
        );
    }

    return (
        <div className="deck-list">
            <h2>Your Decks</h2>
            <div className="decks-grid">
                {decks.map(deck => (
                    <div key={deck.id} className="deck-card">
                        <div className="deck-card-content">
                            <h3>{deck.title}</h3>
                            <p>{deck.description}</p>
                            <p className="card-count">{deck.cards.length} cards</p>
                            <div className="deck-progress">
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${deck.cards.length > 0
                                            ? (deck.cards.filter(card => card.known).length / deck.cards.length) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                            <p className="progress-text">
                                {deck.cards.filter(card => card.known).length} of {deck.cards.length} learned
                            </p>
                        </div>
                        <div className="deck-card-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => onStudyDeck(deck.id)}
                                disabled={deck.cards.length === 0}
                            >
                                Study
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => onSelectDeck(deck.id)}
                            >
                                Edit
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${deck.title}"?`)) {
                                        deleteDeck(deck.id);
                                    }
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeckList;