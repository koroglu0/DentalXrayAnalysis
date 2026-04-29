import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, Modal, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';

interface Organization {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  member_count?: number;
  invite_code?: string;
}

export default function AdminOrganizationsScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', type: 'clinic', address: '', phone: '' });

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/organizations');
      setOrganizations(res.data.organizations || res.data || []);
    } catch {
      Alert.alert('Hata', 'Organizasyonlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleCreate = async () => {
    if (!newOrg.name) {
      Alert.alert('Eksik', 'Organizasyon adı zorunludur');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/organizations', newOrg);
      setShowCreateModal(false);
      setNewOrg({ name: '', type: 'clinic', address: '', phone: '' });
      fetchOrgs();
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (org: Organization) => {
    Alert.alert(
      'Organizasyonu Sil',
      `"${org.name}" silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/organizations/${org.id}`);
              fetchOrgs();
            } catch {
              Alert.alert('Hata', 'Silinemedi');
            }
          },
        },
      ]
    );
  };

  const loadInviteCode = async (org: Organization) => {
    setLoadingInvite(true);
    try {
      const res = await apiClient.get(`/api/organizations/${org.id}/invite-code`);
      setSelectedOrg({ ...org, invite_code: res.data.invite_code });
    } catch {
      Alert.alert('Hata', 'Davet kodu alınamadı');
    } finally {
      setLoadingInvite(false);
    }
  };

  const regenerateInviteCode = async () => {
    if (!selectedOrg) return;
    setLoadingInvite(true);
    try {
      const res = await apiClient.post(`/api/organizations/${selectedOrg.id}/invite-code/regenerate`);
      setSelectedOrg((p) => p ? { ...p, invite_code: res.data.invite_code } : p);
    } catch {
      Alert.alert('Hata', 'Yenilenemedi');
    } finally {
      setLoadingInvite(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Organizasyonlar</Text>
          <Text className="text-xs text-slate-500">Klinik ve hastane yönetimi</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-cyan-500 px-3 py-1.5 rounded-lg"
        >
          <Text className="text-white text-xs font-semibold">+ Yeni</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-1">Organizasyonlar</Text>
        <Text className="text-slate-500 text-sm mb-5">
          {organizations.length} organizasyon kayıtlı
        </Text>

        {organizations.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">🏢</Text>
            <Text className="text-slate-400 text-sm text-center">Henüz organizasyon yok</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="mt-4 bg-cyan-500 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">İlk Organizasyonu Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          organizations.map((org) => (
            <View key={org.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center">
                    <Text className="text-xl">{org.type === 'hospital' ? '🏥' : '🏢'}</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-slate-900 text-sm">{org.name}</Text>
                    <Text className="text-slate-400 text-xs capitalize">{org.type}</Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => { setSelectedOrg(org); loadInviteCode(org); setShowDetailModal(true); }}
                    className="p-2 bg-blue-50 rounded-lg"
                  >
                    <Text className="text-base">🔑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(org)} className="p-2 bg-red-50 rounded-lg">
                    <Text className="text-base">🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {org.address && (
                <View className="flex-row items-center gap-1 mb-1">
                  <Text className="text-slate-400 text-xs">📍 {org.address}</Text>
                </View>
              )}
              {org.phone && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-slate-400 text-xs">📞 {org.phone}</Text>
                </View>
              )}
              {org.member_count !== undefined && (
                <Text className="text-slate-400 text-xs mt-1">👥 {org.member_count} üye</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Yeni Organizasyon Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-slate-600">İptal</Text>
            </TouchableOpacity>
            <Text className="font-bold text-slate-900">Yeni Organizasyon</Text>
            <TouchableOpacity onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#13a4ec" /> : <Text className="text-cyan-500 font-bold">Oluştur</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="text-sm font-medium text-slate-700 mb-2">Organizasyon Adı</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 mb-4"
              placeholder="Klinik / Hastane adı"
              placeholderTextColor="#94a3b8"
              value={newOrg.name}
              onChangeText={(v) => setNewOrg((p) => ({ ...p, name: v }))}
            />

            <Text className="text-sm font-medium text-slate-700 mb-3">Tür</Text>
            <View className="flex-row gap-3 mb-4">
              {(['clinic', 'hospital'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewOrg((p) => ({ ...p, type: t }))}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${newOrg.type === t ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`}
                >
                  <Text className="text-lg mb-1">{t === 'clinic' ? '🏢' : '🏥'}</Text>
                  <Text className={`text-xs font-semibold ${newOrg.type === t ? 'text-cyan-600' : 'text-slate-500'}`}>
                    {t === 'clinic' ? 'Klinik' : 'Hastane'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-slate-700 mb-2">Adres</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 mb-4"
              placeholder="Sokak, İlçe, Şehir"
              placeholderTextColor="#94a3b8"
              value={newOrg.address}
              onChangeText={(v) => setNewOrg((p) => ({ ...p, address: v }))}
            />

            <Text className="text-sm font-medium text-slate-700 mb-2">Telefon</Text>
            <TextInput
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
              placeholder="+90 xxx xxx xx xx"
              placeholderTextColor="#94a3b8"
              value={newOrg.phone}
              onChangeText={(v) => setNewOrg((p) => ({ ...p, phone: v }))}
              keyboardType="phone-pad"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Davet Kodu / Detay Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Text className="text-slate-600">Kapat</Text>
            </TouchableOpacity>
            <Text className="font-bold text-slate-900">Organizasyon Detayı</Text>
            <View className="w-12" />
          </View>
          {selectedOrg && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View className="items-center mb-6">
                <View className="w-16 h-16 bg-orange-50 rounded-2xl items-center justify-center mb-3">
                  <Text className="text-4xl">{selectedOrg.type === 'hospital' ? '🏥' : '🏢'}</Text>
                </View>
                <Text className="text-xl font-bold text-slate-900">{selectedOrg.name}</Text>
                <Text className="text-slate-400 text-sm capitalize">{selectedOrg.type}</Text>
              </View>

              {/* Davet Kodu */}
              <View className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
                <Text className="text-sm font-semibold text-slate-700 mb-2">Davet Kodu</Text>
                {loadingInvite ? (
                  <ActivityIndicator color="#13a4ec" />
                ) : (
                  <View>
                    <View className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-3">
                      <Text className="text-cyan-600 font-mono font-bold text-lg text-center tracking-widest">
                        {selectedOrg.invite_code || '—'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={regenerateInviteCode}
                      className="border border-slate-300 rounded-xl py-3 items-center"
                    >
                      <Text className="text-slate-600 text-sm font-medium">🔄 Kodu Yenile</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3">
                <Text className="text-cyan-700 text-xs">
                  💡 Bu kodu doktorlarla paylaşın. Kayıt sırasında bu kodu girerek organizasyonunuza katılabilirler.
                </Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
