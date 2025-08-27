// Simple API client with graceful fallback to localStorage
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const json = (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
};

const tryApi = async (fn, fallback) => {
    if (!API_URL) return fallback();
    try { return await fn(); } catch (e) { return fallback(); }
};

export const api = {
    listDecks: () => tryApi(
        () => fetch(`${API_URL}/api/decks`).then(json),
        () => {
            const raw = localStorage.getItem('flashcards-decks');
            return raw ? JSON.parse(raw) : [];
        }
    ),
    createDeck: (data) => tryApi(
        () => fetch(`${API_URL}/api/decks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json),
        () => null
    ),
    updateDeck: (id, data) => tryApi(
        () => fetch(`${API_URL}/api/decks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(json),
        () => null
    ),
    deleteDeck: (id) => tryApi(
        () => fetch(`${API_URL}/api/decks/${id}`, { method: 'DELETE' }).then(() => true),
        () => null
    ),
    resetDeck: (id) => tryApi(
        () => fetch(`${API_URL}/api/decks/${id}/reset`, { method: 'POST' }).then(json),
        () => null
    ),
    addCard: (deckId, data) => tryApi(
        () => fetch(`${API_URL}/api/decks/${deckId}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: data.front || data.question,
                answer: data.back || data.answer
            })
        }).then(json),
        () => null
    ),
    updateCard: (deckId, cardId, data) => tryApi(
        () => fetch(`${API_URL}/api/decks/${deckId}/cards/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: data.front || data.question,
                answer: data.back || data.answer,
                known: data.known
            })
        }).then(json),
        () => null
    ),
    deleteCard: (deckId, cardId) => tryApi(
        () => fetch(`${API_URL}/api/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' }).then(() => true),
        () => null
    ),
    toggleKnown: (deckId, cardId) => tryApi(
        () => fetch(`${API_URL}/api/decks/${deckId}/cards/${cardId}/toggle-known`, { method: 'POST' }).then(json),
        () => null
    ),
};
