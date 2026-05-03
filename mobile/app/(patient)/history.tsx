import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/client';
import { AnalysisCard } from '../../components/ui/AnalysisCard';

interface Analysis {
  id: string;
  filename: string;
  date: string;
  findings: any[];
  total_findings: number;
  status: string;
  image_url?: string;
}

export default function PatientHistoryScreen() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/api/history');
      setAnalyses(res.data.history || res.data || []);
    } catch {
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = analyses.filter(
    (a) =>
      a.filename?.toLowerCase().includes(search.toLowerCase()) ||
      a.id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text className="text-3xl font-bold text-slate-900 mb-1">Analiz Geçmişim</Text>
        <Text className="text-slate-500 text-sm mb-5">Gönderdiğiniz röntgenler ve sonuçları</Text>

        {/* Arama */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-3 mb-5 shadow-sm">
          <Text className="text-slate-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-slate-900 text-sm"
            placeholder="Dosya adına göre ara"
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-4">🦷</Text>
            <Text className="text-slate-500 text-sm text-center">Henüz analiz yok</Text>
          </View>
        ) : (
          filtered.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              id={analysis.id}
              filename={analysis.filename}
              date={analysis.date}
              findings={(analysis.findings || []).map((f: any) => f?.name || f).filter(Boolean)}
              totalFindings={analysis.total_findings || 0}
              status={analysis.status}
              imageUrl={analysis.image_url}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
