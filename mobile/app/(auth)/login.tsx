import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('E-posta ve şifre gereklidir');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Google ile giriş başarısız oldu.';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar style="light" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="h-56 bg-[#0a0f14] items-center justify-center px-6">
          {/* Grid arka plan efekti */}
          <View className="absolute inset-0 opacity-20" />
          {/* Diş ikonu */}
          <View className="w-20 h-20 rounded-full border border-cyan-500/40 items-center justify-center bg-cyan-900/20 mb-3">
            <View className="w-10 h-10 bg-cyan-400 rounded-full opacity-80" />
          </View>
          {/* Analiz süresi badge */}
          <View className="flex-row items-center bg-[#1a2a3a] border border-cyan-500/30 rounded-full px-4 py-1.5 mb-3">
            <View className="w-2 h-2 rounded-full bg-cyan-400 mr-2" />
            <Text className="text-cyan-400 text-xs font-semibold tracking-widest">ANALİZ SÜRESİ</Text>
          </View>
          <Text className="text-white text-2xl font-bold text-center">
            Yapay Zeka Destekli
          </Text>
          <Text className="text-cyan-400 text-2xl font-bold text-center">Diş Teşhisi</Text>
        </View>

        {/* Form Section */}
        <View className="flex-1 bg-white rounded-t-3xl -mt-4 px-6 pt-8 pb-10">
          {/* Logo */}
          <View className="flex-row items-center gap-2 mb-6">
            <View className="w-9 h-9 bg-cyan-500 rounded-lg items-center justify-center">
              <Text className="text-white text-lg font-bold">D</Text>
            </View>
            <Text className="text-xl font-bold text-slate-900">DentalAI</Text>
          </View>

          <Text className="text-3xl font-bold text-slate-900 mb-1">Tekrar Hoşgeldiniz</Text>
          <Text className="text-slate-500 text-sm mb-8">
            Güvenli hesabınıza erişmek için bilgilerinizi girin.
          </Text>

          {/* Email */}
          <Text className="text-sm font-medium text-slate-700 mb-2">E-posta Adresi</Text>
          <TextInput
            className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-5"
            placeholder="ornek@dentalai.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Şifre */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-slate-700">Şifre</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text className="text-sm font-semibold text-cyan-500">Şifremi Unuttum?</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center border border-slate-200 bg-slate-50 rounded-xl px-4 mb-6">
            <TextInput
              className="flex-1 py-3.5 text-slate-900 text-base"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
              <Text className="text-slate-400 text-sm">{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          {/* Hata mesajı */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Giriş Yap butonu */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-cyan-500 rounded-2xl py-4 items-center mb-6 shadow-md"
            style={{ shadowColor: '#00bcd4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Giriş Yap</Text>
            )}
          </TouchableOpacity>

          {/* Ayraç */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-slate-200" />
            <Text className="mx-4 text-slate-400 text-xs font-medium">VEYA</Text>
            <View className="flex-1 h-px bg-slate-200" />
          </View>

          {/* Google ile Giriş */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex-row items-center justify-center border border-slate-200 rounded-2xl py-3.5 mb-6 bg-white"
            style={{ elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}
          >
            {googleLoading ? (
              <ActivityIndicator color="#64748b" size="small" />
            ) : (
              <>
                <Text className="text-lg mr-2">🔵</Text>
                <Text className="text-slate-700 font-semibold text-sm">Google ile Devam Et</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Kayıt Ol */}
          <View className="flex-row justify-center mb-8">
            <Text className="text-slate-500 text-sm">Hesabınız yok mu? </Text>
            <Link href="/(auth)/register">
              <Text className="text-cyan-500 font-semibold text-sm">Kayıt Olun</Text>
            </Link>
          </View>

          {/* Alt güvenlik notu */}
          <View className="flex-row items-center justify-center">
            <Text className="text-slate-400 text-xs">🔒 Güvenli & HIPAA Uyumlu</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
