import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from 'expo-router';
import apiClient from '../../src/api/client';

interface Appointment {
  id: string;
  doctor_name: string;
  doctor_email: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  patient_note?: string;
  doctor_note?: string;
  created_at: string;
}

const STATUS_MAP = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  confirmed: { label: 'Onaylandı', color: 'bg-green-100 text-green-700', icon: '✅' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700', icon: '❌' },
};

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function friendlyDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PatientAppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/appointments/mine');
      setAppointments(res.data.appointments || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && a.date >= new Date().toISOString().slice(0, 10));
  const past = appointments.filter((a) => a.status === 'cancelled' || a.date < new Date().toISOString().slice(0, 10));

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-lg font-bold text-slate-900">Randevularım</Text>
        <Text className="text-xs text-slate-400">{upcoming.length} aktif randevu</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
      >
        {appointments.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-slate-600 font-semibold text-base">Randevunuz yok</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">
              Doktorunuzdan gelen geri bildirimlere tıklayarak randevu alabilirsiniz.
            </Text>
          </View>
        )}

        {upcoming.length > 0 && (
          <>
            <Text className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Yaklaşan</Text>
            {upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text className="text-sm font-bold text-slate-400 mb-3 mt-4 uppercase tracking-wide">Geçmiş / İptal</Text>
            {past.map((a) => <AppointmentCard key={a.id} appointment={a} faded />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCard({ appointment: a, faded }: { appointment: Appointment; faded?: boolean }) {
  const st = STATUS_MAP[a.status] || STATUS_MAP.pending;
  return (
    <View className={`bg-white rounded-2xl p-4 border border-slate-100 mb-3 ${faded ? 'opacity-60' : ''}`}>
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-cyan-100 items-center justify-center">
            <Text className="text-cyan-600 font-bold text-lg">
              {(a.doctor_name || 'D').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="font-bold text-slate-900 text-sm">Dr. {a.doctor_name}</Text>
            <Text className="text-slate-400 text-xs">{a.doctor_email}</Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${st.color.split(' ')[0]}`}>
          <Text className={`text-xs font-semibold ${st.color.split(' ')[1]}`}>
            {st.icon} {st.label}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 bg-slate-50 rounded-xl p-3">
        <View className="flex-1">
          <Text className="text-slate-400 text-xs mb-0.5">Tarih</Text>
          <Text className="text-slate-800 text-sm font-semibold">{friendlyDate(a.date)}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-slate-400 text-xs mb-0.5">Saat</Text>
          <Text className="text-slate-800 text-sm font-semibold">{a.time_slot}</Text>
        </View>
      </View>

      {a.doctor_note ? (
        <View className="mt-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <Text className="text-green-700 text-xs font-medium mb-0.5">Doktor Notu</Text>
          <Text className="text-slate-700 text-xs">{a.doctor_note}</Text>
        </View>
      ) : null}
    </View>
  );
}
