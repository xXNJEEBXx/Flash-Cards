import React, { useState, useContext, useEffect, useRef } from 'react';
import { CardsContext } from '../../context/CardsContext';
import Card from '../Card/Card';
import { settingsAPI, cardsAPI } from '../../services/apiService';
import './StudyMode.css';
import './smart-mode.css';

const StudyMode = ({ deckId, onBack }) => {
    const { decks, toggleCardKnown, resetDeckProgress, undoLastKnownCard, hasRecentlyKnownCards } = useContext(CardsContext);
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
                    'https://flash-cards-production-5df5.up.railway.app/api/settings',
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

    // Find the current deck and reset systems state if needed
    useEffect(() => {
        console.log(`🔍 Looking for deck ID: ${deckId}`);
        const deck = decks.find(d => d.id === deckId);
        if (deck) {
            console.log(`✅ Found deck: ${deck.title} with ${deck.cards.length} cards`);
            setCurrentDeck(deck);

            // إعادة ضبط حالة النظام الذكي ووضع المراجعة عند تغيير المجموعة
            if (smartModeEnabled) {
                console.log('🧠 Smart Mode is active - checking non-mastered cards');
                const nonMasteredCount = deck.cards.filter(card => !card.known).length;
                console.log(`📊 Found ${nonMasteredCount} non-mastered cards in this deck`);

                // إذا كان هناك خلل في وضع المراجعة، نعيد ضبطه
                if (reviewMode && (unmastered.length === 0 || nonMasteredCount === 0)) {
                    console.log('🔄 Resetting review mode for new deck');
                    setReviewMode(false);
                }
            }

            // Initialize cards array
            setCards([...deck.cards]);
        } else {
            console.log(`⚠️ Deck with ID ${deckId} not found!`);
        }
    }, [deckId, decks, smartModeEnabled, reviewMode, unmastered]);

    // تحسين معالجة وضع المراجعة وقائمة unmastered
    useEffect(() => {
        if (reviewMode && unmastered.length === 0) {
            console.log('🔄 Resetting review mode due to empty unmastered list');
            setReviewMode(false);
        }
    }, [reviewMode, unmastered]);

    // تحقق من حالة البطاقات عند تفعيل النظام الذكي
    useEffect(() => {
        if (currentDeck) {
            // تنفيذ فقط عند تغيير حالة النظام الذكي
            console.log(`🧠 Smart Mode status changed: ${smartModeEnabled ? 'ENABLED' : 'DISABLED'}`);

            // تحقق من وجود بطاقات غير متقنة
            const nonMasteredCards = currentDeck.cards.filter(card => !card.known);
            console.log(`📊 Found ${nonMasteredCards.length} non-mastered cards in deck`);

            if (smartModeEnabled) {
                // عند تفعيل النظام الذكي، قم بتهيئة قائمة unmastered بشكل صحيح
                // إذا كانت القائمة فارغة أو تم إعادة تفعيل النظام، أعد تهيئتها
                console.log('🔄 Smart Mode: initializing unmastered list with non-mastered cards');

                // أضف بطاقات غير متقنة عشوائياً إلى قائمة unmastered
                if (nonMasteredCards.length > 0) {
                    const cardsToAdd = [...nonMasteredCards]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, Math.min(UNMASTERED_LIMIT, nonMasteredCards.length))
                        .map(card => card.id);

                    console.log(`🔄 Adding ${cardsToAdd.length} cards to unmastered list`);

                    // تحديث قائمة unmastered محلياً
                    setUnmastered(cardsToAdd);

                    // مزامنة مع الخادم
                    Promise.all(cardsToAdd.map(cardId =>
                        settingsAPI.addUnmasteredCard(cardId).catch(() => { })
                    ));

                    // إذا وصلنا للحد، فعّل وضع المراجعة
                    if (cardsToAdd.length >= UNMASTERED_LIMIT) {
                        console.log('🔄 Activating review mode');
                        setReviewMode(true);
                    }
                }
            } else {
                // عند إيقاف النظام الذكي، يمكننا إعادة ضبط وضع المراجعة
                if (reviewMode) {
                    console.log('🔄 Disabling review mode when smart mode is disabled');
                    setReviewMode(false);
                }
            }

            // إذا كان وضع المراجعة مفعلاً وقائمة unmastered فارغة، أوقف وضع المراجعة
            if (reviewMode && unmastered.length === 0) {
                console.log('⚠️ Smart Mode: review mode active but unmastered list is empty - resetting');
                setReviewMode(false);
            }
        }
    }, [smartModeEnabled, currentDeck]);

    // Handle shuffle mode and card filtering
    useEffect(() => {
        if (currentDeck) {
            let cardsToDisplay = [];

            if (smartModeEnabled) {
                console.log('🎯 Smart Mode: ACTIVE');
                // الخطوة 1: دائماً ابدأ بجميع البطاقات غير المتقنة
                const nonMasteredCards = currentDeck.cards.filter(card => !card.known);
                console.log(`� Found ${nonMasteredCards.length} non-mastered cards`);

                // الخطوة 2: تحقق من وضع المراجعة وقائمة unmastered
                if (reviewMode && unmastered.length > 0) {
                    console.log('🔄 In REVIEW MODE with active unmastered list');
                    // اعرض البطاقات من قائمة unmastered فقط
                    const activeUnmastered = unmastered.slice(-UNMASTERED_LIMIT);
                    console.log(`📝 Using ${activeUnmastered.length} cards from unmastered list`);

                    // تحويل قائمة activeUnmastered إلى بطاقات للعرض
                    const idToOrder = new Map(activeUnmastered.map((id, idx) => [id, idx]));
                    const unmasteredCards = currentDeck.cards
                        .filter(card => idToOrder.has(card.id))
                        .sort((a, b) => idToOrder.get(a.id) - idToOrder.get(b.id));

                    // إذا وجدنا بطاقات من قائمة unmastered، استخدمها
                    if (unmasteredCards.length > 0) {
                        console.log('✅ Successfully found cards from unmastered list');
                        // إضافة إشارة مرئية للبطاقات في وضع المراجعة المكثفة
                        cardsToDisplay = unmasteredCards.map(card => ({
                            ...card,
                            isInReviewMode: true,
                            smartModeHighlight: true
                        }));
                    } else {
                        // احتياطي: إذا لم نجد بطاقات، استخدم غير المتقنة
                        console.log('⚠️ No cards found in unmastered list, using all non-mastered');
                        cardsToDisplay = nonMasteredCards;
                    }
                } else if (unmastered.length > 0) {
                    // الخطوة 3: إذا لم نكن في وضع المراجعة ولكن لدينا بطاقات في قائمة unmastered
                    console.log('📚 Smart mode - prioritizing difficult cards');

                    // ترتيب البطاقات لإعطاء الأولوية للبطاقات الصعبة
                    // أولاً: البطاقات غير المتقنة والتي في قائمة unmastered
                    const difficultCardIds = new Set(unmastered);
                    const difficultCards = nonMasteredCards
                        .filter(card => difficultCardIds.has(card.id))
                        .map(card => ({ ...card, isHighPriority: true, smartModeHighlight: true }));

                    // ثانياً: البطاقات غير المتقنة الأخرى
                    const otherNonMastered = nonMasteredCards
                        .filter(card => !difficultCardIds.has(card.id));

                    // دمج القائمتين مع إعطاء الأولوية للبطاقات الصعبة
                    cardsToDisplay = [...difficultCards, ...otherNonMastered];
                    console.log(`📝 Prioritizing ${difficultCards.length} difficult cards out of ${cardsToDisplay.length} total`);
                } else {
                    // الخطوة 4: إذا لم يكن لدينا أي بطاقات صعبة
                    console.log('📚 Smart mode - standard view (no difficult cards yet)');
                    cardsToDisplay = nonMasteredCards;
                }

                // الخطوة 4: تحقق نهائي من وجود بطاقات
                if (cardsToDisplay.length === 0 && currentDeck.cards.length > 0) {
                    console.log('🚨 No cards to display despite having cards in deck!');
                    // الخطة B: استخدم البطاقات غير المتقنة أولاً، وإن لم تتوفر، استخدم جميع البطاقات
                    const nonMasteredCards = currentDeck.cards.filter(card => !card.known);
                    if (nonMasteredCards.length > 0) {
                        console.log('🔄 Fallback: using non-mastered cards');
                        cardsToDisplay = nonMasteredCards;
                    } else {
                        console.log('🔄 Fallback: using all cards');
                        cardsToDisplay = [...currentDeck.cards];
                    }

                    // تأكد من إيقاف وضع المراجعة إذا كنا وصلنا إلى هنا مع تفعيل النظام الذكي
                    if (reviewMode) {
                        console.log('🔄 Exiting review mode due to fallback logic');
                        setReviewMode(false);
                    }
                }

                console.log(`🃏 Final cards to display: ${cardsToDisplay.length}`);
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

            // إذا كان لدينا تغيير كبير في قائمة البطاقات، يمكن أن نعيد ضبط الفهرس إلى 0
            const shouldResetIndex = Math.abs((cards.length || 0) - cardsToDisplay.length) > 5;

            // حدّث قائمة العرض مع الحفاظ على الفهرس الحالي قدر الإمكان
            setCards(cardsToDisplay);
            setCurrentCardIndex(prev => {
                if (!Array.isArray(cardsToDisplay) || cardsToDisplay.length === 0) {
                    console.log('⚠️ No cards to display - resetting index to 0');
                    return 0;
                }

                // إعادة ضبط الفهرس إلى 0 إذا كان هناك تغيير كبير في القائمة
                if (shouldResetIndex) {
                    console.log('🔄 Significant change in card list - resetting index to 0');
                    return 0;
                }

                // التأكد من أن الفهرس في نطاق صحيح
                const maxIndex = cardsToDisplay.length - 1;
                const validIndex = Math.min(prev, maxIndex);
                if (validIndex !== prev) {
                    console.log(`🔄 Adjusting index from ${prev} to ${validIndex}`);
                }
                return validIndex;
            });
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

    const totalCards = cards.length;
    const safeIndex = totalCards > 0 ? Math.min(currentCardIndex, totalCards - 1) : 0;
    const currentCard = totalCards > 0 ? cards[safeIndex] : null;
    const deckTotal = currentDeck.cards.length;
    const deckKnown = currentDeck.cards.filter(card => card.known).length;
    const deckRemaining = Math.max(deckTotal - deckKnown, 0);
    const progressPercent = deckTotal > 0 ? (deckKnown / deckTotal) * 100 : 0;

    const handlePrevCard = () => {
        setCurrentCardIndex(prev => (prev > 0 ? prev - 1 : prev));
    };

    // إضافة بطاقة لقائمة غير المتقنة
    const addToUnmastered = (card) => {
        try {
            console.log(`🔖 Adding card ${card.id} to unmastered list`);

            // إضافة محلياً أولاً (فوري)
            setUnmastered(prev => {
                if (prev.includes(card.id)) {
                    console.log(`⚠️ Card ${card.id} already in unmastered list - skipping`);
                    return prev; // تجنب التكرار
                }

                // إذا كان النظام الذكي مفعّل ووصلنا للحد أو في وضع المراجعة، لا نضيف بطاقات جديدة
                if (smartModeEnabled && (reviewMode || prev.length >= UNMASTERED_LIMIT)) {
                    console.log(`⚠️ Smart mode limit reached or in review mode - not adding card ${card.id}`);
                    return prev;
                }

                console.log(`✅ Adding card ${card.id} to unmastered list (total: ${prev.length + 1})`);
                const newList = [...prev, card.id];

                // إذا وصلنا للحد، فعّل وضع المراجعة
                if (smartModeEnabled && newList.length >= UNMASTERED_LIMIT) {
                    console.log(`🔄 Reached unmastered limit (${UNMASTERED_LIMIT}) - activating review mode`);
                    setReviewMode(true);
                }

                return newList;
            });

            // مزامنة في الخلفية بدون تعطيل الواجهة
            Promise.allSettled([
                settingsAPI.addUnmasteredCard(card.id),
                cardsAPI.markCardAsDifficult(currentDeck.id, card.id)
            ]).catch(() => { });
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
            settingsAPI.removeUnmasteredCard(cardId).catch(() => { });
        } catch (error) {
            console.error('Failed to remove unmastered card:', error);
        }
    };

    // زر Next: لم أفهم البطاقة
    const handleNextButtonClick = () => {
        try {
            // سجّل في الخلفية
            cardsAPI.markCardAsSeen(currentDeck.id, currentCard.id)?.catch(() => { });

            if (smartModeEnabled) {
                if (reviewMode || unmastered.length >= UNMASTERED_LIMIT) {
                    // في وضع المراجعة: لف داخل المجموعة الحالية فقط
                    setCurrentCardIndex(prev => (totalCards > 0 ? (prev + 1) % totalCards : 0));
                } else {
                    const willAdd = !unmastered.includes(currentCard.id);
                    const nextLen = unmastered.length + (willAdd ? 1 : 0);

                    if (nextLen >= UNMASTERED_LIMIT) {
                        // سنصل للحد بهذه البطاقة: أدخل وضع المراجعة فوراً وحدث العرض فوراً
                        addToUnmastered(currentCard);
                        const nextSet = willAdd ? [...unmastered, currentCard.id] : [...unmastered];
                        const activeUnmastered = nextSet.slice(-UNMASTERED_LIMIT);
                        const idToOrder = new Map(activeUnmastered.map((id, idx) => [id, idx]));
                        const reviewCards = currentDeck.cards
                            .filter(c => idToOrder.has(c.id))
                            .sort((a, b) => idToOrder.get(a.id) - idToOrder.get(b.id));
                        setCards(reviewCards);
                        setReviewMode(true);
                        setCurrentCardIndex(0);
                    } else {
                        // أضف البطاقة واستمر بشكل طبيعي
                        addToUnmastered(currentCard);
                        if (currentCardIndex < totalCards - 1) {
                            setCurrentCardIndex(prev => prev + 1);
                        }
                    }
                }
            } else {
                // النظام الذكي غير مفعّل: سلوك عادي
                addToUnmastered(currentCard);
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
            cardsAPI.markCardAsSeen(currentDeck.id, currentCard.id)?.catch(() => { });

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
            cardsAPI.markCardAsSeen(currentDeck.id, cardId)?.catch(() => { });
            // تبديل حالة البطاقة فوراً
            toggleCardKnown(currentDeck.id, cardId);

            // عند تبديل حالة البطاقة، إذا كانت unmastered فارغة ونحن في وضع المراجعة، فاخرج من وضع المراجعة
            if (reviewMode && unmastered.length === 0) {
                console.log('🔄 Exiting review mode due to empty unmastered list');
                setReviewMode(false);
            }
        } catch (error) {
            console.error('Failed to toggle card known status:', error);
        }
    };

    // دالة إلغاء آخر بطاقة تم تحديدها كمعروفة
    const handleUndoLastKnown = async () => {
        try {
            const success = await undoLastKnownCard();
            if (success) {
                console.log('✅ Successfully undid last known card');
                // إعادة تحديث البيانات المحلية
                const updatedDeck = decks.find(deck => deck.id === deckId);
                if (updatedDeck) {
                    setCurrentDeck(updatedDeck);

                    // تحديث البطاقات بناءً على الإعدادات الحالية
                    let cardsToDisplay = [...updatedDeck.cards];

                    if (hideMasteredCards) {
                        cardsToDisplay = cardsToDisplay.filter(card => !card.known);
                    }

                    if (shuffleMode) {
                        cardsToDisplay = cardsToDisplay.sort(() => Math.random() - 0.5);
                    }

                    setCards(cardsToDisplay);
                }
            } else {
                console.log('⚠️ Could not undo last known card');
            }
        } catch (error) {
            console.error('Failed to undo last known card:', error);
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
            settingsAPI.updateSettings({ shuffle_mode: newValue }).catch(() => { });
        } catch (error) {
            console.error('Failed to toggle shuffle mode:', error);
        }
    };

    const toggleSmartMode = () => {
        try {
            const newValue = !smartModeEnabled;
            setSmartModeEnabled(newValue);

            // حفظ الإعدادات
            settingsAPI.updateSettings({ smart_mode_enabled: newValue }).catch(() => { });

            if (newValue && currentDeck) {
                // عند تفعيل النظام الذكي، نهيئ قائمة البطاقات غير المتقنة
                const nonMasteredCards = currentDeck.cards.filter(card => !card.known);

                if (nonMasteredCards.length > 0) {
                    // اختر مجموعة من البطاقات غير المتقنة عشوائياً
                    const cardsToAdd = [...nonMasteredCards]
                        .sort(() => Math.random() - 0.5)
                        .slice(0, Math.min(UNMASTERED_LIMIT, nonMasteredCards.length))
                        .map(card => card.id);

                    // تحديث قائمة البطاقات غير المتقنة
                    setUnmastered(cardsToAdd);

                    // إذا وصلنا للحد، فعّل وضع المراجعة
                    if (cardsToAdd.length >= UNMASTERED_LIMIT) {
                        setReviewMode(true);
                    }

                    // حفظ على الخادم
                    Promise.all(cardsToAdd.map(cardId =>
                        settingsAPI.addUnmasteredCard(cardId).catch(() => { })
                    ));
                }
            } else if (!newValue) {
                // عند إيقاف النظام الذكي، نوقف وضع المراجعة
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
            settingsAPI.updateSettings({ hide_mastered_cards: newValue }).catch(() => { });
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

                {/* إخفاء عداد النظام الذكي بناءً على الطلب */}

                <div className="study-progress">
                    <span className="progress-text">
                        Card {totalCards > 0 ? safeIndex + 1 : 0} of {totalCards}
                    </span>
                    <div className="progress-bar-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                    <span className="progress-text">
                        تم إتقان {deckKnown} من أصل {deckTotal} • المتبقي {deckRemaining}
                    </span>
                </div>
            </div>

            {/* منطقة البطاقة مع أزرار التنقل */}
            {totalCards === 0 ? (
                <div className="empty-deck">
                    <h3>No cards to display</h3>
                    <p>
                        {smartModeEnabled ? (
                            'جاري تحميل البطاقات غير المتقنة... إذا استمرت المشكلة، حاول تعطيل النظام الذكي ثم إعادة تفعيله.'
                        ) : hideMasteredCards ? (
                            'تم إتقان جميع البطاقات المرئية. قم بتعطيل خيار إخفاء البطاقات المتقنة أو إعادة ضبط التقدم.'
                        ) : (
                            'جرب إضافة بطاقات لهذه المجموعة.'
                        )}
                    </p>
                </div>
            ) : (
                <div className="card-area">
                    {/* زر Previous على اليسار */}
                    <button
                        className="btn btn-navigation btn-previous"
                        onClick={handlePrevCard}
                        disabled={currentCardIndex === 0}
                        title="البطاقة السابقة"
                    >
                        <span className="btn-icon">⬅️</span>
                        <span className="btn-text">Previous</span>
                    </button>

                    {/* البطاقة في المنتصف */}
                    <div className="card-container-flexible">
                        <Card
                            card={currentCard}
                            onToggleKnown={handleToggleKnown}
                            inStudyMode={true}
                        />
                    </div>

                    {/* زر Next على اليمين */}
                    <button
                        className="btn btn-navigation btn-next"
                        onClick={handleNextButtonClick}
                        title="البطاقة التالية (لم أفهمها)"
                    >
                        <span className="btn-text">Next</span>
                        <span className="btn-icon">➡️</span>
                    </button>
                </div>
            )}

            {/* أزرار التحكم الرئيسية تحت البطاقة */}
            <div className="study-controls-bottom">
                <button
                    className="btn btn-success btn-main-action"
                    onClick={handleMarkAsKnown}
                    title="فهمت هذه البطاقة"
                >
                    <span className="btn-icon">✅</span>
                    <span className="btn-text">Mark as Known</span>
                </button>

                <button
                    className={`btn btn-settings ${showSettingsPanel ? 'active' : ''}`}
                    onClick={toggleSettingsPanel}
                    title="إعدادات الدراسة"
                >
                    <span className="btn-icon">⚙️</span>
                    <span className="btn-text">إعدادات</span>
                </button>

                {hasRecentlyKnownCards && (
                    <button
                        className="btn btn-undo"
                        onClick={handleUndoLastKnown}
                        title="إلغاء آخر بطاقة متقنة"
                    >
                        <span className="btn-icon">↶</span>
                        <span className="btn-text">Undo Last</span>
                    </button>
                )}
            </div>

            {/* لوحة الإعدادات */}
            {showSettingsPanel && (
                <div className="settings-panel">
                    <h3>⚙️ إعدادات الدراسة</h3>

                    <div className="settings-grid">
                        {/* النظام الذكي */}
                        <div className="setting-item">
                            <div className="setting-label">
                                <span>🧠 النظام الذكي</span>
                                <small>نظام ذكي للتركيز على البطاقات التي تجد صعوبة في تذكرها</small>
                                {smartModeEnabled && (
                                    <div className="smart-mode-info">
                                        {reviewMode ? (
                                            <span className="review-mode-badge">وضع المراجعة المركزة مفعل (🔄)</span>
                                        ) : (
                                            <span>عند الضغط على "لم أفهم البطاقة" سيتم إضافتها للنظام الذكي</span>
                                        )}
                                        <span className="smart-stats">عدد البطاقات في النظام الذكي: {unmastered.length}/{UNMASTERED_LIMIT}</span>
                                    </div>
                                )}
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