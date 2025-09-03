// اختبار سريع لـ API URLs
import { API_CONFIG } from './src/config/api.js';

console.log('=== API Configuration Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final API URL:', API_CONFIG.getApiUrl());
console.log('================================');

// اختبار الاتصال
API_CONFIG.testConnection = async () => {
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

export default API_CONFIG;
