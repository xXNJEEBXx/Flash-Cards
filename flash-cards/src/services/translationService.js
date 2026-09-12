/**
 * خدمة الترجمة الفورية لبطاقات المذاكرة (Flash Cards Translation Service)
 * تدعم ترجمة النصوص والبطاقات إلى اللغة العربية بدون الحاجة لمفاتيح إضافية،
 * مع كاش محلي ونظام حماية (Fallback) لضمان استقرار الخدمة دائماً.
 */

const translationCache = new Map();

/**
 * فحص ما إذا كان النص يحتوي بالفعل على أحرف عربية
 * @param {string} text
 * @returns {boolean}
 */
export const hasArabic = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /[\u0600-\u06FF]/.test(text);
};

/**
 * ترجمة نص حر إلى اللغة الهدف (افتراضياً: العربية 'ar')
 * @param {string} text النص المراد ترجمته
 * @param {string} targetLang لغة الهدف
 * @returns {Promise<string>} النص المترجم
 */
export const translateText = async (text, targetLang = 'ar') => {
    if (!text || !text.trim()) return '';

    const cleanText = text.trim();
    const cacheKey = `${targetLang}:${cleanText}`;

    // التحقق من وجود الترجمة في الكاش
    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    // 1. محاولة الترجمة عبر Google Translate API المباشر
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(cleanText)}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && Array.isArray(data[0])) {
                const translated = data[0]
                    .map(item => (item && item[0] ? item[0] : ''))
                    .join('');
                
                if (translated && translated.trim()) {
                    translationCache.set(cacheKey, translated.trim());
                    return translated.trim();
                }
            }
        }
    } catch (err) {
        console.warn('Google Translate API error, falling back to MyMemory:', err);
    }

    // 2. المحاولة عبر MyMemory API في حال فشل المصدر الأول
    try {
        const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|${targetLang}`;
        const response = await fetch(fallbackUrl);
        
        if (response.ok) {
            const data = await response.json();
            if (data?.responseData?.translatedText) {
                const translated = data.responseData.translatedText;
                translationCache.set(cacheKey, translated);
                return translated;
            }
        }
    } catch (fallbackErr) {
        console.error('All translation services failed:', fallbackErr);
    }

    // في حال الفشل التام، أعد النص الأصلي
    return cleanText;
};

/**
 * ترجمة بطاقة كاملة (السؤال والجواب)
 * @param {{ question: string, answer: string }} card
 * @returns {Promise<{ question: string, answer: string, translatedQuestion: string, translatedAnswer: string }>}
 */
export const translateCard = async (card) => {
    if (!card) return null;

    const [translatedQuestion, translatedAnswer] = await Promise.all([
        translateText(card.question || ''),
        translateText(card.answer || '')
    ]);

    return {
        ...card,
        translatedQuestion,
        translatedAnswer
    };
};

/**
 * دمج الترجمة العربية داخل نص البطاقة الأصلي بصيغة منسقة:
 * Original Text (الترجمة العربية)
 * @param {string} original النص الأصلي
 * @param {string} translation الترجمة العربية
 * @returns {string} النص المدمج
 */
export const mergeTranslationWithOriginal = (original, translation) => {
    if (!original) return translation || '';
    if (!translation) return original;

    // إذا كان النص الأصلي يحتوي بالفعل على الترجمة العربية، لا نكررها
    if (original.includes(translation)) {
        return original;
    }

    const trimmedOriginal = original.trim();
    const trimmedTranslation = translation.trim();

    // إذا كان السطر متعدداً
    if (trimmedOriginal.includes('\n')) {
        return `${trimmedOriginal}\n\n[الترجمة: ${trimmedTranslation}]`;
    }

    // إذا كان سطراً واحداً أو سؤالاً
    return `${trimmedOriginal} (${trimmedTranslation})`;
};
