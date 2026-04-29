import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/client';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';

interface Analysis {
  id: string;
  filename: string;
  date: string;
  patient_email?: string;
  findings: string[];
  total_findings: number;
  status: string;
}

export default function DoctorDashboardScreen() {
  const { user, logout } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [pending, setPending] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, pendingRes] = await Promise.all([
        apiClient.get('/api/history'),
        apiClient.get('/api/doctor/pending-xrays').catch(() => ({ data: [] })),
      ]);
      setAnalyses(historyRes.data.history || historyRes.data || []);
      setPending(pendingRes.data.pending_xrays || pendingRes.data || []);
    } catch {
      setAnalyses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPatients = new Set(analyses.map((a: any) => a.patient_email || a.user_email).filter(Boolean)).size;
  const today = new Date().toISOString().slice(0, 10);
  const todayAnalyses = analyses.filter((a) => (a.date || (a as any).created_at)?.startsWith(today)).length;

  const displayList = activeTab === 'all' ? analyses : pending;

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

      {/* Sticky Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Doktor Paneli</Text>
          <Text className="text-xs text-cyan-500 font-medium">Dental AI</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(doctor)/upload')}
          className="bg-cyan-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
        >
          <Text className="text-white text-xs font-semibold">+ Yeni Analiz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Hoş Geldiniz */}
        <Text className="text-2xl font-bold text-slate-900 mb-1">
          Hoş geldiniz, {user?.name?.split(' ')[0]}
        </Text>
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-slate-500 text-sm">Bugünkü kliniğinizin özeti</Text>
          <View className="flex-row items-center border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Text className="text-slate-600 text-xs">📅 Bugün</Text>
          </View>
        </View>

        {/* Stat Kartları */}
        <View className="flex-row gap-3 mb-3">
          <StatCard label="Toplam Hasta" value={totalPatients} color="blue" icon="👥" subtitle="Aktif hastalar" />
          <StatCard label="Bugünkü Analizler" value={todayAnalyses} color="purple" icon="📊" subtitle={`Günlük hedef ${todayAnalyses > 0 ? '' : '%0'}`} />
        </View>
        <View className="flex-row gap-3 mb-6">
          <StatCard label="Bekleyen İncelemeler" value={pending.length} color="orange" icon="📋" subtitle="Dikkatini gerektiriyor" />
          <StatCard label="Toplam Analiz" value={analyses.length} color="green" icon="🔬" subtitle="Tüm zamanlar" />
        </View>

        {/* Hızlı İşlemler */}
        <Text className="text-base font-bold text-slate-900 mb-3">Hızlı İşlemler</Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(doctor)/upload')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-cyan-50 rounded-xl items-center justify-center">
                <Text className="text-xl">⬆️</Text>
              </View>
              <View>
                <Text className="font-semibold text-slate-900 text-sm">Röntgen Yükle</Text>
                <Text className="text-slate-400 text-xs">Galeriden seç veya çek</Text>
              </View>
            </View>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(doctor)/history')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center">
                <Text className="text-xl">▶️</Text>
              </View>
              <View>
                <Text className="font-semibold text-slate-900 text-sm">Analizleri Görüntüle</Text>
                <Text className="text-slate-400 text-xs">Tüm analiz geçmişi</Text>
              </View>
            </View>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Analizler Listesi */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-slate-900">Analizler</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/history')}>
            <Text className="text-cyan-500 text-sm font-medium">Tümünü Gör →</Text>
          </TouchableOpacity>
        </View>

        {/* Tab */}
        <View className="flex-row gap-2 mb-4">
          {(['all', 'pending'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 ${activeTab === tab ? 'bg-cyan-500' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-sm font-semibold ${activeTab === tab ? 'text-white' : 'text-slate-600'}`}>
                {tab === 'all' ? `Tümü (${analyses.length})` : 'Bekleyenler'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {displayList.slice(0, 5).map((analysis) => (
          <TouchableOpacity
            key={analysis.id}
            onPress={() => router.push({ pathname: '/(doctor)/result', params: { analysisId: analysis.id } })}
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-sm" numberOfLines={1}>Hasta</Text>
                <Text className="text-slate-400 text-xs">{analysis.patient_email || (analysis as any).user_email || user?.email}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-400 text-xs mb-1">{analysis.date?.slice(0, 10)}</Text>
                <Badge label={analysis.status === 'completed' ? 'Tamamlandı' : 'İşleniyor'} variant={analysis.status === 'completed' ? 'completed' : 'processing'} />
              </View>
            </View>
            <Text className="text-slate-500 text-xs" numberOfLines={1}>{analysis.filename}</Text>
          </TouchableOpacity>
        ))}

        {displayList.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-slate-400 text-sm">Analiz bulunamadı</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
