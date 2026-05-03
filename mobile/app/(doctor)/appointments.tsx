import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import apiClient from '../../src/api/client';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  patient_note?: string;
  doctor_note?: string;
  created_at: string;
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function friendlyDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]}`;
}

const STATUS_MAP = {
  pending: { label: 'Bekliyor', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { label: 'Onaylandı', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'İptal', bg: 'bg-red-100', text: 'text-red-700' },
};

export default function DoctorAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [actionModal, setActionModal] = useState(false);
  const [doctorNote, setDoctorNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/appointments/doctor');
      setAppointments(res.data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleAction = (a: Appointment) => {
    setSelected(a);
    setDoctorNote('');
    setActionModal(true);
  };

  const updateStatus = async (status: 'confirmed' | 'cancelled') => {
    if (!selected) return;
    setUpdating(true);
    try {
      await apiClient.put(`/api/appointments/${selected.id}`, {
        status,
        doctor_note: doctorNote.trim() || null,
      });
      setActionModal(false);
      fetchData();
      Alert.alert('Güncellendi', status === 'confirmed' ? 'Randevu onaylandı.' : 'Randevu iptal edildi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Güncelleme başarısız');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayList = appointments.filter((a) => a.date === today);
  const upcoming = appointments.filter((a) => a.date > today && a.status !== 'cancelled');
  const past = appointments.filter((a) => a.date < today || a.status === 'cancelled');

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-lg font-bold text-slate-900">Randevular</Text>
        <Text className="text-xs text-slate-400">
          {todayList.length} bugün · {upcoming.length} yaklaşan
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        {appointments.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-slate-600 font-semibold">Henüz randevu yok</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">
              Hastalara geri bildirim gönderdiğinizde randevu talep edebilirler.
            </Text>
          </View>
        )}

        {todayList.length > 0 && (
          <>
            <Text className="text-sm font-bold text-cyan-600 mb-3 uppercase tracking-wide">📌 Bugün</Text>
            {todayList.map((a) => (
              <AppCard key={a.id} a={a} onAction={handleAction} />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text className="text-sm font-bold text-slate-700 mb-3 mt-2 uppercase tracking-wide">Yaklaşan</Text>
            {upcoming.map((a) => (
              <AppCard key={a.id} a={a} onAction={handleAction} />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text className="text-sm font-bold text-slate-400 mb-3 mt-4 uppercase tracking-wide">Geçmiş / İptal</Text>
            {past.map((a) => (
              <AppCard key={a.id} a={a} onAction={handleAction} faded />
            ))}
          </>
        )}
      </ScrollView>

      {/* Aksiyon modalı */}
      <Modal visible={actionModal} transparent animationType="slide" onRequestClose={() => setActionModal(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-5" />
            {selected && (
              <>
                <Text className="text-lg font-bold text-slate-900 mb-1">{selected.patient_name}</Text>
                <Text className="text-slate-400 text-sm mb-4">
                  {friendlyDate(selected.date)} · {selected.time_slot}
                </Text>

                {selected.patient_note ? (
                  <View className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-4">
                    <Text className="text-slate-400 text-xs mb-1">Hasta Notu</Text>
                    <Text className="text-slate-700 text-sm">{selected.patient_note}</Text>
                  </View>
                ) : null}

                <Text className="text-sm font-medium text-slate-700 mb-2">Doktor Notu (opsiyonel)</Text>
                <TextInput
                  value={doctorNote}
                  onChangeText={setDoctorNote}
                  placeholder="Hastaya iletmek istediğiniz not..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 mb-5"
                  style={{ minHeight: 70 }}
                />

                {selected.status === 'pending' && (
                  <>
                    <TouchableOpacity
                      onPress={() => updateStatus('confirmed')}
                      disabled={updating}
                      className="bg-green-500 rounded-xl py-3.5 items-center mb-3"
                    >
                      {updating ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">✅ Onayla</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateStatus('cancelled')}
                      disabled={updating}
                      className="bg-red-50 border border-red-200 rounded-xl py-3.5 items-center mb-3"
                    >
                      <Text className="text-red-600 font-semibold">❌ İptal Et</Text>
                    </TouchableOpacity>
                  </>
                )}

                {selected.status !== 'pending' && (
                  <TouchableOpacity
                    onPress={() => updateStatus('cancelled')}
                    disabled={updating || selected.status === 'cancelled'}
                    className="bg-red-50 border border-red-200 rounded-xl py-3.5 items-center mb-3"
                  >
                    <Text className="text-red-600 font-semibold">❌ İptal Et</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setActionModal(false)} className="bg-slate-100 rounded-xl py-3.5 items-center">
                  <Text className="text-slate-600 font-semibold">Kapat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AppCard({ a, onAction, faded }: { a: Appointment; onAction: (a: Appointment) => void; faded?: boolean }) {
  const st = STATUS_MAP[a.status] || STATUS_MAP.pending;
  return (
    <TouchableOpacity
      onPress={() => onAction(a)}
      className={`bg-white rounded-2xl p-4 border border-slate-100 mb-3 ${faded ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center">
            <Text className="text-slate-600 font-bold text-base">
              {(a.patient_name || 'H').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-slate-900 text-sm">{a.patient_name}</Text>
            <Text className="text-slate-400 text-xs">{a.patient_email}</Text>
          </View>
        </View>
        <View>
          <View className={`px-2.5 py-1 rounded-full ${st.bg} mb-1`}>
            <Text className={`text-xs font-semibold ${st.text}`}>{st.label}</Text>
          </View>
          <Text className="text-slate-500 text-xs text-right">{friendlyDate(a.date)} {a.time_slot}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
