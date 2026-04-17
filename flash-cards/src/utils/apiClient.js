// Simple API client with graceful fallback to localStorage
import { API_CONFIG } from '../config/api.js';

// FIXED: Always use the API URL from the config, not environment variables
const API_URL = API_CONFIG.getApiUrl();

// Log the API URL being used for debugging
console.log('⚠️ API Client initialized with URL:', API_URL);

// helper: sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// helper: fetch with timeout and smart retry for 5xx errors (e.g. MySQL sleep)
const fetchWithTimeout = async (url, options = {}) => {
    const timeout = options.timeout || 15000;
    const retries = 10;
    const baseDelay = 1000;
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);

            const text = await response.clone().text().catch(() => "");
            const isServerError = !response.ok && response.status >= 500;
            const isMySQLGone = text.includes("MySQL server has gone away") || text.includes("SQLSTATE[HY000] [2006]") || text.includes("Connection refused") || text.includes("Failed to fetch folders");

            if (isServerError || isMySQLGone) {
                throw new Error("Server Error or MySQL Asleep");
            }

            return response;
        } catch (error) {
            clearTimeout(id);
            lastError = error;
            console.warn(`[API Retry] Attempt ${attempt}/${retries} failed for ${url}. Waiting before retry...`);

            if (attempt === retries) {
                break;
            }
            // التدرج في الانتظار ليتعافى السيرفر
            await sleep(baseDelay * Math.min(attempt, 5));
        }
    }

    throw lastError;
};

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
        () => fetchWithTimeout(`${API_URL}/api/decks`).then(json).then(r => Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : [])),
        () => {
            try {
                const raw = localStorage.getItem('flashcards-decks');
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                console.error('Error parsing localStorage backup:', e);
                return [];
            }
        }
    ),
    createDeck: (data) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) }).then(json).then(r => r?.data ?? r),
        () => null
    ),
    updateDeck: (id, data) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) }).then(json).then(r => r?.data ?? r),
        () => null
    ),
    deleteDeck: (id) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${id}`, { method: 'DELETE' }).then(() => true),
        () => null
    ),
    resetDeck: (id) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${id}/reset`, { method: 'POST', headers: { 'Accept': 'application/json' } }).then(json).then(r => r?.data ?? r),
        () => null
    ),
    addCard: (deckId, data) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${deckId}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                question: data.front || data.question,
                answer: data.back || data.answer
            })
        }).then(json).then(r => r?.data ?? r),
        () => null
    ),
    updateCard: (deckId, cardId, data) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${deckId}/cards/${cardId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                question: data.front || data.question,
                answer: data.back || data.answer,
                known: data.known
            })
        }).then(json).then(r => r?.data ?? r),
        () => null
    ),
    deleteCard: (deckId, cardId) => tryApi(
        () => fetchWithTimeout(`${API_URL}/api/decks/${deckId}/cards/${cardId}`, { method: 'DELETE' }).then(() => true),
        () => null
    ),
    toggleKnown: (deckId, cardId) => tryApi(
        async () => {
            console.log(`Toggling known state for card ${cardId} in deck ${deckId}`);
            const response = await fetchWithTimeout(`${API_URL}/api/decks/${deckId}/cards/${cardId}/toggle-known`, { method: 'POST', headers: { 'Accept': 'application/json' } });
            const result = await json(response);
            const data = result?.data ?? result;
            console.log('Toggle known result:', data);
            return data;
        },
        () => {
            console.log('Toggle known fallback - no API available');
            return null;
        }
    ),
};


