// API Base URL - Geliştirme sırasında bilgisayarınızın IP adresini girin
// Örnek: 'http://192.168.1.45:5000'
// Production'da sunucu adresinizi yazın
const DEV_API_URL = 'http://10.0.2.2:5000'; // Android emulator için localhost
// const DEV_API_URL = 'http://192.168.205.168:5000'; // Gerçek cihaz için Wi-Fi IP

export const config = {
  apiBaseUrl: DEV_API_URL,
  tokenKey: 'dental_ai_token',
  refreshTokenKey: 'dental_ai_refresh_token',
  idTokenKey: 'dental_ai_id_token',
  userKey: 'dental_ai_user',
};

export default config;
