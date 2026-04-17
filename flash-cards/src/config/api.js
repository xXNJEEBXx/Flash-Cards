// إعدادات API للـ Frontend
const API_CONFIG = {
    // Railway Backend URL
    PRODUCTION_API: 'https://flash-cards-production-e52d.up.railway.app',

    // محلي للتطوير (موجّه الآن لنفس بيئة Railway لضمان التوحيد)
    DEVELOPMENT_API: 'https://flash-cards-production-e52d.up.railway.app',

    // الحصول على الرابط الصحيح
    getApiUrl: () => {
        // استخدام خادم Railway بدلاً من localhost
        const RAILWAY_API_URL = 'https://flash-cards-production-e52d.up.railway.app';
        console.log('استخدام واجهة برمجة التطبيقات من Railway:', RAILWAY_API_URL);
        return RAILWAY_API_URL;
    }
};

// اختبار الاتصال
const testConnection = async () => {
    try {
        const apiUrl = API_CONFIG.getApiUrl();
        console.log('Testing API:', apiUrl);

        let response;
        for (let i = 1; i <= 10; i++) {
            try {
                response = await fetch(`${apiUrl}/api/health`);
                if (response.ok) break;
                if (!response.ok && response.status >= 500) throw new Error("Server sleeping");
            } catch (err) {
                console.warn(`Health check attempt ${i} failed. Retrying...`);
                if (i === 10) throw err;
                await new Promise(r => setTimeout(r, 1000 * Math.min(i, 3)));
            }
        }

        const data = await response.json();

        console.log('API Connection Success:', data);
        return true;
    } catch (error) {
        console.error('API Connection Failed:', error);
        return false;
    }
};

export { API_CONFIG, testConnection };
