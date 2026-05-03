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
import { useAuth } from '../../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';

type Role = 'patient' | 'doctor' | 'admin';

const ROLES: { key: Role; label: string; icon: string; desc: string }[] = [
  { key: 'patient', label: 'Hasta', icon: '🦷', desc: 'X-ray analizi yaptırın, geçmişinizi görün' },
  { key: 'doctor', label: 'Doktor', icon: '🩺', desc: 'Hasta analizi yapın, randevu yönetin' },
  { key: 'admin', label: 'Admin', icon: '🔑', desc: 'Sistem yönetimi (davet kodu gerekli)' },
];

export default function CompleteProfileScreen() {
  const { completeGoogleProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('patient');
  const [specialization, setSpecialization] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setError('');

    if (selectedRole === 'admin' && !inviteCode.trim()) {
      setError('Admin hesabı için davet kodu gereklidir');
      return;
    }

    if (password && password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (password && password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await completeGoogleProfile(
        selectedRole,
        password || undefined,
        inviteCode || undefined,
        selectedRole === 'doctor' ? specialization : undefined
      );
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Profil tamamlanamadı.';
      setError(msg);
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
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="bg-[#0a0f14] px-6 pt-14 pb-8">
          <View className="w-14 h-14 bg-cyan-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">D</Text>
          </View>
          <Text className="text-white text-2xl font-bold">Profilinizi Tamamlayın</Text>
          <Text className="text-slate-400 text-sm mt-1">
            Hesap türünüzü seçin ve isteğe bağlı şifre belirleyin.
          </Text>
        </View>

        <View className="px-6 pt-8 pb-10">
          {/* Rol seçimi */}
          <Text className="text-sm font-semibold text-slate-700 mb-3">Hesap Türü</Text>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setSelectedRole(r.key)}
              className={`flex-row items-center p-4 rounded-2xl border mb-3 ${
                selectedRole === r.key
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <Text className="text-2xl mr-3">{r.icon}</Text>
              <View className="flex-1">
                <Text className={`font-semibold text-base ${selectedRole === r.key ? 'text-cyan-700' : 'text-slate-800'}`}>
                  {r.label}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">{r.desc}</Text>
              </View>
              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                selectedRole === r.key ? 'border-cyan-500' : 'border-slate-300'
              }`}>
                {selectedRole === r.key && (
                  <View className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Doktor: uzmanlık alanı */}
          {selectedRole === 'doctor' && (
            <View className="mt-2 mb-2">
              <Text className="text-sm font-medium text-slate-700 mb-2">Uzmanlık Alanı</Text>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base"
                placeholder="Örn: Genel Diş Hekimliği, Ortodonti..."
                placeholderTextColor="#94a3b8"
                value={specialization}
                onChangeText={setSpecialization}
              />
            </View>
          )}

          {/* Admin: davet kodu */}
          {selectedRole === 'admin' && (
            <View className="mt-2 mb-2">
              <Text className="text-sm font-medium text-slate-700 mb-2">Admin Davet Kodu <Text className="text-red-500">*</Text></Text>
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base"
                placeholder="Davet kodunuzu girin"
                placeholderTextColor="#94a3b8"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
            </View>
          )}

          {/* Opsiyonel şifre */}
          <View className="mt-4">
            <Text className="text-sm font-semibold text-slate-700 mb-1">
              Şifre Belirle <Text className="text-slate-400 font-normal">(İsteğe bağlı)</Text>
            </Text>
            <Text className="text-xs text-slate-400 mb-3">
              E-posta ile de giriş yapmak istiyorsanız şifre belirleyebilirsiniz.
            </Text>
            <View className="flex-row items-center border border-slate-200 bg-slate-50 rounded-xl px-4 mb-3">
              <TextInput
                className="flex-1 py-3.5 text-slate-900 text-base"
                placeholder="En az 8 karakter"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                <Text className="text-slate-400 text-sm">{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {password.length > 0 && (
              <TextInput
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base mb-3"
                placeholder="Şifreyi tekrar girin"
                placeholderTextColor="#94a3b8"
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry={!showPassword}
              />
            )}
          </View>

          {/* Hata */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-600 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Tamamla butonu */}
          <TouchableOpacity
            onPress={handleComplete}
            disabled={loading}
            className="bg-cyan-500 rounded-2xl py-4 items-center mt-2 shadow-md"
            style={{ shadowColor: '#00bcd4', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Hesabı Oluştur</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
