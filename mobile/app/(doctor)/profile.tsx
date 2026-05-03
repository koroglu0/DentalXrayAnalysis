import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Badge } from '../../components/ui/Badge';

export default function DoctorProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Ad Soyad boş bırakılamaz.');
      return;
    }
    try {
      setSaving(true);
      await updateUser({ name: name.trim(), phone: phone.trim() });
      setShowModal(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch {
      Alert.alert('Hata', 'Güncelleme sırasında bir sorun oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setShowModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-6">Profilim</Text>

        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-sky-100 items-center justify-center mb-3">
            <Text className="text-sky-600 font-bold text-3xl">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-900">Dr. {user?.name}</Text>
          <Text className="text-slate-500 text-sm">{user?.email}</Text>
          <View className="mt-2">
            <Badge label="DOKTOR" variant="doctor" />
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-4">
          {[
            { label: 'Ad Soyad', value: user?.name },
            { label: 'E-posta', value: user?.email },
            { label: 'Uzmanlık', value: user?.specialization || '—' },
            { label: 'Telefon', value: user?.phone || '—' },
          ].map((item, i, arr) => (
            <View key={i} className={`px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
              <Text className="text-slate-900 text-sm font-medium">{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={openModal}
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
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-5" />
            <Text className="text-lg font-bold text-slate-900 mb-5">Profili Güncelle</Text>

            <Text className="text-slate-500 text-xs mb-1 font-medium">AD SOYAD</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ad Soyad"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-4"
            />

            <Text className="text-slate-500 text-xs mb-1 font-medium">TELEFON</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="05XX XXX XX XX"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-4"
            />

            <Text className="text-slate-400 text-xs mb-5">
              E-posta adresi değiştirilemez.
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-cyan-500 rounded-xl py-3.5 items-center mb-3"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Kaydet</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className="bg-slate-100 rounded-xl py-3.5 items-center"
            >
              <Text className="text-slate-600 font-semibold">İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
