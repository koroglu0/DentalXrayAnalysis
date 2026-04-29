import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/context/AuthContext';
import apiClient from '../../src/api/client';
import { StatCard } from '../../components/ui/StatCard';

interface Stats { total?: number; by_role?: { admin?: number; doctor?: number; patient?: number } }
interface Analysis { id: string; filename: string; date: string; patient_email?: string; status: string; }

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [orgCount, setOrgCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes, orgRes] = await Promise.all([
        apiClient.get('/api/users/stats').catch(() => ({ data: {} })),
        apiClient.get('/api/history').catch(() => ({ data: [] })),
        apiClient.get('/api/organizations').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data.stats || statsRes.data || {});
      setAnalyses(historyRes.data.history || historyRes.data || []);
      const orgs = orgRes.data.organizations || orgRes.data || [];
      setOrgCount(orgs.length);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#13a4ec" /></View>;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Admin Paneli</Text>
          <Text className="text-xs text-cyan-500">Dental AI</Text>
        </View>
        <TouchableOpacity onPress={logout} className="border border-slate-200 rounded-lg px-3 py-1.5">
          <Text className="text-slate-600 text-xs">Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        <Text className="text-2xl font-bold text-slate-900 mb-1">Hoş geldiniz, {user?.name?.split(' ')[0]}</Text>
        <Text className="text-slate-500 text-sm mb-5">Sistem genel bakışı</Text>

        {/* İstatistikler */}
        <View className="flex-row gap-3 mb-3">
          <StatCard label="Toplam Kullanıcı" value={stats.total ?? 0} color="blue" icon="👥" />
          <StatCard label="Admin" value={stats.by_role?.admin ?? 0} color="red" icon="🛡️" />
        </View>
        <View className="flex-row gap-3 mb-3">
          <StatCard label="Doktor" value={stats.by_role?.doctor ?? 0} color="purple" icon="👨‍⚕️" />
          <StatCard label="Hasta" value={stats.by_role?.patient ?? 0} color="green" icon="🏥" />
        </View>
        <View className="flex-row gap-3 mb-6">
          <StatCard label="Organizasyon" value={orgCount} color="orange" icon="🏢" />
          <StatCard label="Toplam Analiz" value={analyses.length} color="gray" icon="🔬" />
        </View>

        {/* Hızlı Erişim */}
        <Text className="font-bold text-slate-900 text-base mb-3">Yönetim</Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/(admin)/users')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-50 rounded-xl items-center justify-center">
                <Text className="text-xl">👥</Text>
              </View>
              <View>
                <Text className="font-semibold text-slate-900 text-sm">Kullanıcı Yönetimi</Text>
                <Text className="text-slate-400 text-xs">Tüm kullanıcıları görüntüle ve yönet</Text>
              </View>
            </View>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(admin)/organizations')}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-between border border-slate-100 shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center">
                <Text className="text-xl">🏢</Text>
              </View>
              <View>
                <Text className="font-semibold text-slate-900 text-sm">Organizasyonlar</Text>
                <Text className="text-slate-400 text-xs">Klinik ve hastane yönetimi</Text>
              </View>
            </View>
            <Text className="text-slate-400">›</Text>
          </TouchableOpacity>
        </View>

        {/* Son Analizler */}
        <Text className="font-bold text-slate-900 text-base mb-3">Son Analizler</Text>
        {analyses.slice(0, 5).map((a) => (
          <View key={a.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-semibold text-slate-900 text-sm" numberOfLines={1}>{a.filename}</Text>
                <Text className="text-slate-400 text-xs">{a.patient_email || (a as any).user_email || '—'}</Text>
              </View>
              <Text className="text-slate-400 text-xs">{a.date?.slice(0, 10)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
