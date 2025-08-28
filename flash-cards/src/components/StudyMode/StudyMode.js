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
    
    // نظام البطاقات الصعبة الذكي
    const [difficultyMode, setDifficultyMode] = useState(false);
    const [difficultCards, setDifficultCards] = useState([]);
    const [reviewingDifficult, setReviewingDifficult] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        totalReviewed: 0,
        correctAnswers: 0,
        difficultEncountered: 0,
        currentRound: 1
    });
    const DIFFICULT_CARDS_LIMIT = 5;

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
            let cardsToDisplay = [];
            
            if (reviewingDifficult) {
                // عرض البطاقات الصعبة فقط
                cardsToDisplay = difficultCards;
            } else if (shuffleMode) {
                // Create a shuffled copy of the cards
                cardsToDisplay = [...currentDeck.cards].sort(() => Math.random() - 0.5);
            } else {
                // Restore original order
                cardsToDisplay = [...currentDeck.cards];
            }
            
            setCards(cardsToDisplay);
            // Reset to the first card
            setCurrentCardIndex(0);
        }
    }, [shuffleMode, currentDeck, reviewingDifficult, difficultCards]);

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
        const card = cards.find(c => c.id === cardId);
        const wasKnown = card.known;
        
        toggleCardKnown(currentDeck.id, cardId);
        
        // تحديث إحصائيات الجلسة
        setSessionStats(prev => ({
            ...prev,
            totalReviewed: prev.totalReviewed + 1,
            correctAnswers: !wasKnown ? prev.correctAnswers + 1 : Math.max(0, prev.correctAnswers - 1)
        }));
        
        if (difficultyMode) {
            // إذا البطاقة صعبة ولم نفهمها بعد
            if (!card.known && !wasKnown) {
                addToDifficultCards(card);
            } else if (card.known && difficultCards.some(dc => dc.id === cardId)) {
                // إذا فهمناها، احذفها من البطاقات الصعبة
                removeDifficultCard(cardId);
            }
        }
    };

    const addToDifficultCards = (card) => {
        setDifficultCards(prev => {
            // تجنب التكرار
            if (prev.some(dc => dc.id === card.id)) {
                return prev;
            }
            
            // إذا وصلنا للحد الأقصى، ابدأ مراجعة البطاقات الصعبة
            if (prev.length >= DIFFICULT_CARDS_LIMIT - 1) {
                const newDifficultList = [...prev, card];
                startDifficultCardsReview(newDifficultList);
                return newDifficultList;
            }
            
            setSessionStats(prevStats => ({
                ...prevStats,
                difficultEncountered: prevStats.difficultEncountered + 1
            }));
            
            return [...prev, card];
        });
    };

    const removeDifficultCard = (cardId) => {
        setDifficultCards(prev => {
            const updated = prev.filter(dc => dc.id !== cardId);
            
            // إذا فهمنا جميع البطاقات الصعبة، ارجع للوضع العادي
            if (updated.length === 0 && reviewingDifficult) {
                endDifficultCardsReview();
            }
            
            return updated;
        });
    };

    const startDifficultCardsReview = (difficultCardsList) => {
        setReviewingDifficult(true);
        setSessionStats(prev => ({ 
            ...prev, 
            currentRound: prev.currentRound + 1 
        }));
        // سيتم تحديث البطاقات في useEffect
    };

    const endDifficultCardsReview = () => {
        setReviewingDifficult(false);
        setDifficultCards([]);
        // ارجع للبطاقة التالية في القائمة الأصلية
    };

    const toggleDifficultyMode = () => {
        setDifficultyMode(prev => {
            if (prev) {
                // إيقاف الوضع الذكي
                setDifficultCards([]);
                setReviewingDifficult(false);
            }
            return !prev;
        });
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
                
                {/* إحصائيات الجلسة */}
                <div className="session-stats">
                    <div className="stats-row">
                        <span>Round: {sessionStats.currentRound}</span>
                        <span>Reviewed: {sessionStats.totalReviewed}</span>
                        <span>Correct: {sessionStats.correctAnswers}</span>
                        {difficultyMode && (
                            <span className="difficult-count">
                                Difficult: {difficultCards.length}/{DIFFICULT_CARDS_LIMIT}
                            </span>
                        )}
                    </div>
                </div>

                {/* مؤشر الوضع الحالي */}
                {reviewingDifficult && (
                    <div className="review-mode-indicator">
                        <span className="review-badge">🎯 Reviewing Difficult Cards</span>
                        <small>Focus on these {difficultCards.length} cards until you understand them</small>
                    </div>
                )}

                <div className="study-progress">
                    <span className="progress-text">
                        Card {currentCardIndex + 1} of {cards.length}
                        {reviewingDifficult ? " (Difficult)" : ""}
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
                    className={`btn ${difficultyMode ? 'btn-success' : 'btn-secondary'}`}
                    onClick={toggleDifficultyMode}
                    title="Smart difficulty mode: repeat hard cards until understood"
                >
                    {difficultyMode ? "🎯 Smart Mode ON" : "🎯 Smart Mode"}
                </button>
                
                <button
                    className="btn btn-secondary"
                    onClick={handleToggleShuffle}
                    disabled={reviewingDifficult}
                >
                    {shuffleMode ? "Sequential Order" : "Shuffle Cards"}
                </button>
                
                <button
                    className="btn btn-secondary"
                    onClick={handleNextCard}
                    disabled={currentCardIndex === cards.length - 1}
                >
                    Next
                </button>
            </div>

            {/* رسائل مساعدة */}
            {difficultyMode && !reviewingDifficult && (
                <div className="help-message">
                    <p>💡 <strong>Smart Mode Active:</strong> When you mark cards as "unknown", 
                    they'll be collected for focused review. Once you have {DIFFICULT_CARDS_LIMIT} difficult cards, 
                    you'll practice them repeatedly until you understand them all.</p>
                </div>
            )}

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