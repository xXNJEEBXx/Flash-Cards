import React, { useState, useContext, useEffect, useRef } from 'react';
import { CardsContext } from '../../context/CardsContext';
import Card from '../Card/Card';
import { settingsAPI, cardsAPI } from '../../services/apiService';
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
    const [settingsLoaded, setSettingsLoaded] = useState(false); // تتبع تحميل الإعدادات

    const UNMASTERED_LIMIT = 6;
    // مرجع لمؤقت الحفظ لتطبيق debounce وتجنب كثرة الطلبات
    const saveTimeoutRef = useRef(null);

    // جلب الإعدادات من قاعدة البيانات عند التحميل
    useEffect(() => {
        const loadSettings = async () => {
            try {
                console.log('Loading settings...');
                const savedSettings = await settingsAPI.getSettings();
                console.log('Loaded settings:', savedSettings);
                if (savedSettings) {
                    setSmartModeEnabled(savedSettings.smart_mode_enabled || false);
                    setHideMasteredCards(savedSettings.hide_mastered_cards || false);
                    setShuffleMode(savedSettings.shuffle_mode || false);
                    setUnmastered(savedSettings.unmastered_cards || []);
                    setCurrentCardIndex(savedSettings.current_card_index || 0);
                }
                setSettingsLoaded(true); // إشارة أن الإعدادات تم تحميلها
            } catch (error) {
                console.error('Failed to load settings:', error);
                setSettingsLoaded(true); // حتى لو فشل التحميل، تابع
            }
        };

        loadSettings();
    }, []);

    // حفظ الإعدادات تلقائياً مع تطبيق debounce بعد أي تغيير مهم
    useEffect(() => {
        if (!settingsLoaded) return;

        // نظّف أي مؤقت سابق
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // ابدأ مؤقت debounce للحفظ
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await settingsAPI.updateSettings({
                    smart_mode_enabled: smartModeEnabled,
                    hide_mastered_cards: hideMasteredCards,
                    shuffle_mode: shuffleMode,
                    unmastered_cards: unmastered,
                    current_deck_id: currentDeck?.id || null,
                    current_card_index: currentCardIndex
                });
                // console.log('Settings auto-saved');
            } catch (error) {
                console.error('Failed to auto-save settings:', error);
            }
        }, 500); // نصف ثانية كافية لتجميع التغييرات

        // تنظيف المؤقت عند تغيير الاعتمادات أو عند التفكيك
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [smartModeEnabled, hideMasteredCards, shuffleMode, unmastered, currentCardIndex, currentDeck, settingsLoaded]);

    // حفظ فوري عند الخروج/إغلاق الصفحة لضمان عدم فقدان آخر تغييرات
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            // محاولة حفظ متزامنة قدر الإمكان (fetch قد لا يكتمل دائماً قبل الإغلاق، لكن نحاول)
            try {
                const payload = {
                    smart_mode_enabled: smartModeEnabled,
                    hide_mastered_cards: hideMasteredCards,
                    shuffle_mode: shuffleMode,
                    unmastered_cards: unmastered,
                    current_deck_id: currentDeck?.id || null,
                    current_card_index: currentCardIndex,
                    // تمرير التوكن ضمن الجسم لأن sendBeacon لا يسمح برؤوس مخصصة
                    session_token: localStorage.getItem('session_token')
                };
                navigator.sendBeacon && navigator.sendBeacon(
                    'http://127.0.0.1:8000/api/settings',
                    new Blob([JSON.stringify(payload)], { type: 'application/json' })
                );
            } catch (_) {
                // تجاهل أي خطأ هنا
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [smartModeEnabled, hideMasteredCards, shuffleMode, unmastered, currentDeck, currentCardIndex]);

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
                // تحويل IDs إلى objects
                cardsToDisplay = currentDeck.cards.filter(card =>
                    unmastered.includes(card.id)
                );
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
        try {
            // إضافة محلياً أولاً (فوري)
            setUnmastered(prev => {
                if (prev.includes(card.id)) return prev; // تجنب التكرار

                const newList = [...prev, card.id];
                if (smartModeEnabled && newList.length >= UNMASTERED_LIMIT) {
                    setReviewMode(true);
                }
                return newList;
            });

            // مزامنة في الخلفية بدون تعطيل الواجهة
            Promise.allSettled([
                settingsAPI.addUnmasteredCard(card.id),
                cardsAPI.markCardAsDifficult(currentDeck.id, card.id)
            ]).catch(() => {});
        } catch (error) {
            console.error('Failed to add unmastered card:', error);
        }
    };

    // إزالة بطاقة من قائمة غير المتقنة
    const removeFromUnmastered = (cardId) => {
        try {
            // إزالة محلياً أولاً (فوري)
            setUnmastered(prev => {
                const newList = prev.filter(id => id !== cardId);

                if (smartModeEnabled) {
                    if (newList.length === 0 && reviewMode) {
                        setReviewMode(false);
                    } else if (reviewMode && newList.length < UNMASTERED_LIMIT) {
                        const remainingCards = currentDeck.cards.filter(card =>
                            !newList.includes(card.id) && !card.known
                        );

                        if (remainingCards.length > 0) {
                            const randomCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
                            return [...newList, randomCard.id];
                        }
                    }
                }

                return newList;
            });

            // مزامنة في الخلفية بدون تعطيل الواجهة
            settingsAPI.removeUnmasteredCard(cardId).catch(() => {});
        } catch (error) {
            console.error('Failed to remove unmastered card:', error);
        }
    };

    // زر Next: لم أفهم البطاقة
    const handleNextButtonClick = () => {
        try {
            // سجّل في الخلفية
            cardsAPI.markCardAsSeen(currentDeck.id, currentCard.id)?.catch(() => {});
            addToUnmastered(currentCard);

            // انتقال فوري
            if (smartModeEnabled && unmastered.length >= UNMASTERED_LIMIT - 1) {
                if (currentCardIndex < totalCards - 1) {
                    setCurrentCardIndex(prev => prev + 1);
                } else {
                    setCurrentCardIndex(0);
                }
            } else {
                if (currentCardIndex < totalCards - 1) {
                    setCurrentCardIndex(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Failed to handle next button click:', error);
        }
    };

    // زر Mark as Known: فهمت البطاقة
    const handleMarkAsKnown = () => {
        try {
            // تسجيل عرض البطاقة (خلفية)
            cardsAPI.markCardAsSeen(currentDeck.id, currentCard.id)?.catch(() => {});

            // اجعل البطاقة معروفة محلياً
            toggleCardKnown(currentDeck.id, currentCard.id);

            // إزالة من غير المتقنة (خلفية)
            removeFromUnmastered(currentCard.id);

            if (hideMasteredCards && !smartModeEnabled) {
                const remainingCards = currentDeck.cards.filter(card => !card.known);
                if (remainingCards.length === 0) {
                    alert("تهانينا! لقد أتقنت جميع البطاقات في هذه المجموعة!");
                    return;
                }
            }

            if (smartModeEnabled && reviewMode) {
                if (unmastered.length <= 1) {
                    setReviewMode(false);
                    setCurrentCardIndex(0);
                }
            } else {
                if (currentCardIndex < totalCards - 1) {
                    setCurrentCardIndex(prev => prev + 1);
                } else if (currentCardIndex > 0) {
                    setCurrentCardIndex(prev => prev - 1);
                }
            }
        } catch (error) {
            console.error('Failed to mark card as known:', error);
        }
    };

    const handleToggleKnown = (cardId) => {
        try {
            // تسجيل عرض البطاقة (خلفية)
            cardsAPI.markCardAsSeen(currentDeck.id, cardId)?.catch(() => {});
            // تبديل حالة البطاقة فوراً
            toggleCardKnown(currentDeck.id, cardId);
        } catch (error) {
            console.error('Failed to toggle card known status:', error);
        }
    };

    const handleResetProgress = async () => {
        if (window.confirm("Are you sure you want to reset your progress for this deck?")) {
            try {
                await settingsAPI.resetSettings();
                resetDeckProgress(currentDeck.id);
                // إعادة تعيين النظام
                setUnmastered([]);
                setReviewMode(false);
                setCurrentCardIndex(0);
            } catch (error) {
                console.error('Failed to reset progress:', error);
            }
        }
    };

    const handleToggleShuffle = () => {
        try {
            const newValue = !shuffleMode;
            setShuffleMode(newValue);
            // احفظ في الخلفية (السيف التلقائي سيغطي أيضاً)
            settingsAPI.updateSettings({ shuffle_mode: newValue }).catch(() => {});
        } catch (error) {
            console.error('Failed to toggle shuffle mode:', error);
        }
    };

    const toggleSmartMode = () => {
        try {
            const newValue = !smartModeEnabled;
            setSmartModeEnabled(newValue);
            settingsAPI.updateSettings({ smart_mode_enabled: newValue }).catch(() => {});
            if (!newValue) {
                setReviewMode(false);
            }
        } catch (error) {
            console.error('Failed to toggle smart mode:', error);
        }
    };

    const toggleHideMasteredCards = () => {
        try {
            const newValue = !hideMasteredCards;
            setHideMasteredCards(newValue);
            settingsAPI.updateSettings({ hide_mastered_cards: newValue }).catch(() => {});
        } catch (error) {
            console.error('Failed to toggle hide mastered cards:', error);
        }
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