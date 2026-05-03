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
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('E-posta adresi gereklidir');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/forgot-password', { email: email.trim() });
      setStep('reset');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Kod gönderilemedi. E-postanızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError('Tüm alanları doldurunuz');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/api/reset-password', {
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      });
      Alert.alert(
        'Başarılı',
        'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.',
        [{ text: 'Giriş Yap', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Şifre sıfırlanamadı. Kodu kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar style="light" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="h-44 bg-[#0a0f14] items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full border border-cyan-500/40 items-center justify-center bg-cyan-900/20 mb-2">
            <Text className="text-3xl">🔑</Text>
          </View>
          <Text className="text-cyan-400 text-xs font-semibold tracking-widest mt-1">
            ŞİFRE SIFIRLAMA
          </Text>
        </View>

        <View className="flex-1 bg-white rounded-t-3xl -mt-4 px-6 pt-8 pb-12">
          {/* Logo */}
          <View className="flex-row items-center gap-2 mb-6">
            <View className="w-9 h-9 bg-cyan-500 rounded-lg items-center justify-center">
              <Text className="text-white text-lg font-bold">D</Text>
            </View>
            <Text className="text-xl font-bold text-slate-900">DentalAI</Text>
          </View>

          {step === 'email' ? (
            <>
              <Text className="text-3xl font-bold text-slate-900 mb-1">Şifremi Unuttum</Text>
              <Text className="text-slate-500 text-sm mb-8">
                Kayıtlı e-posta adresinizi girin. Şifre sıfırlama kodu göndereceğiz.
              </Text>

              <Text className="text-sm font-medium text-slate-700 mb-2">E-posta Adresi</Text>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-6"
                placeholder="ornek@dentalai.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-red-600 text-sm">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSendCode}
                disabled={loading}
                className="bg-cyan-500 rounded-2xl py-4 items-center mb-4"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Kod Gönder</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-3xl font-bold text-slate-900 mb-1">Yeni Şifre Belirle</Text>
              <Text className="text-slate-500 text-sm mb-1">
                <Text className="font-semibold text-slate-700">{email}</Text> adresine gönderilen
                kodu ve yeni şifrenizi girin.
              </Text>
              <TouchableOpacity onPress={() => { setStep('email'); setError(''); }} className="mb-6">
                <Text className="text-cyan-500 text-sm font-medium">E-postayı değiştir →</Text>
              </TouchableOpacity>

              <Text className="text-sm font-medium text-slate-700 mb-2">Doğrulama Kodu</Text>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-5"
                placeholder="123456"
                placeholderTextColor="#94a3b8"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={10}
              />

              <Text className="text-sm font-medium text-slate-700 mb-2">Yeni Şifre</Text>
              <View className="flex-row items-center border border-slate-200 bg-slate-50 rounded-xl px-4 mb-5">
                <TextInput
                  className="flex-1 py-3.5 text-slate-900 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                  <Text className="text-slate-400 text-sm">{showPassword ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-sm font-medium text-slate-700 mb-2">Şifre Tekrar</Text>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-6"
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-red-600 text-sm">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={loading}
                className="bg-cyan-500 rounded-2xl py-4 items-center mb-4"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Şifremi Güncelle</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Geri dön */}
          <TouchableOpacity onPress={() => router.back()} className="items-center">
            <Text className="text-slate-500 text-sm">
              ← <Text className="text-cyan-500 font-semibold">Girişe Dön</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
