// Simple API client with graceful fallback to localStorage
import { API_CONFIG } from '../config/api.js';

// FIXED: Always use the API URL from the config, not environment variables
const API_URL = API_CONFIG.getApiUrl();

// Log the API URL being used for debugging
console.log('⚠️ API Client initialized with URL:', API_URL);

console.log('API Client initializing with URL:', API_URL);

const json = async (res) => {
    if (!res.ok) {
        // Get more details about the error
        let errorDetails;
        try {
            errorDetails = await res.json();
            console.error('API Error Response:', errorDetails);
        } catch (e) {
            errorDetails = await res.text();
            console.error('API Error Text:', errorDetails);
        }
        throw new Error(`HTTP ${res.status}: ${errorDetails?.message || 'Unknown error'}`);
    }
    return res.json();
};

const tryApi = async (fn, fallback) => {
    if (!API_URL) {
        console.log('No API_URL configured, using fallback');
        return fallback();
    }
    try {
        console.log('Trying API request to:', API_URL);
        const result = await fn();
        console.log('API request successful');
        return result;
    } catch (e) {
        console.log('API request failed:', e.message, 'Using fallback');
        return fallback();
    }
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
        async () => {
            console.log(`Toggling known state for card ${cardId} in deck ${deckId}`);
            const response = await fetch(`${API_URL}/api/decks/${deckId}/cards/${cardId}/toggle-known`, { method: 'POST' });
            const result = await json(response);
            console.log('Toggle known result:', result);
            return result;
        },
        () => {
            console.log('Toggle known fallback - no API available');
            return null;
        }
    ),
};
