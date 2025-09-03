// إعدادات API للـ Frontend
const API_CONFIG = {
  // Railway Backend URL
  PRODUCTION_API: 'https://flash-cards-production-5df5.up.railway.app',
  
  // محلي للتطوير
  DEVELOPMENT_API: 'http://localhost:8000',
  
  // الحصول على الرابط الصحيح
  getApiUrl: () => {
    // إذا كان هناك متغير بيئة
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // إذا كان في الإنتاج
    if (process.env.NODE_ENV === 'production') {
      return 'https://flash-cards-production-5df5.up.railway.app';
    }
    
    // تطوير محلي
    return 'http://localhost:8000';
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
