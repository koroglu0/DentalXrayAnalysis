import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config';

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekte AsyncStorage'dan token okuyup Authorization header'ına ekle
apiClient.interceptors.request.use(
  async (requestConfig) => {
    const token = await AsyncStorage.getItem(config.tokenKey);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// 401 gelirse token'ları temizle
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(config.tokenKey);
      await AsyncStorage.removeItem(config.refreshTokenKey);
      await AsyncStorage.removeItem(config.idTokenKey);
      await AsyncStorage.removeItem(config.userKey);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
