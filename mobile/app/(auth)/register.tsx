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

type Step = 'register' | 'verify';

export default function RegisterScreen() {
  const { register, confirmEmail } = useAuth();
  const [step, setStep] = useState<Step>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient' as 'patient' | 'doctor',
    phone: '',
    specialization: '',
    inviteCode: '',
    verificationCode: '',
  });

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Ad, e-posta ve şifre zorunludur');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await register({
        name: formData.name,
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        specialization: formData.specialization || undefined,
        invite_code: formData.inviteCode || undefined,
      });
      if (result.requiresVerification) {
        setStep('verify');
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      const errMsg: string = err?.response?.data?.error || '';
      // Cognito'da kayıt tamamlandı ama doğrulama ekranı açılmadıysa
      if (errMsg.toLowerCase().includes('zaten kayıtlı') || errMsg.toLowerCase().includes('already')) {
        setError('Bu e-posta zaten kayıtlı. E-postanıza gönderilen doğrulama kodunu girin.');
        setStep('verify');
      } else {
        setError(errMsg || 'Kayıt başarısız. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!formData.verificationCode) {
      setError('Doğrulama kodu gereklidir');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await confirmEmail(formData.email.trim(), formData.verificationCode);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        {/* Logo */}
        <View className="flex-row items-center gap-2 mb-8">
          <View className="w-9 h-9 bg-cyan-500 rounded-lg items-center justify-center">
            <Text className="text-white text-lg font-bold">D</Text>
          </View>
          <Text className="text-xl font-bold text-slate-900">DentalAI</Text>
        </View>

        {step === 'register' ? (
          <>
            <Text className="text-3xl font-bold text-slate-900 mb-1">Hesap Oluştur</Text>
            <Text className="text-slate-500 text-sm mb-8">
              Bilgilerinizi girerek ücretsiz hesap oluşturun.
            </Text>

            {/* Ad Soyad */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Ad Soyad</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
              placeholder="Adınız Soyadınız"
              placeholderTextColor="#94a3b8"
              value={formData.name}
              onChangeText={(v) => update('name', v)}
            />

            {/* Email */}
            <Text className="text-sm font-medium text-slate-700 mb-2">E-posta</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
              placeholder="ornek@dentalai.com"
              placeholderTextColor="#94a3b8"
              value={formData.email}
              onChangeText={(v) => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Şifre */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Şifre</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
              placeholder="En az 8 karakter"
              placeholderTextColor="#94a3b8"
              value={formData.password}
              onChangeText={(v) => update('password', v)}
              secureTextEntry
            />

            {/* Şifre Tekrar */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Şifre Tekrar</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
              placeholder="Şifreyi tekrar girin"
              placeholderTextColor="#94a3b8"
              value={formData.confirmPassword}
              onChangeText={(v) => update('confirmPassword', v)}
              secureTextEntry
            />

            {/* Rol Seçimi */}
            <Text className="text-sm font-medium text-slate-700 mb-3">Hesap Türü</Text>
            <View className="flex-row gap-3 mb-4">
              {(['patient', 'doctor'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => update('role', role)}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    formData.role === role
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <Text className={`font-semibold text-sm ${formData.role === role ? 'text-cyan-600' : 'text-slate-500'}`}>
                    {role === 'patient' ? '🏥 Hasta' : '👨‍⚕️ Doktor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Doktora özel alanlar */}
            {formData.role === 'doctor' && (
              <>
                <Text className="text-sm font-medium text-slate-700 mb-2">Uzmanlık</Text>
                <TextInput
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
                  placeholder="Diş Hekimi, Ortodonti..."
                  placeholderTextColor="#94a3b8"
                  value={formData.specialization}
                  onChangeText={(v) => update('specialization', v)}
                />
                <Text className="text-sm font-medium text-slate-700 mb-2">Davet Kodu (opsiyonel)</Text>
                <TextInput
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-4"
                  placeholder="Organizasyon davet kodu"
                  placeholderTextColor="#94a3b8"
                  value={formData.inviteCode}
                  onChangeText={(v) => update('inviteCode', v)}
                  autoCapitalize="none"
                />
              </>
            )}

            {/* Telefon */}
            <Text className="text-sm font-medium text-slate-700 mb-2">Telefon (opsiyonel)</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-6"
              placeholder="+90 5xx xxx xx xx"
              placeholderTextColor="#94a3b8"
              value={formData.phone}
              onChangeText={(v) => update('phone', v)}
              keyboardType="phone-pad"
            />

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="bg-cyan-500 rounded-2xl py-4 items-center mb-4"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Kayıt Ol</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-slate-500 text-sm">Zaten hesabınız var mı? </Text>
              <Link href="/(auth)/login">
                <Text className="text-cyan-500 font-semibold text-sm">Giriş Yapın</Text>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text className="text-3xl font-bold text-slate-900 mb-2">E-posta Doğrulama</Text>
            <Text className="text-slate-500 text-sm mb-2">
              <Text className="font-semibold text-slate-700">{formData.email}</Text> adresine gönderilen 6 haneli kodu girin.
            </Text>

            <View className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-8">
              <Text className="text-cyan-700 text-sm">📧 Gelen kutunuzu ve spam klasörünü kontrol edin.</Text>
            </View>

            <Text className="text-sm font-medium text-slate-700 mb-2">Doğrulama Kodu</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base text-center tracking-widest mb-6"
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              value={formData.verificationCode}
              onChangeText={(v) => update('verificationCode', v)}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={handleVerify}
              disabled={loading}
              className="bg-cyan-500 rounded-2xl py-4 items-center mb-4"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Doğrula</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('register')} className="items-center mb-3">
              <Text className="text-slate-500 text-sm">← Geri Dön</Text>
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-slate-500 text-sm">Doğruladıktan sonra </Text>
              <Link href="/(auth)/login">
                <Text className="text-cyan-500 font-semibold text-sm">Giriş Yapın</Text>
              </Link>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
