// خدمة API للإعدادات والتقدم
import { API_CONFIG } from '../config/api.js';

const API_BASE_URL = API_CONFIG.getApiUrl() + '/api';

// توليد أو جلب session token للضيوف
const getSessionToken = () => {
    let token = localStorage.getItem('session_token');
    if (!token) {
        token = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        localStorage.setItem('session_token', token);
    }
    console.log('Using session token:', token);
    return token;
};

// إعداد headers افتراضية
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Session-Token': getSessionToken(),
    'Accept': 'application/json'
});

export const settingsAPI = {
    // جلب الإعدادات
    async getSettings() {
        try {
            console.log('Fetching settings with token:', getSessionToken());
            const response = await fetch(`${API_BASE_URL}/settings`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch settings');

            const result = await response.json();
            console.log('Settings fetched successfully:', result);
            return result.data;
        } catch (error) {
            console.error('Error fetching settings:', error);
            // إرجاع إعدادات افتراضية في حالة الخطأ
            return {
                smart_mode_enabled: false,
                hide_mastered_cards: false,
                shuffle_mode: false,
                unmastered_cards: [],
                current_deck_id: null,
                current_card_index: 0
            };
        }
    },

    // تحديث الإعدادات
    async updateSettings(settings) {
        try {
            console.log('Updating settings:', settings);
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Failed to update settings');

            const result = await response.json();
            console.log('Settings updated successfully:', result);
            return result.data;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    },

    // إضافة بطاقة لقائمة غير المتقنة
    async addUnmasteredCard(cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/unmastered/add`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ card_id: cardId })
            });

            if (!response.ok) throw new Error('Failed to add unmastered card');

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error adding unmastered card:', error);
            throw error;
        }
    },

    // إزالة بطاقة من قائمة غير المتقنة
    async removeUnmasteredCard(cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/unmastered/remove`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ card_id: cardId })
            });

            if (!response.ok) throw new Error('Failed to remove unmastered card');

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error removing unmastered card:', error);
            throw error;
        }
    },

    // إعادة تعيين الإعدادات
    async resetSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings/reset`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to reset settings');

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw error;
        }
    }
};

export const cardsAPI = {
    // تسجيل عرض البطاقة
    async markCardAsSeen(deckId, cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/decks/${deckId}/cards/${cardId}/mark-seen`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to mark card as seen');

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error marking card as seen:', error);
        }
    },

    // تحديد البطاقة كصعبة
    async markCardAsDifficult(deckId, cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/decks/${deckId}/cards/${cardId}/mark-difficult`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to mark card as difficult');

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error marking card as difficult:', error);
        }
    },

    // جلب إحصائيات البطاقة
    async getCardStats(deckId, cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/decks/${deckId}/cards/${cardId}/stats`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch card stats');

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching card stats:', error);
            return null;
        }
    },

    // تحديث حالة إتقان البطاقة
    async toggleCardKnown(deckId, cardId) {
        try {
            const response = await fetch(`${API_BASE_URL}/decks/${deckId}/cards/${cardId}/toggle-known`, {
                method: 'POST',
                headers: getHeaders()
            });

            if (!response.ok) throw new Error('Failed to toggle card known status');

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error toggling card known status:', error);
            throw error;
        }
    }
};

export default {
    settings: settingsAPI,
    cards: cardsAPI
};
