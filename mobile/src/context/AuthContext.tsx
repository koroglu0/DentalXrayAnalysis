import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import apiClient from '../api/client';
import { config } from '../config';

WebBrowser.maybeCompleteAuthSession();

export type UserRole = 'admin' | 'doctor' | 'patient';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  id?: string;
  phone?: string;
  specialization?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleProfile: (role: string, password?: string, inviteCode?: string, specialization?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<Pick<User, 'name' | 'phone'>>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
  phone?: string;
  specialization?: string;
  invite_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Uygulama açılışında kayıtlı oturumu kontrol et
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(config.tokenKey);
        const savedUser = await AsyncStorage.getItem(config.userKey);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // Sessizce geç
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/api/login', { email, password });
    const data = response.data;

    const accessToken = data.access_token || data.token;
    await AsyncStorage.setItem(config.tokenKey, accessToken);
    if (data.id_token) await AsyncStorage.setItem(config.idTokenKey, data.id_token);
    if (data.refresh_token) await AsyncStorage.setItem(config.refreshTokenKey, data.refresh_token);
    await AsyncStorage.setItem(config.userKey, JSON.stringify(data.user));

    setToken(accessToken);
    setUser(data.user);

    // Rol bazlı yönlendirme
    const role: UserRole = data.user?.role;
    if (role === 'admin') router.replace('/(admin)');
    else if (role === 'doctor') router.replace('/(doctor)');
    else router.replace('/(patient)');
  };

  const loginWithGoogle = async () => {
    // Linking.createURL üretilen URI:
    // Expo Go'da  → exp://IP:PORT/--/auth/callback  (Expo Go'da kayıtlı scheme)
    // Dev build'de → dental-ai://auth/callback
    const redirectUri = Linking.createURL('auth/callback');

    console.log('[Google Login] Redirect URI:', redirectUri);

    // Android Chrome Custom Tab'ı önceden ısıt — sonraki açılışlarda donmayı önler
    try { await WebBrowser.warmUpAsync(); } catch {}

    const cognitoUrl =
      'https://dental-ai-app.auth.eu-north-1.amazoncognito.com/oauth2/authorize' +
      '?identity_provider=Google' +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      '&response_type=code' +
      '&client_id=37q6ca4cj7s4mjk16r8dgq57u4' +
      '&scope=email%20openid%20profile';

    let result: WebBrowser.WebBrowserAuthSessionResult;
    try {
      result = await WebBrowser.openAuthSessionAsync(cognitoUrl, redirectUri, {
        showInRecents: false,
      });
    } finally {
      // Her durumda Custom Tab bağlantısını serbest bırak — sonraki çağrı donmasın
      try { await WebBrowser.coolDownAsync(); } catch {}
    }

    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      throw new Error('Google ile giriş iptal edildi veya başarısız oldu');
    }

    const match = result.url.match(/[?&]code=([^&]+)/);
    const code = match ? decodeURIComponent(match[1]) : null;
    if (!code) throw new Error('Yetki kodu alınamadı');

    let resData: any;
    try {
      const response = await apiClient.post('/api/cognito-callback', {
        code,
        redirect_uri: redirectUri,
      });
      resData = response.data;
    } catch (apiErr: any) {
      // Backend hatası — auth/callback ekranındaysak login'e geri dön
      router.replace('/(auth)/login');
      throw apiErr;
    }

    const accessToken = resData.access_token || resData.token;
    await AsyncStorage.setItem(config.tokenKey, accessToken);
    if (resData.id_token) await AsyncStorage.setItem(config.idTokenKey, resData.id_token);
    if (resData.refresh_token) await AsyncStorage.setItem(config.refreshTokenKey, resData.refresh_token);
    await AsyncStorage.setItem(config.userKey, JSON.stringify(resData.user));

    // YENİ kullanıcıysa profil tamamlama ekranına yönlendir (henüz setUser çağrılmıyor)
    if (resData.is_new_user) {
      setTimeout(() => router.replace('/(auth)/complete-profile'), 350);
      return;
    }

    setToken(accessToken);
    setUser(resData.user);

    // Browser kapanma animasyonu bitmeden router.replace çağrılırsa
    // Android'de siyah ekran oluşuyor — kısa gecikme ile önle
    const role: UserRole = resData.user?.role;
    setTimeout(() => {
      if (role === 'admin') router.replace('/(admin)');
      else if (role === 'doctor') router.replace('/(doctor)');
      else router.replace('/(patient)');
    }, 350);
  };

  const completeGoogleProfile = async (
    role: string,
    password?: string,
    inviteCode?: string,
    specialization?: string
  ) => {
    const response = await apiClient.post('/api/complete-google-profile', {
      role,
      password: password || undefined,
      invite_code: inviteCode || undefined,
      specialization: specialization || undefined,
    });
    const userData = response.data.user;
    await AsyncStorage.setItem(config.userKey, JSON.stringify(userData));
    const savedToken = await AsyncStorage.getItem(config.tokenKey);
    setToken(savedToken);
    setUser(userData);
    setTimeout(() => {
      if (userData.role === 'admin') router.replace('/(admin)');
      else if (userData.role === 'doctor') router.replace('/(doctor)');
      else router.replace('/(patient)');
    }, 350);
  };

  const register = async (data: RegisterData) => {
    const response = await apiClient.post('/api/register', data);
    return { requiresVerification: response.data.requires_verification ?? true };
  };

  const confirmEmail = async (email: string, code: string) => {
    await apiClient.post('/api/confirm-email', { email, code });
    // Backend doğrulama sonrası token dönmüyor, kullanıcı login'e yönlendiriliyor
    router.replace('/(auth)/login');
  };

  const logout = async () => {
    await AsyncStorage.removeItem(config.tokenKey);
    await AsyncStorage.removeItem(config.refreshTokenKey);
    await AsyncStorage.removeItem(config.idTokenKey);
    await AsyncStorage.removeItem(config.userKey);
    setUser(null);
    setToken(null);
    router.replace('/(auth)/login');
  };

  const updateUser = async (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    if (!user) throw new Error('Oturum açık değil');
    const response = await apiClient.put(`/api/users/${user.email}`, data);
    const updated = { ...user, ...data };
    await AsyncStorage.setItem(config.userKey, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, completeGoogleProfile, register, confirmEmail, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
