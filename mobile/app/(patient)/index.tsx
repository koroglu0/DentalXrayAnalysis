import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

interface Organization { id: string; name: string; type: string; }
interface Doctor { email: string; name: string; specialization?: string; }

export default function PatientHomeScreen() {
  const { user, logout } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<'org' | 'doctor' | 'file' | 'done'>('org');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useFocusEffect(useCallback(() => {
    apiClient.get('/api/feedbacks/unread-count')
      .then((res) => setUnreadCount(res.data.unread_count || 0))
      .catch(() => {});
  }, []));

  const fetchOrganizations = async () => {
    try {
      const res = await apiClient.get('/api/organizations');
      setOrganizations(res.data.organizations || res.data || []);
    } catch {
      Alert.alert('Hata', 'Klinikler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (orgId: string) => {
    try {
      const res = await apiClient.get(`/api/organizations/${orgId}/members`);
      setDoctors(res.data.members || res.data || []);
    } catch {
      setDoctors([]);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin verin');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleSend = async () => {
    if (!selectedOrg || !selectedDoctor || !selectedFile) {
      Alert.alert('Eksik Bilgi', 'Klinik, doktor ve röntgen seçin');
      return;
    }
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'image/jpeg',
        name: selectedFile.fileName || 'xray.jpg',
      } as any);
      formData.append('organization_id', selectedOrg.id);
      formData.append('doctor_email', selectedDoctor.email);
      formData.append('patient_note', note);
      formData.append('status', 'pending');

      await apiClient.post('/api/patient/send-xray', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStep('done');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Gönderilemedi');
    } finally {
      setIsSending(false);
    }
  };

  const reset = () => {
    setStep('org');
    setSelectedOrg(null);
    setSelectedDoctor(null);
    setSelectedFile(null);
    setNote('');
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  if (step === 'done') {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-6xl mb-6">✅</Text>
        <Text className="text-2xl font-bold text-slate-900 mb-2 text-center">Röntgen Gönderildi!</Text>
        <Text className="text-slate-500 text-sm text-center mb-8">
          Doktorunuz röntgeninizi inceleyip sonuçları paylaşacak.
        </Text>
        <TouchableOpacity onPress={reset} className="bg-cyan-500 rounded-2xl px-8 py-4">
          <Text className="text-white font-bold">Yeni Röntgen Gönder</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Merhaba, {user?.name?.split(' ')[0]} 👋</Text>
            <Text className="text-slate-500 text-sm">Röntgeninizi doktorunuza gönderin</Text>
          </View>
          <TouchableOpacity onPress={logout} className="bg-white rounded-xl px-3 py-2 border border-slate-200">
            <Text className="text-slate-600 text-sm">Çıkış</Text>
          </TouchableOpacity>
        </View>

        {/* Bildirim Banner */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/(patient)/notifications')}
            className="bg-cyan-500 rounded-2xl p-4 flex-row items-center justify-between mb-5"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                <Text className="text-xl">🔔</Text>
              </View>
              <View>
                <Text className="text-white font-bold text-sm">
                  {unreadCount} yeni doktor geri bildirimi
                </Text>
                <Text className="text-white/80 text-xs">Randevu almak için tıklayın</Text>
              </View>
            </View>
            <Text className="text-white text-lg">›</Text>
          </TouchableOpacity>
        )}

        {/* Adım 1: Klinik Seçimi */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className={`w-6 h-6 rounded-full items-center justify-center ${selectedOrg ? 'bg-green-500' : 'bg-cyan-500'}`}>
              <Text className="text-white text-xs font-bold">1</Text>
            </View>
            <Text className="font-semibold text-slate-900">Klinik Seç</Text>
          </View>
          <View className="gap-2">
            {organizations.map((org) => (
              <TouchableOpacity
                key={org.id}
                onPress={() => {
                  setSelectedOrg(org);
                  setSelectedDoctor(null);
                  fetchDoctors(org.id);
                  setStep('doctor');
                }}
                className={`p-3.5 rounded-xl border-2 flex-row items-center justify-between ${
                  selectedOrg?.id === org.id ? 'border-cyan-500 bg-cyan-50' : 'border-slate-100 bg-slate-50'
                }`}
              >
                <View>
                  <Text className={`font-semibold text-sm ${selectedOrg?.id === org.id ? 'text-cyan-700' : 'text-slate-800'}`}>{org.name}</Text>
                  <Text className="text-slate-400 text-xs capitalize">{org.type}</Text>
                </View>
                {selectedOrg?.id === org.id && <Text className="text-cyan-500">✓</Text>}
              </TouchableOpacity>
            ))}
            {organizations.length === 0 && (
              <Text className="text-slate-400 text-sm text-center py-3">Kayıtlı klinik bulunamadı</Text>
            )}
          </View>
        </View>

        {/* Adım 2: Doktor Seçimi */}
        {selectedOrg && (
          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <View className={`w-6 h-6 rounded-full items-center justify-center ${selectedDoctor ? 'bg-green-500' : 'bg-cyan-500'}`}>
                <Text className="text-white text-xs font-bold">2</Text>
              </View>
              <Text className="font-semibold text-slate-900">Doktor Seç</Text>
            </View>
            <View className="gap-2">
              {doctors.map((doc) => (
                <TouchableOpacity
                  key={doc.email}
                  onPress={() => { setSelectedDoctor(doc); setStep('file'); }}
                  className={`p-3.5 rounded-xl border-2 flex-row items-center justify-between ${
                    selectedDoctor?.email === doc.email ? 'border-cyan-500 bg-cyan-50' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <View>
                    <Text className={`font-semibold text-sm ${selectedDoctor?.email === doc.email ? 'text-cyan-700' : 'text-slate-800'}`}>
                      Dr. {doc.name}
                    </Text>
                    {doc.specialization && (
                      <Text className="text-slate-400 text-xs">{doc.specialization}</Text>
                    )}
                  </View>
                  {selectedDoctor?.email === doc.email && <Text className="text-cyan-500">✓</Text>}
                </TouchableOpacity>
              ))}
              {doctors.length === 0 && (
                <Text className="text-slate-400 text-sm text-center py-3">Bu klinikte doktor bulunamadı</Text>
              )}
            </View>
          </View>
        )}

        {/* Adım 3: Röntgen Seçimi */}
        {selectedDoctor && (
          <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
            <View className="flex-row items-center gap-2 mb-3">
              <View className={`w-6 h-6 rounded-full items-center justify-center ${selectedFile ? 'bg-green-500' : 'bg-cyan-500'}`}>
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
              <Text className="font-semibold text-slate-900">Röntgen Yükle</Text>
            </View>

            {selectedFile ? (
              <View>
                <Image source={{ uri: selectedFile.uri }} className="w-full h-40 rounded-xl mb-3" resizeMode="cover" />
                <TouchableOpacity onPress={pickImage} className="border border-dashed border-slate-300 rounded-xl py-3 items-center">
                  <Text className="text-slate-500 text-sm">Değiştir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                className="border-2 border-dashed border-cyan-300 rounded-xl py-10 items-center bg-cyan-50/50"
              >
                <Text className="text-4xl mb-2">📁</Text>
                <Text className="text-cyan-600 font-semibold text-sm">Galeriden Seç</Text>
                <Text className="text-slate-400 text-xs mt-1">JPG, PNG desteklenir</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Gönder butonu */}
        {selectedFile && (
          <TouchableOpacity
            onPress={handleSend}
            disabled={isSending}
            className="bg-cyan-500 rounded-2xl py-4 items-center mb-6"
          >
            {isSending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Röntgeni Gönder →</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
