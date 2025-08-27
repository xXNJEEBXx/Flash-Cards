import React, { useState, useContext, useEffect } from 'react';
import { CardsContext } from '../../context/CardsContext';
import Card from '../Card/Card';
import './StudyMode.css';

const StudyMode = ({ deckId, onBack }) => {
    const { decks, toggleCardKnown, resetDeckProgress } = useContext(CardsContext);
    const [currentDeck, setCurrentDeck] = useState(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [shuffleMode, setShuffleMode] = useState(false);
    const [cards, setCards] = useState([]);

    // Find the current deck
    useEffect(() => {
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            setCurrentDeck(deck);
            // Initialize cards array
            setCards([...deck.cards]);
        }
    }, [deckId, decks]);

    // Handle shuffle mode
    useEffect(() => {
        if (currentDeck) {
            if (shuffleMode) {
                // Create a shuffled copy of the cards
                const shuffled = [...currentDeck.cards].sort(() => Math.random() - 0.5);
                setCards(shuffled);
            } else {
                // Restore original order
                setCards([...currentDeck.cards]);
            }
            // Reset to the first card
            setCurrentCardIndex(0);
        }
    }, [shuffleMode, currentDeck]);

    if (!currentDeck) {
        return <div>Loading...</div>;
    }

    if (currentDeck.cards.length === 0) {
        return (
            <div className="study-mode empty-deck">
                <h2>No cards in this deck</h2>
                <p>Add some cards to start studying!</p>
                <button className="btn btn-primary" onClick={onBack}>
                    Back to Decks
                </button>
            </div>
        );
    }

    const currentCard = cards[currentCardIndex];
    const totalCards = cards.length;
    const knownCards = currentDeck.cards.filter(card => card.known).length;

    const handlePrevCard = () => {
        setCurrentCardIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    const handleNextCard = () => {
        setCurrentCardIndex(prev => (prev < totalCards - 1 ? prev + 1 : prev));
    };

    const handleToggleKnown = (cardId) => {
        toggleCardKnown(currentDeck.id, cardId);
    };

    const handleResetProgress = () => {
        if (window.confirm("Are you sure you want to reset your progress for this deck?")) {
            resetDeckProgress(currentDeck.id);
        }
    };

    const handleToggleShuffle = () => {
        setShuffleMode(prev => !prev);
    };

    return (
        <div className="study-mode">
            <div className="study-header">
                <h2>Studying: {currentDeck.title}</h2>
                <div className="study-progress">
                    <span className="progress-text">
                        Card {currentCardIndex + 1} of {totalCards}
                    </span>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${(knownCards / totalCards) * 100}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">
                        {knownCards} of {totalCards} learned
                    </span>
                </div>
            </div>

            <div className="card-container">
                <Card
                    card={currentCard}
                    onToggleKnown={handleToggleKnown}
                    inStudyMode={true}
                />
            </div>

            <div className="study-controls">
                <button
                    className="btn btn-secondary"
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                >
                    Previous
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleToggleShuffle}
                >
                    {shuffleMode ? "Sequential Order" : "Shuffle Cards"}
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleNextCard}
                    disabled={currentCardIndex === totalCards - 1}
                >
                    Next
                </button>
            </div>

            <div className="study-actions">
                <button className="btn btn-danger" onClick={handleResetProgress}>
                    Reset Progress
                </button>
                <button className="btn btn-primary" onClick={onBack}>
                    Back to Decks
                </button>
            </div>
        </div>
    );
};

export default StudyMode;