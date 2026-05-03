import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import apiClient from '../../src/api/client';
import { useFocusEffect } from 'expo-router';

interface Feedback {
  id: string;
  analysis_id: string;
  doctor_name: string;
  doctor_email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/feedbacks/mine');
      setFeedbacks(res.data.feedbacks || []);
    } catch {
      setFeedbacks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchFeedbacks(); }, [fetchFeedbacks]));

  const markRead = async (id: string) => {
    await apiClient.put(`/api/feedbacks/${id}/read`).catch(() => {});
    setFeedbacks((prev) => prev.map((f) => f.id === id ? { ...f, is_read: true } : f));
  };

  const handleOpen = (feedback: Feedback) => {
    markRead(feedback.id);
    router.push({
      pathname: '/(patient)/feedback-detail',
      params: {
        feedbackData: JSON.stringify(feedback),
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  const unreadCount = feedbacks.filter((f) => !f.is_read).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-lg font-bold text-slate-900">Bildirimler</Text>
        {unreadCount > 0 && (
          <Text className="text-xs text-cyan-500 font-medium">{unreadCount} okunmamış bildirim</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeedbacks(); }} />}
      >
        {feedbacks.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-4xl mb-3">🔔</Text>
            <Text className="text-slate-600 font-semibold text-base">Henüz bildirim yok</Text>
            <Text className="text-slate-400 text-sm mt-1 text-center">
              Doktorunuz analiz hakkında geri bildirim gönderdiğinde burada görünecek.
            </Text>
          </View>
        )}

        {feedbacks.map((fb) => (
          <TouchableOpacity
            key={fb.id}
            onPress={() => handleOpen(fb)}
            className={`rounded-2xl p-4 border mb-3 ${fb.is_read ? 'bg-white border-slate-100' : 'bg-cyan-50 border-cyan-200'}`}
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-row items-center gap-2 flex-1">
                <View className="w-10 h-10 rounded-full bg-cyan-100 items-center justify-center flex-shrink-0">
                  <Text className="text-cyan-600 font-bold text-base">
                    {(fb.doctor_name || 'D').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900 text-sm">Dr. {fb.doctor_name}</Text>
                  <Text className="text-slate-400 text-xs">{fb.created_at?.slice(0, 10)}</Text>
                </View>
              </View>
              {!fb.is_read && (
                <View className="w-2.5 h-2.5 rounded-full bg-cyan-500 mt-1 flex-shrink-0" />
              )}
            </View>
            <Text className="text-slate-700 text-sm leading-5" numberOfLines={3}>
              {fb.message}
            </Text>
            <Text className="text-cyan-500 text-xs font-medium mt-2">
              Detay ve randevu al →
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
