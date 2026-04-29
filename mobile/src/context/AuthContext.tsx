import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import apiClient from '../api/client';
import { config } from '../config';

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
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, confirmEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
