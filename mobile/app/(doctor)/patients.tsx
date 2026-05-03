import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/client';

interface Patient {
  email: string;
  name: string;
  phone?: string;
  status?: string;
  organization_id?: string;
  created_at?: string;
}

export default function PatientsScreen() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filtered, setFiltered] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      if (user?.organization_id) {
        const res = await apiClient.get(`/api/organizations/${user.organization_id}/members`);
        const members: Patient[] = res.data.members || [];
        setPatients(members.filter((m) => m.role === 'patient' || !(m as any).role));
      } else {
        setPatients([]);
      }
    } catch {
      setPatients([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.organization_id]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        patients.filter(
          (p) =>
            p.name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q) ||
            p.phone?.includes(q),
        ),
      );
    }
  }, [search, patients]);

  const initials = (name: string) =>
    name
      ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
      : '?';

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
      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-lg font-bold text-slate-900">Hastalar</Text>
        <Text className="text-xs text-slate-400">{patients.length} hasta kayıtlı</Text>
      </View>

      <View className="px-4 pt-3 pb-1">
        {/* Arama */}
        <View className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex-row items-center gap-2 mb-1">
          <Text className="text-slate-400">🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="İsim, e-posta veya telefon ara..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-sm text-slate-800"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text className="text-slate-400 text-lg">×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPatients(); }}
          />
        }
      >
        {!user?.organization_id && (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">🏥</Text>
            <Text className="text-slate-600 font-semibold text-base">Organizasyona katılmadınız</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">
              Hasta listesini görüntülemek için bir organizasyona katılmanız gerekiyor.
            </Text>
          </View>
        )}

        {user?.organization_id && filtered.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">👥</Text>
            <Text className="text-slate-600 font-semibold text-base">
              {search ? 'Sonuç bulunamadı' : 'Henüz hasta yok'}
            </Text>
            <Text className="text-slate-400 text-sm mt-1">
              {search ? 'Farklı arama kriterleri deneyin' : 'Organizasyonunuza henüz hasta eklenmemiş'}
            </Text>
          </View>
        )}

        {filtered.map((patient) => (
          <TouchableOpacity
            key={patient.email}
            onPress={() => { setSelected(patient); setModalVisible(true); }}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3 flex-row items-center gap-3"
          >
            {/* Avatar */}
            <View className="w-12 h-12 rounded-full bg-cyan-100 items-center justify-center flex-shrink-0">
              <Text className="text-cyan-600 font-bold text-base">{initials(patient.name)}</Text>
            </View>

            {/* Bilgi */}
            <View className="flex-1">
              <Text className="font-semibold text-slate-900 text-sm" numberOfLines={1}>
                {patient.name || 'İsimsiz Hasta'}
              </Text>
              <Text className="text-slate-400 text-xs" numberOfLines={1}>{patient.email}</Text>
              {patient.phone && (
                <Text className="text-slate-500 text-xs mt-0.5">📞 {patient.phone}</Text>
              )}
            </View>

            {/* Durum */}
            <View>
              <View
                className={`px-2 py-0.5 rounded-full ${
                  patient.status === 'active' || !patient.status
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    patient.status === 'active' || !patient.status
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}
                >
                  {patient.status === 'inactive' ? 'Pasif' : 'Aktif'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detay Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-5" />

            {selected && (
              <>
                {/* Büyük Avatar */}
                <View className="w-20 h-20 rounded-full bg-cyan-100 items-center justify-center self-center mb-4">
                  <Text className="text-cyan-600 font-bold text-2xl">{initials(selected.name)}</Text>
                </View>

                <Text className="text-xl font-bold text-slate-900 text-center mb-1">
                  {selected.name || 'İsimsiz Hasta'}
                </Text>
                <Text className="text-slate-400 text-sm text-center mb-6">{selected.email}</Text>

                <View className="gap-3">
                  <View className="flex-row justify-between py-3 border-b border-slate-100">
                    <Text className="text-slate-500 text-sm">Telefon</Text>
                    <Text className="text-slate-900 text-sm font-medium">
                      {selected.phone || '—'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-100">
                    <Text className="text-slate-500 text-sm">Durum</Text>
                    <Text
                      className={`text-sm font-medium ${
                        selected.status === 'inactive' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {selected.status === 'inactive' ? 'Pasif' : 'Aktif'}
                    </Text>
                  </View>
                  {selected.created_at && (
                    <View className="flex-row justify-between py-3 border-b border-slate-100">
                      <Text className="text-slate-500 text-sm">Kayıt Tarihi</Text>
                      <Text className="text-slate-900 text-sm font-medium">
                        {selected.created_at.slice(0, 10)}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  className="mt-6 bg-slate-100 rounded-xl py-3 items-center"
                >
                  <Text className="text-slate-700 font-semibold">Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
