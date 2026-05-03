import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Badge } from '../../components/ui/Badge';

export default function PatientProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ad Soyad boş bırakılamaz');
      return;
    }
    setSaving(true);
    try {
      await updateUser({ name: name.trim(), phone: phone.trim() || undefined });
      setShowModal(false);
      Alert.alert('Başarılı', 'Profil bilgilerin güncellendi');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-6">Profilim</Text>

        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-cyan-100 items-center justify-center mb-3">
            <Text className="text-cyan-600 font-bold text-3xl">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-900">{user?.name}</Text>
          <Text className="text-slate-500 text-sm">{user?.email}</Text>
          <View className="mt-2">
            <Badge label="HASTA" variant="patient" />
          </View>
        </View>

        {/* Bilgiler */}
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
          {[
            { label: 'Ad Soyad', value: user?.name },
            { label: 'E-posta', value: user?.email },
            { label: 'Telefon', value: user?.phone || '—' },
          ].map((item, i) => (
            <View key={i} className={`px-4 py-3.5 ${i < 2 ? 'border-b border-slate-100' : ''}`}>
              <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
              <Text className="text-slate-900 text-sm font-medium">{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Güncelle butonu */}
        <TouchableOpacity
          onPress={() => {
            setName(user?.name || '');
            setPhone(user?.phone || '');
            setShowModal(true);
          }}
          className="bg-cyan-500 rounded-2xl py-4 items-center mb-3"
        >
          <Text className="text-white font-semibold">Profil Bilgilerimi Güncelle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
        >
          <Text className="text-red-600 font-semibold">Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Güncelleme Modalı */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          className="flex-1 bg-white"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text className="text-slate-500 text-sm">İptal</Text>
              </TouchableOpacity>
              <Text className="font-bold text-slate-900">Profili Düzenle</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#06b6d4" />
                ) : (
                  <Text className="text-cyan-500 font-bold text-sm">Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Ad Soyad */}
              <Text className="text-slate-500 text-xs font-semibold uppercase mb-1">Ad Soyad</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-4"
                value={name}
                onChangeText={setName}
                placeholder="Adınızı girin"
                placeholderTextColor="#94a3b8"
              />

              {/* Telefon */}
              <Text className="text-slate-500 text-xs font-semibold uppercase mb-1">Telefon</Text>
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-4"
                value={phone}
                onChangeText={setPhone}
                placeholder="+90 5xx xxx xx xx"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
              />

              {/* E-posta (salt okunur) */}
              <Text className="text-slate-500 text-xs font-semibold uppercase mb-1">E-posta</Text>
              <View className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 mb-1">
                <Text className="text-slate-400 text-sm">{user?.email}</Text>
              </View>
              <Text className="text-slate-400 text-xs mb-4">E-posta adresi değiştirilemez</Text>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
