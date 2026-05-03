import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import apiClient from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';

// Gün isimleri
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function displayDate(d: Date) {
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Önümüzdeki 14 gün (hafta sonu hariç)
function getNextWeekdays(count = 10) {
  const days: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // yarından itibaren
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function FeedbackDetailScreen() {
  const { feedbackData } = useLocalSearchParams<{ feedbackData: string }>();
  const { user } = useAuth();
  const feedback = feedbackData ? JSON.parse(feedbackData) : null;

  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [patientNote, setPatientNote] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const weekdays = getNextWeekdays(10);

  const handleSelectDate = async (d: Date) => {
    setSelectedDate(d);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const res = await apiClient.get(
        `/api/appointments/slots?doctor_email=${encodeURIComponent(feedback.doctor_email)}&date=${formatDate(d)}`
      );
      setSlots(res.data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      Alert.alert('Eksik', 'Tarih ve saat seçin');
      return;
    }
    setBooking(true);
    try {
      await apiClient.post('/api/appointments', {
        doctor_email: feedback.doctor_email,
        doctor_name: feedback.doctor_name,
        organization_id: user?.organization_id || '',
        date: formatDate(selectedDate),
        time_slot: selectedSlot,
        feedback_id: feedback.id,
        patient_note: patientNote.trim(),
      });
      setShowBooking(false);
      Alert.alert(
        'Randevu Alındı! 🎉',
        `${displayDate(selectedDate)} saat ${selectedSlot} için randevunuz oluşturuldu. Doktorunuz onaylaması bekleniyor.`,
        [{ text: 'Tamam', onPress: () => router.push('/(patient)/appointments') }],
      );
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Randevu alınamadı');
    } finally {
      setBooking(false);
    }
  };

  if (!feedback) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-slate-400">Bildirim bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-slate-600 text-base">← Geri</Text>
        </TouchableOpacity>
        <Text className="font-bold text-slate-900">Doktor Geri Bildirimi</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {/* Doktor kartı */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-14 h-14 rounded-full bg-cyan-100 items-center justify-center">
              <Text className="text-cyan-600 font-bold text-xl">
                {(feedback.doctor_name || 'D').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text className="font-bold text-slate-900 text-base">Dr. {feedback.doctor_name}</Text>
              <Text className="text-slate-400 text-xs">{feedback.doctor_email}</Text>
              <Text className="text-slate-400 text-xs">{feedback.created_at?.slice(0, 10)}</Text>
            </View>
          </View>
          <View className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <Text className="text-slate-400 text-xs font-medium mb-2 uppercase">Doktor Mesajı</Text>
            <Text className="text-slate-800 text-sm leading-6">{feedback.message}</Text>
          </View>
        </View>

        {/* Randevu Al butonu */}
        <TouchableOpacity
          onPress={() => setShowBooking(true)}
          className="bg-cyan-500 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-bold text-base">📅 Randevu Al</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(patient)/appointments')}
          className="bg-white border border-slate-200 rounded-2xl py-4 items-center mt-3"
        >
          <Text className="text-slate-700 font-semibold">Randevularımı Görüntüle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Randevu Alma Modalı */}
      <Modal visible={showBooking} animationType="slide" onRequestClose={() => setShowBooking(false)}>
        <SafeAreaView className="flex-1 bg-slate-50">
          <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
            <Text className="font-bold text-slate-900 text-base">Randevu Seç</Text>
            <TouchableOpacity onPress={() => setShowBooking(false)}>
              <Text className="text-slate-400 text-2xl">×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text className="text-slate-700 font-semibold mb-1">Dr. {feedback.doctor_name}</Text>
            <Text className="text-slate-400 text-xs mb-5">Hafta sonları randevu alınamaz</Text>

            {/* Tarih seçimi */}
            <Text className="text-sm font-semibold text-slate-700 mb-3">1. Tarih Seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {weekdays.map((d) => {
                const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate);
                return (
                  <TouchableOpacity
                    key={formatDate(d)}
                    onPress={() => handleSelectDate(d)}
                    className={`mr-2 px-4 py-3 rounded-xl border-2 items-center min-w-[72px] ${
                      isSelected ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {TR_DAYS[d.getDay()].slice(0, 3)}
                    </Text>
                    <Text className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {d.getDate()}
                    </Text>
                    <Text className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {TR_MONTHS[d.getMonth()].slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Saat seçimi */}
            {selectedDate && (
              <>
                <Text className="text-sm font-semibold text-slate-700 mb-3">2. Saat Seç</Text>
                {loadingSlots ? (
                  <ActivityIndicator color="#13a4ec" className="my-4" />
                ) : slots.length === 0 ? (
                  <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                    <Text className="text-orange-700 text-sm text-center">
                      Bu gün için müsait saat bulunmuyor
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-2 mb-5">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => setSelectedSlot(slot)}
                          className={`px-5 py-3 rounded-xl border-2 ${
                            isSelected ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-200'
                          }`}
                        >
                          <Text className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* Not */}
            {selectedSlot && (
              <>
                <Text className="text-sm font-semibold text-slate-700 mb-2">3. Not Ekle (opsiyonel)</Text>
                <TextInput
                  value={patientNote}
                  onChangeText={setPatientNote}
                  placeholder="Şikayetlerinizi kısaca belirtin..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-6"
                  style={{ minHeight: 80 }}
                />
              </>
            )}

            {/* Özet + Onayla */}
            {selectedDate && selectedSlot && (
              <View className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 mb-4">
                <Text className="text-cyan-700 font-semibold mb-2">Randevu Özeti</Text>
                <Text className="text-slate-700 text-sm">👨‍⚕️ Dr. {feedback.doctor_name}</Text>
                <Text className="text-slate-700 text-sm">📅 {displayDate(selectedDate)}</Text>
                <Text className="text-slate-700 text-sm">🕐 {selectedSlot}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleBook}
              disabled={!selectedDate || !selectedSlot || booking}
              className={`rounded-2xl py-4 items-center ${selectedDate && selectedSlot && !booking ? 'bg-cyan-500' : 'bg-slate-200'}`}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className={`font-bold text-base ${selectedDate && selectedSlot ? 'text-white' : 'text-slate-400'}`}>
                  Randevuyu Onayla
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
