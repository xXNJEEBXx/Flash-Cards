import React, { createContext, useState, useEffect } from 'react';
import { api } from '../utils/apiClient';

// Create context
export const CardsContext = createContext();

// Generate a unique ID for items
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Provider component
export const CardsProvider = ({ children }) => {
    // Initial state
    const [decks, setDecks] = useState([]);
    // Track recently marked as known cards for undo functionality
    const [recentlyKnownCards, setRecentlyKnownCards] = useState([]);

    // Reusable fetchDecks with smart merge to preserve cross-device progress
    const cleanDecks = (list) => {
        if (!Array.isArray(list)) return [];
        return list.filter(d => d && !d.title?.includes('تجريبية'));
    };

    const fetchDecks = React.useCallback(async () => {
        try {
            console.log('🔄 Loading decks from Laravel API...');
            let apiDecks = await api.listDecks();
            let emptyRetries = 0;

            while (Array.isArray(apiDecks) && apiDecks.length === 0 && emptyRetries < 3) {
                console.log(`⚠️ API returned 0 decks (attempt ${emptyRetries + 1}/3). Retrying in 1.5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                apiDecks = await api.listDecks();
                emptyRetries++;
            }

            const validApiDecks = cleanDecks(apiDecks);

            if (validApiDecks.length > 0) {
                console.log(`✅ API returned ${validApiDecks.length} valid decks`);
                setDecks(prev => {
                    if (prev && prev.length > 0) {
                        const localKnownMap = new Map();
                        prev.forEach(d => {
                            (d.cards || []).forEach(c => {
                                if (c.known) localKnownMap.set(c.id, true);
                            });
                        });

                        // Intelligent merge: card remains known if known on server OR known locally
                        const merged = validApiDecks.map(serverDeck => ({
                            ...serverDeck,
                            cards: (serverDeck.cards || []).map(serverCard => ({
                                ...serverCard,
                                known: !!(serverCard.known || localKnownMap.get(serverCard.id))
                            }))
                        }));

                        // If merged state is functionally identical to prev, preserve prev reference
                        const isSame = prev.length === merged.length && prev.every((d, i) => {
                            const md = merged[i];
                            if (!md || d.id !== md.id || d.title !== md.title || (d.cards || []).length !== (md.cards || []).length) return false;
                            return (d.cards || []).every((c, ci) => {
                                const mc = md.cards[ci];
                                return mc && c.id === mc.id && !!c.known === !!mc.known;
                            });
                        });

                        if (isSame) {
                            return prev;
                        }

                        localStorage.setItem('flashcards-decks', JSON.stringify(merged));
                        return merged;
                    }
                    localStorage.setItem('flashcards-decks', JSON.stringify(validApiDecks));
                    return validApiDecks;
                });
            }
        } catch (error) {
            console.log('ℹ️ Laravel API sync note:', error.message);
        }
    }, []);

    // Initial mount: load localStorage instantly (0ms), then sync with API
    useEffect(() => {
        const storedDecks = localStorage.getItem('flashcards-decks');
        if (storedDecks) {
            try {
                const parsed = JSON.parse(storedDecks);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log('📂 Instant load from localStorage:', parsed.length, 'decks');
                    setDecks(parsed);
                }
            } catch (_) {}
        }

        fetchDecks();

        // Re-sync whenever the user switches back to the tab/window (e.g. mobile returning from PC)
        let lastSyncTime = Date.now();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && Date.now() - lastSyncTime > 30000) {
                lastSyncTime = Date.now();
                console.log('🔄 Tab became active, refreshing decks from server...');
                fetchDecks();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchDecks]);

    // Save to localStorage whenever decks state changes
    useEffect(() => {
        if (decks && decks.length > 0) {
            localStorage.setItem('flashcards-decks', JSON.stringify(decks));
        }
    }, [decks]);

    // Add a new deck (Laravel API first, fallback local)
    const addDeck = async ({ title, description, folder_id = null }) => {
        try {
            console.log('➕ Creating new deck:', title, 'in folder:', folder_id);
            const created = await api.createDeck({ title, description, folder_id });
            if (created && created.id) {
                console.log('✅ Deck created in Laravel API:', created.id);
                setDecks(prev => {
                    const next = [...prev, { ...created, cards: created.cards || [] }];
                    localStorage.setItem('flashcards-decks', JSON.stringify(next));
                    return next;
                });
                return true;
            }
            console.log('❌ API did not return a created deck');
            return false;
        } catch (error) {
            console.log('❌ Error creating deck in Laravel API:', error.message);
            return false;
        }
        // No local fallback to avoid "disappearing" decks on refresh
    };

    // Edit an existing deck
    const editDeck = async ({ id, title, description, folder_id }) => {
        try {
            console.log('✏️ Updating deck:', id, 'folder_id:', folder_id);
            const payload = { title, description };
            if (folder_id !== undefined) {
                payload.folder_id = folder_id;
            }
            const updated = await api.updateDeck(id, payload);
            if (updated && updated.id) {
                console.log('✅ Deck updated in Laravel API:', updated.id);
                setDecks(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));

                // Update localStorage backup
                const updatedDecks = decks.map(d => d.id === updated.id ? { ...d, ...updated } : d);
                localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
                return;
            }
        } catch (error) {
            console.log('❌ Error updating deck in Laravel API:', error.message);
        }

        // Fallback to local only
        setDecks(prev => prev.map(d => d.id === id ? { ...d, title, description, ...(folder_id !== undefined ? { folder_id } : {}) } : d));
    };

    // Directly update a deck's folder_id in local state
    const updateDeckFolder = (deckId, folderId) => {
        setDecks(prev => {
            const next = prev.map(d => d.id === deckId ? { ...d, folder_id: folderId } : d);
            try {
                localStorage.setItem('flashcards-decks', JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    // Delete a deck
    const deleteDeck = async (deckId) => {
        try {
            console.log('🗑️ Deleting deck:', deckId);
            await api.deleteDeck(deckId);
            console.log('✅ Deck deleted from Laravel API');
        } catch (error) {
            console.log('❌ Error deleting deck from Laravel API:', error.message);
        }

        // Update local state regardless of API result
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));

        // Update localStorage backup
        const updatedDecks = decks.filter(deck => deck.id !== deckId);
        localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
    };

    // Add a card to a deck
    const addCard = async (deckId, { question, answer }) => {
        try {
            console.log('➕ Adding card to deck:', deckId);
            const created = await api.addCard(deckId, { question, answer });
            if (created && created.id) {
                console.log('✅ Card created in Laravel API:', created.id);
                setDecks(prev => prev.map(deck => deck.id === deckId ? { ...deck, cards: [...deck.cards, created] } : deck));

                const updatedDecks = decks.map(deck => deck.id === deckId ? { ...deck, cards: [...deck.cards, created] } : deck);
                localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));
                return;
            }
        } catch (error) {
            console.log('❌ Error creating card in Laravel API:', error.message);
        }

        // Fallback to local
        const newCard = {
            id: generateId(),
            question,
            answer,
            known: false,
            createdAt: new Date().toISOString(),
        };
        setDecks(prevDecks => prevDecks.map(deck => deck.id === deckId ? { ...deck, cards: [...deck.cards, newCard] } : deck));
    };

    // Edit a card in a deck
    const editCard = async (deckId, updatedCard) => {
        try {
            const saved = await api.updateCard(deckId, updatedCard.id, updatedCard);
            if (saved && saved.id) {
                setDecks(prev => prev.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.map(c => c.id === saved.id ? { ...c, ...saved } : c) } : deck));
                return;
            }
        } catch (_e) { /* fallback */ }
        setDecks(prevDecks => prevDecks.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.map(card => card.id === updatedCard.id ? { ...card, ...updatedCard } : card) } : deck));
    };

    // Delete a card from a deck
    const deleteCard = async (deckId, cardId) => {
        try { await api.deleteCard(deckId, cardId); } catch (_e) { /* ignore */ }
        setDecks(prevDecks => prevDecks.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.filter(card => card.id !== cardId) } : deck));
    };

    // Toggle a card's known status (optimistic update with API sync and explicit state support)
    const toggleCardKnown = async (deckId, cardId, explicitKnown = null) => {
        console.log(`🔄 Updating card ${cardId} in deck ${deckId}`, explicitKnown !== null ? `to ${explicitKnown}` : '(toggle)');

        // Determine previous known state from current snapshot
        const deckSnapshot = decks.find(d => d.id === deckId);
        const cardSnapshot = deckSnapshot?.cards?.find(c => c.id === cardId);
        const prevKnown = !!cardSnapshot?.known;
        const targetKnown = explicitKnown !== null ? !!explicitKnown : !prevKnown;

        console.log(`Target known state: ${targetKnown} (was ${prevKnown})`);

        // If marking card as known, add to recently known cards for undo functionality
        if (targetKnown && !prevKnown) {
            setRecentlyKnownCards(prev => [...prev, { deckId, cardId, timestamp: Date.now() }]);
            console.log('📝 Added card to recently known cards for undo');
        }

        // Optimistic UI update
        setDecks(prev => prev.map(deck =>
            deck.id === deckId
                ? { ...deck, cards: deck.cards.map(c => c.id === cardId ? { ...c, known: targetKnown } : c) }
                : deck
        ));

        try {
            // Sync with Laravel API with explicit targetKnown
            console.log('📡 Syncing with Laravel API...');
            const updated = await api.toggleKnown(deckId, cardId, targetKnown);

            if (updated && updated.id !== undefined) {
                console.log('✅ API sync successful:', updated);

                // Update with server truth
                setDecks(prev => {
                    const next = prev.map(deck =>
                        deck.id === deckId
                            ? {
                                ...deck, cards: deck.cards.map(c =>
                                    c.id === updated.id ? { ...c, ...updated, known: !!updated.known } : c
                                )
                            }
                            : deck
                    );
                    localStorage.setItem('flashcards-decks', JSON.stringify(next));
                    return next;
                });
            }
        } catch (error) {
            console.warn('API sync note, maintaining local state:', error.message);
        }
    };

    // Reset progress for all cards in a deck
    const resetDeckProgress = async (deckId) => {
        try {
            const deck = await api.resetDeck(deckId);
            if (deck && deck.id) {
                setDecks(prev => prev.map(d => d.id === deck.id ? { ...d, ...deck, cards: (deck.cards || []).map(c => ({ ...c, known: !!c.known })) } : d));
                return;
            }
        } catch (_e) { /* fallback */ }
        setDecks(prevDecks => prevDecks.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.map(card => ({ ...card, known: false })) } : deck));
    };

    // Undo last card marked as known
    const undoLastKnownCard = async () => {
        if (recentlyKnownCards.length === 0) {
            console.log('⚠️ No recently known cards to undo');
            return false;
        }

        const lastKnownCard = recentlyKnownCards[recentlyKnownCards.length - 1];
        const { deckId, cardId } = lastKnownCard;

        console.log('🔄 Undoing last known card:', { deckId, cardId });

        // Remove from recently known cards
        setRecentlyKnownCards(prev => prev.slice(0, -1));

        // Find the card and mark it as unknown
        const targetDeck = decks.find(deck => deck.id === deckId);
        const targetCard = targetDeck?.cards.find(card => card.id === cardId);

        if (!targetCard) {
            console.log('❌ Card not found for undo');
            return false;
        }

        // Update UI optimistically
        setDecks(prev => prev.map(deck =>
            deck.id === deckId
                ? { ...deck, cards: deck.cards.map(c => c.id === cardId ? { ...c, known: false } : c) }
                : deck
        ));

        try {
            // Sync with Laravel API
            console.log('📡 Syncing undo with Laravel API...');
            const updated = await api.toggleKnown(deckId, cardId);

            if (updated && updated.id !== undefined) {
                console.log('✅ Undo API sync successful:', updated);

                // Update with server truth
                setDecks(prev => prev.map(deck =>
                    deck.id === deckId
                        ? {
                            ...deck, cards: deck.cards.map(c =>
                                c.id === updated.id ? { ...c, ...updated } : c
                            )
                        }
                        : deck
                ));

                // Update localStorage backup
                const updatedDecks = decks.map(deck =>
                    deck.id === deckId
                        ? {
                            ...deck, cards: deck.cards.map(c =>
                                c.id === updated.id ? { ...c, ...updated } : c
                            )
                        }
                        : deck
                );
                localStorage.setItem('flashcards-decks', JSON.stringify(updatedDecks));

                console.log('💾 Updated localStorage backup after undo');
            }
            return true;
        } catch (error) {
            console.log('❌ Undo API sync failed:', error.message);

            // Revert optimistic update on failure
            setDecks(prev => prev.map(deck =>
                deck.id === deckId
                    ? { ...deck, cards: deck.cards.map(c => c.id === cardId ? { ...c, known: true } : c) }
                    : deck
            ));

            console.log('🔄 Reverted undo due to sync failure');
            // Re-add to recently known cards since undo failed
            setRecentlyKnownCards(prev => [...prev, lastKnownCard]);
            return false;
        }
    };

    // Reorder decks (optimistic update + API call)
    const reorderDecks = async (orderedDeckIds) => {
        try {
            console.log('🔄 Reordering decks:', orderedDeckIds);

            // Optimistic update of decks state
            setDecks(prev => {
                const idToOrder = {};
                orderedDeckIds.forEach((id, idx) => {
                    idToOrder[id] = idx;
                });

                const updated = prev.map(deck => {
                    if (idToOrder[deck.id] !== undefined) {
                        return { ...deck, order: idToOrder[deck.id] };
                    }
                    return deck;
                });

                // Sort decks by order asc, then id asc
                updated.sort((a, b) => {
                    const orderA = a.order !== undefined && a.order !== null ? a.order : 999999;
                    const orderB = b.order !== undefined && b.order !== null ? b.order : 999999;
                    if (orderA !== orderB) return orderA - orderB;
                    return a.id - b.id;
                });

                localStorage.setItem('flashcards-decks', JSON.stringify(updated));
                return updated;
            });

            // Call API to persist to MySQL
            await api.reorderDecks(orderedDeckIds);
            return true;
        } catch (error) {
            console.error('Error reordering decks:', error);
            return false;
        }
    };

    return (
        <CardsContext.Provider
            value={{
                decks,
                fetchDecks,
                addDeck,
                editDeck,
                deleteDeck,
                addCard,
                editCard,
                deleteCard,
                toggleCardKnown,
                resetDeckProgress,
                undoLastKnownCard,
                updateDeckFolder,
                reorderDecks,
                hasRecentlyKnownCards: recentlyKnownCards.length > 0,
            }}
        >
            {children}
        </CardsContext.Provider>
    );
};