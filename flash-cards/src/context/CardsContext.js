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

    // Load decks: try Laravel API first, then localStorage fallback
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                console.log('🔄 Loading decks from Laravel API...');

                // Load decks from Laravel API
                const apiDecks = await api.listDecks();

                if (!mounted) return;

                if (Array.isArray(apiDecks)) {
                    console.log(`✅ API returned ${apiDecks.length} decks`);
                    setDecks(apiDecks);
                    // Only overwrite localStorage if API has data; avoid erasing local drafts
                    if (apiDecks.length > 0) {
                        localStorage.setItem('flashcards-decks', JSON.stringify(apiDecks));
                    } else {
                        console.log('API empty, keeping existing localStorage');
                    }
                } else {
                    console.log('⚠️ Unexpected API response, falling back to localStorage');
                    await loadFromLocalStorageOrCreateDefault();
                }
            } catch (error) {
                console.log('❌ Laravel API error:', error.message);
                if (!mounted) return;
                await loadFromLocalStorageOrCreateDefault();
            }

            async function loadFromLocalStorageOrCreateDefault() {
                const storedDecks = localStorage.getItem('flashcards-decks');
                if (storedDecks) {
                    const parsedDecks = JSON.parse(storedDecks);
                    console.log('📂 Loaded from localStorage:', parsedDecks.length, 'decks');
                    setDecks(parsedDecks);
                } else {
                    console.log('🗃️ No localStorage decks found; using empty state');
                    setDecks([]);
                }
            }
        })();

        return () => { mounted = false; };
    }, []);

    // Save to localStorage whenever decks state changes
    useEffect(() => {
        if (decks.length > 0) {
            localStorage.setItem('flashcards-decks', JSON.stringify(decks));
            console.log('Saved decks to localStorage:', decks.length, 'decks');
        }
    }, [decks]);

    // Save decks to localStorage whenever decks change
    useEffect(() => {
        localStorage.setItem('flashcards-decks', JSON.stringify(decks));
    }, [decks]);

    // Add a new deck (Laravel API first, fallback local)
    const addDeck = async ({ title, description }) => {
        try {
            console.log('➕ Creating new deck:', title);
            const created = await api.createDeck({ title, description });
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
    const editDeck = async ({ id, title, description }) => {
        try {
            console.log('✏️ Updating deck:', id);
            const updated = await api.updateDeck(id, { title, description });
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
        setDecks(prev => prev.map(d => d.id === id ? { ...d, title, description } : d));
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

    // Toggle a card's known status (optimistic update with API sync)
    const toggleCardKnown = async (deckId, cardId) => {
        console.log(`🔄 Toggling card ${cardId} in deck ${deckId}`);

        // Determine previous known state from current snapshot
        const deckSnapshot = decks.find(d => d.id === deckId);
        const cardSnapshot = deckSnapshot?.cards?.find(c => c.id === cardId);
        const prevKnown = !!cardSnapshot?.known;

        console.log(`Previous known state: ${prevKnown}`);

        // If marking card as known, add to recently known cards for undo functionality
        if (!prevKnown) {
            setRecentlyKnownCards(prev => [...prev, { deckId, cardId, timestamp: Date.now() }]);
            console.log('📝 Added card to recently known cards for undo');
        }

        // Optimistic UI update
        setDecks(prev => prev.map(deck =>
            deck.id === deckId
                ? { ...deck, cards: deck.cards.map(c => c.id === cardId ? { ...c, known: !prevKnown } : c) }
                : deck
        ));

        console.log(`Updated UI optimistically to: ${!prevKnown}`);

        try {
            // Sync with Laravel API
            console.log('📡 Syncing with Laravel API...');
            const updated = await api.toggleKnown(deckId, cardId);

            if (updated && updated.id !== undefined) {
                console.log('✅ API sync successful:', updated);

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

                console.log('💾 Updated localStorage backup');
                console.log(`Synced with API: ${!!updated.known}`);
            }
        } catch (error) {
            console.log('❌ API sync failed:', error.message);

            // Revert optimistic update on failure
            setDecks(prev => prev.map(deck =>
                deck.id === deckId
                    ? { ...deck, cards: deck.cards.map(c => c.id === cardId ? { ...c, known: prevKnown } : c) }
                    : deck
            ));

            console.log('🔄 Reverted to previous state due to sync failure');
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

    return (
        <CardsContext.Provider
            value={{
                decks,
                addDeck,
                editDeck,
                deleteDeck,
                addCard,
                editCard,
                deleteCard,
                toggleCardKnown,
                resetDeckProgress,
                undoLastKnownCard,
                hasRecentlyKnownCards: recentlyKnownCards.length > 0,
            }}
        >
            {children}
        </CardsContext.Provider>
    );
};