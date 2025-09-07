// إعدادات API للـ Frontend
const API_CONFIG = {
    // Railway Backend URL
    PRODUCTION_API: 'https://flash-cards-production-5df5.up.railway.app',

    // محلي للتطوير (موجّه الآن لنفس بيئة Railway لضمان التوحيد)
    DEVELOPMENT_API: 'https://flash-cards-production-5df5.up.railway.app',

    // الحصول على الرابط الصحيح
    getApiUrl: () => {
        // استخدام خادم Railway بدلاً من localhost
        const RAILWAY_API_URL = 'https://flash-cards-production-5df5.up.railway.app';
        console.log('استخدام واجهة برمجة التطبيقات من Railway:', RAILWAY_API_URL);
        return RAILWAY_API_URL;
    }
};

// اختبار الاتصال
const testConnection = async () => {
    try {
        const apiUrl = API_CONFIG.getApiUrl();
        console.log('Testing API:', apiUrl);

        const response = await fetch(`${apiUrl}/api/health`);
        const data = await response.json();

        console.log('✅ API Connection Success:', data);
        return true;
    } catch (error) {
        console.error('❌ API Connection Failed:', error);
        return false;
    }
};

export { API_CONFIG, testConnection };
