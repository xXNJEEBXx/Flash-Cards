// اختبار مباشر لوظائف API
const API_URL = 'http://localhost:8000';

// محاكاة apiClient.js
const json = (res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

const api = {
    listDecks: () => tryApi(
        () => fetch(`${API_URL}/api/decks`).then(json),
        () => {
            const raw = localStorage.getItem('flashcards-decks');
            return raw ? JSON.parse(raw) : [];
        }
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

// اختبار العمليات
async function testFlashCards() {
    console.log('=== بداية اختبار Flash Cards ===');

    // 1. جلب البطاقات
    console.log('\n1. جلب البطاقات...');
    const decks = await api.listDecks();
    console.log('البطاقات المحملة:', decks.length, 'مجموعة');

    if (decks.length > 0 && decks[0].cards && decks[0].cards.length > 0) {
        const deck = decks[0];
        const firstCard = deck.cards[0];

        console.log('\nبيانات البطاقة الأولى:');
        console.log('- ID:', firstCard.id);
        console.log('- السؤال:', firstCard.question);
        console.log('- الحالة الحالية:', firstCard.known ? 'محفوظ' : 'غير محفوظ');

        // 2. تغيير حالة البطاقة
        console.log('\n2. تغيير حالة البطاقة...');
        const toggleResult = await api.toggleKnown(deck.id, firstCard.id);

        if (toggleResult && toggleResult.data) {
            console.log('تم تغيير الحالة بنجاح:');
            console.log('- الحالة الجديدة:', toggleResult.data.known ? 'محفوظ' : 'غير محفوظ');
            console.log('- مرات الحفظ:', toggleResult.data.times_known);
        } else {
            console.log('فشل في تغيير الحالة أو تم استخدام fallback');
        }

        // 3. التحقق من الحفظ
        console.log('\n3. التحقق من الحالة بعد التغيير...');
        const updatedDecks = await api.listDecks();
        const updatedCard = updatedDecks[0].cards.find(c => c.id === firstCard.id);

        if (updatedCard) {
            console.log('حالة البطاقة بعد التحديث:', updatedCard.known ? 'محفوظ' : 'غير محفوظ');
            console.log('تم حفظ التغيير بنجاح في قاعدة البيانات!');
        }

        // 4. اختبار localStorage
        console.log('\n4. اختبار localStorage...');
        const localData = localStorage.getItem('flashcards-decks');
        if (localData) {
            const parsedLocal = JSON.parse(localData);
            const localCard = parsedLocal[0]?.cards?.find(c => c.id === firstCard.id);
            if (localCard) {
                console.log('حالة البطاقة في localStorage:', localCard.known ? 'محفوظ' : 'غير محفوظ');
            }
        }
    }

    console.log('\n=== انتهاء الاختبار ===');
}

// تشغيل الاختبار
testFlashCards().catch(console.error);
