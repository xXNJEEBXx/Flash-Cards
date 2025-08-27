import React, { createContext, useState, useEffect } from 'react';
import { createCybersecurityDeck } from '../utils/cybersecurityCards';
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

    // Load decks: try API first (if configured), else localStorage; ensure cybersecurity deck exists at least once
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const list = await api.listDecks();
                if (!mounted) return;
                if (Array.isArray(list) && list.length > 0) {
                    setDecks(list);
                } else {
                    const storedDecks = localStorage.getItem('flashcards-decks');
                    if (storedDecks) {
                        const parsedDecks = JSON.parse(storedDecks);
                        setDecks(parsedDecks);
                        const cybersecurityDeckExists = parsedDecks.some(d => d.title === 'Cybersecurity Concepts');
                        if (!cybersecurityDeckExists) {
                            const cybersecurityDeck = createCybersecurityDeck();
                            setDecks(prev => [...prev, cybersecurityDeck]);
                        }
                    } else {
                        const cybersecurityDeck = createCybersecurityDeck();
                        setDecks([cybersecurityDeck]);
                    }
                }
            } catch (_e) {
                const storedDecks = localStorage.getItem('flashcards-decks');
                if (storedDecks) {
                    const parsedDecks = JSON.parse(storedDecks);
                    setDecks(parsedDecks);
                } else {
                    const cybersecurityDeck = createCybersecurityDeck();
                    setDecks([cybersecurityDeck]);
                }
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Save decks to localStorage whenever decks change
    useEffect(() => {
        localStorage.setItem('flashcards-decks', JSON.stringify(decks));
    }, [decks]);

    // Add a new deck (API first, fallback local)
    const addDeck = async ({ title, description }) => {
        try {
            const created = await api.createDeck({ title, description });
            if (created && created.id) {
                setDecks(prev => [...prev, { ...created, cards: created.cards || [] }]);
                return;
            }
        } catch (_e) { /* fallback below */ }
        const newDeck = {
            id: generateId(),
            title,
            description,
            cards: [],
            createdAt: new Date().toISOString(),
        };
        setDecks(prevDecks => [...prevDecks, newDeck]);
    };

    // Edit an existing deck
    const editDeck = async ({ id, title, description }) => {
        try {
            const updated = await api.updateDeck(id, { title, description });
            if (updated && updated.id) {
                setDecks(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
                return;
            }
        } catch (_e) { /* fallback below */ }
        setDecks(prevDecks => prevDecks.map(deck => deck.id === id ? { ...deck, title, description } : deck));
    };

    // Delete a deck
    const deleteDeck = async (deckId) => {
        try { await api.deleteDeck(deckId); } catch (_e) { /* ignore */ }
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
    };

    // Add a card to a deck
    const addCard = async (deckId, { question, answer }) => {
        try {
            const created = await api.addCard(deckId, { question, answer });
            if (created && created.id) {
                setDecks(prev => prev.map(deck => deck.id === deckId ? { ...deck, cards: [...deck.cards, created] } : deck));
                return;
            }
        } catch (_e) { /* fallback below */ }
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

    // Toggle a card's known status
    const toggleCardKnown = async (deckId, cardId) => {
        try {
            const saved = await api.toggleKnown(deckId, cardId);
            if (saved && saved.id) {
                setDecks(prev => prev.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.map(c => c.id === saved.id ? { ...c, known: !!saved.known } : c) } : deck));
                return;
            }
        } catch (_e) { /* fallback */ }
        setDecks(prevDecks => prevDecks.map(deck => deck.id === deckId ? { ...deck, cards: deck.cards.map(card => card.id === cardId ? { ...card, known: !card.known } : card) } : deck));
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
            }}
        >
            {children}
        </CardsContext.Provider>
    );
};