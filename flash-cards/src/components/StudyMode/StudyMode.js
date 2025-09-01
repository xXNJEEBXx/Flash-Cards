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
    
    // نظام البطاقات غير المتقنة البسيط
    const [unmastered, setUnmastered] = useState([]);
    const [reviewMode, setReviewMode] = useState(false);
    const [smartModeEnabled, setSmartModeEnabled] = useState(false);
    
    // إعدادات العرض والتحكم
    const [hideMasteredCards, setHideMasteredCards] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    
    const UNMASTERED_LIMIT = 6;

    // Find the current deck
    useEffect(() => {
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            setCurrentDeck(deck);
            // Initialize cards array
            setCards([...deck.cards]);
        }
    }, [deckId, decks]);

    // Handle shuffle mode and card filtering
    useEffect(() => {
        if (currentDeck) {
            let cardsToDisplay = [];
            
            if (smartModeEnabled && reviewMode) {
                // في النظام الذكي ووضع المراجعة، اعرض البطاقات غير المتقنة فقط
                cardsToDisplay = unmastered;
            } else {
                // ابدأ بجميع البطاقات
                cardsToDisplay = [...currentDeck.cards];
                
                // إخفاء البطاقات المتقنة إذا كان الخيار مُفعل
                if (hideMasteredCards) {
                    cardsToDisplay = cardsToDisplay.filter(card => !card.known);
                }
                
                // ترتيب البطاقات
                if (shuffleMode) {
                    cardsToDisplay = cardsToDisplay.sort(() => Math.random() - 0.5);
                }
            }
            
            setCards(cardsToDisplay);
            // Reset to the first card
            setCurrentCardIndex(0);
        }
    }, [shuffleMode, currentDeck, smartModeEnabled, reviewMode, unmastered, hideMasteredCards]);

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

    // إضافة بطاقة لقائمة غير المتقنة
    const addToUnmastered = (card) => {
        setUnmastered(prev => {
            // تجنب التكرار
            if (prev.some(c => c.id === card.id)) {
                return prev;
            }
            
            const newList = [...prev, card];
            
            // إذا كان النظام الذكي مُفعل ووصلنا للحد الأقصى، ابدأ وضع المراجعة
            if (smartModeEnabled && newList.length >= UNMASTERED_LIMIT) {
                setReviewMode(true);
            }
            
            return newList;
        });
    };

    // إزالة بطاقة من قائمة غير المتقنة
    const removeFromUnmastered = (cardId) => {
        setUnmastered(prev => {
            const newList = prev.filter(c => c.id !== cardId);
            
            // إذا كان النظام الذكي مُفعل
            if (smartModeEnabled) {
                // إذا فهم جميع البطاقات، اخرج من وضع المراجعة
                if (newList.length === 0 && reviewMode) {
                    setReviewMode(false);
                } else if (reviewMode && newList.length < UNMASTERED_LIMIT) {
                    // إذا كان في وضع المراجعة وقل العدد عن الحد الأقصى
                    // أضف بطاقة جديدة من المجموعة إذا كان هناك بطاقات متبقية
                    const remainingCards = currentDeck.cards.filter(card => 
                        !newList.some(um => um.id === card.id) && !card.known
                    );
                    
                    if (remainingCards.length > 0) {
                        // أضف بطاقة عشوائية من المتبقي
                        const randomCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
                        return [...newList, randomCard];
                    }
                }
            }
            
            return newList;
        });
    };

    // زر Next: لم أفهم البطاقة
    const handleNextButtonClick = () => {
        // أضف البطاقة لقائمة غير المتقنة (سواء النظام مُفعل أم لا)
        addToUnmastered(currentCard);
        
        // إذا كان النظام الذكي مُفعل ووصل للحد الأقصى، لا تضيف بطاقات جديدة
        if (smartModeEnabled && unmastered.length >= UNMASTERED_LIMIT - 1) {
            // ابق في وضع المراجعة
            if (currentCardIndex < totalCards - 1) {
                setCurrentCardIndex(prev => prev + 1);
            } else {
                setCurrentCardIndex(0); // ارجع للبداية
            }
        } else {
            // في الوضع العادي أو النظام غير مُفعل، انتقل للبطاقة التالية
            if (currentCardIndex < totalCards - 1) {
                setCurrentCardIndex(prev => prev + 1);
            }
        }
    };

    // زر Mark as Known: فهمت البطاقة
    const handleMarkAsKnown = () => {
        // اجعل البطاقة معروفة
        toggleCardKnown(currentDeck.id, currentCard.id);
        
        // أزل من قائمة غير المتقنة إذا كانت موجودة
        removeFromUnmastered(currentCard.id);
        
        // إذا كانت البطاقات المتقنة مخفية، تحقق من وجود بطاقات متبقية
        if (hideMasteredCards && !smartModeEnabled) {
            // إذا لم تعد هناك بطاقات غير متقنة، أظهر رسالة
            const remainingCards = currentDeck.cards.filter(card => !card.known);
            if (remainingCards.length === 0) {
                alert("تهانينا! لقد أتقنت جميع البطاقات في هذه المجموعة!");
                return;
            }
        }
        
        // إذا كان النظام الذكي مُفعل وفي وضع المراجعة
        if (smartModeEnabled && reviewMode) {
            // إذا لم تعد هناك بطاقات في وضع المراجعة، اخرج منه
            if (unmastered.length <= 1) {
                setReviewMode(false);
                setCurrentCardIndex(0);
            }
            // وإلا ابق في نفس الفهرس
        } else {
            // في الوضع العادي، انتقل للبطاقة التالية إذا أمكن
            if (currentCardIndex < totalCards - 1) {
                setCurrentCardIndex(prev => prev + 1);
            } else if (currentCardIndex > 0) {
                setCurrentCardIndex(prev => prev - 1);
            }
        }
    };

    const handleToggleKnown = (cardId) => {
        toggleCardKnown(currentDeck.id, cardId);
    };

    const handleResetProgress = () => {
        if (window.confirm("Are you sure you want to reset your progress for this deck?")) {
            resetDeckProgress(currentDeck.id);
            // إعادة تعيين النظام
            setUnmastered([]);
            setReviewMode(false);
            setCurrentCardIndex(0);
        }
    };

    const handleToggleShuffle = () => {
        setShuffleMode(prev => !prev);
    };

    const toggleSmartMode = () => {
        setSmartModeEnabled(prev => {
            if (prev) {
                // إيقاف النظام الذكي
                setReviewMode(false);
            }
            return !prev;
        });
    };

    const toggleHideMasteredCards = () => {
        setHideMasteredCards(prev => !prev);
    };

    const toggleSettingsPanel = () => {
        setShowSettingsPanel(prev => !prev);
    };

    return (
        <div className="study-mode">
            <div className="study-header">
                <h2>Studying: {currentDeck.title}</h2>
                
                {/* عداد البطاقات غير المتقنة */}
                <div className="unmastered-counter">
                    <span className="counter">
                        البطاقات غير المتقنة: {unmastered.length}
                    </span>
                </div>
                
                <div className="study-progress">
                    <span className="progress-text">
                        Card {currentCardIndex + 1} of {cards.length}
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
                    className={`btn ${showSettingsPanel ? 'btn-info' : 'btn-secondary'}`}
                    onClick={toggleSettingsPanel}
                    title="إعدادات الدراسة"
                >
                    ⚙️ إعدادات
                </button>
                
                <button
                    className="btn btn-success"
                    onClick={handleMarkAsKnown}
                >
                    ✓ Mark as Known
                </button>
                
                <button
                    className="btn btn-warning"
                    onClick={handleNextButtonClick}
                >
                    ✗ Next (لم أفهم)
                </button>
            </div>

            {/* لوحة الإعدادات */}
            {showSettingsPanel && (
                <div className="settings-panel">
                    <h3>⚙️ إعدادات الدراسة</h3>
                    
                    <div className="settings-grid">
                        {/* النظام الذكي */}
                        <div className="setting-item">
                            <div className="setting-label">
                                <span>🎯 النظام الذكي</span>
                                <small>حد أقصى 6 بطاقات غير متقنة مع مراجعة مركزة</small>
                            </div>
                            <button
                                className={`btn-toggle ${smartModeEnabled ? 'active' : ''}`}
                                onClick={toggleSmartMode}
                            >
                                {smartModeEnabled ? 'مُفعل' : 'مُطفأ'}
                            </button>
                        </div>

                        {/* إخفاء البطاقات المتقنة */}
                        <div className="setting-item">
                            <div className="setting-label">
                                <span>👁️ إخفاء البطاقات المتقنة</span>
                                <small>إخفاء البطاقات التي تم إتقانها من العرض</small>
                            </div>
                            <button
                                className={`btn-toggle ${hideMasteredCards ? 'active' : ''}`}
                                onClick={toggleHideMasteredCards}
                                disabled={smartModeEnabled && reviewMode}
                            >
                                {hideMasteredCards ? 'مُفعل' : 'مُطفأ'}
                            </button>
                        </div>

                        {/* ترتيب البطاقات */}
                        <div className="setting-item">
                            <div className="setting-label">
                                <span>🔀 ترتيب البطاقات</span>
                                <small>عرض البطاقات بترتيب عشوائي أم تسلسلي</small>
                            </div>
                            <button
                                className={`btn-toggle ${shuffleMode ? 'active' : ''}`}
                                onClick={handleToggleShuffle}
                                disabled={smartModeEnabled && reviewMode}
                            >
                                {shuffleMode ? 'عشوائي' : 'تسلسلي'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* رسالة تعليمية */}
            {(smartModeEnabled || hideMasteredCards) && (
                <div className="help-message">
                    <p>⚙️ <strong>الإعدادات النشطة:</strong> 
                    {smartModeEnabled && " النظام الذكي مُفعل"}
                    {smartModeEnabled && hideMasteredCards && " • "}
                    {hideMasteredCards && " البطاقات المتقنة مخفية"}
                    </p>
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