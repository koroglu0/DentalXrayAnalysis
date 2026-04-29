import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

interface Finding {
  name: string;
  risk: 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  bbox?: number[];
}

interface ResultData {
  findings: Finding[];
  total_findings: number;
  timestamp?: string;
  image_url?: string;
}

export default function DoctorResultScreen() {
  const { resultData, imageUri, analysisId } = useLocalSearchParams<{
    resultData?: string;
    imageUri?: string;
    analysisId?: string;
  }>();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);

  useEffect(() => {
    if (resultData) {
      try {
        setData(JSON.parse(resultData));
      } catch {}
    } else if (analysisId) {
      // Geçmişten açıldıysa API'den çek
      setLoading(true);
      apiClient
        .get(`/api/history/${analysisId}`)
        .then((res) => setData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [resultData, analysisId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-5xl mb-4">⚠️</Text>
        <Text className="text-slate-500 text-center mb-6">Analiz verisi bulunamadı</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-cyan-500 rounded-xl px-6 py-3">
          <Text className="text-white font-semibold">Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const findings: Finding[] = data.findings || [];
  const highRisk = findings.filter((f) => f.risk === 'high').length;
  const medRisk = findings.filter((f) => f.risk === 'medium').length;
  const avgConf =
    findings.length > 0
      ? Math.round(findings.reduce((s, f) => s + (f.confidence || 0), 0) / findings.length * 100) / 100
      : 0;

  const riskLabel = (risk: string) => {
    if (risk === 'high') return { label: 'YÜKSEK RİSK', variant: 'high' as const };
    if (risk === 'medium') return { label: 'ORTA RİSK', variant: 'medium' as const };
    return { label: 'BİLGİ', variant: 'info' as const };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Text className="text-slate-600 text-base">← Geri</Text>
        </TouchableOpacity>
        <Text className="font-bold text-slate-900">Analiz Raporu</Text>
        <View className="w-12" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-1">Analiz Raporu</Text>
        {data.timestamp && (
          <Text className="text-slate-400 text-sm mb-5">Analiz Tarihi: {data.timestamp}</Text>
        )}

        {/* Özet İstatistikler */}
        <View className="flex-row gap-3 mb-3">
          <StatCard label="Toplam" value={data.total_findings} color="blue" icon="📋" subtitle="Tespit Edilen Bulgu" />
          <StatCard label="Yüksek Risk" value={highRisk} color="red" icon="⚠️" subtitle="Acil Müdahale Gerekli" />
        </View>
        <View className="flex-row gap-3 mb-5">
          <StatCard label="Orta Risk" value={medRisk} color="orange" icon="⚡" subtitle="Takip Gerekli" />
          <StatCard label="Güven Ort." value={`${(avgConf * 100).toFixed(1)}%`} color="green" icon="✅" subtitle="AI Güven Skoru" />
        </View>

        {/* X-Ray Görüntüsü */}
        {imageUri ? (
          <View className="bg-black rounded-2xl overflow-hidden mb-4">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-56"
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="bg-black rounded-2xl h-48 items-center justify-center mb-4">
            <Text className="text-slate-500 text-sm">Görüntü mevcut değil</Text>
          </View>
        )}

        {/* Bulgular Listesi */}
        <View className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-bold text-slate-900 text-base">Tespit Edilen Bulgular</Text>
            <View className="bg-cyan-100 rounded-full px-3 py-1">
              <Text className="text-cyan-700 text-xs font-bold">{findings.length} Bulgu</Text>
            </View>
          </View>

          {/* Risk dağılım çubuğu */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-400 text-xs uppercase font-semibold">Risk Dağılımı</Text>
            <Text className="text-green-500 text-xs font-semibold">
              DÜŞÜK RİSK: {findings.length - highRisk - medRisk}
            </Text>
          </View>
          <View className="h-1.5 bg-green-400 rounded-full mb-5" />

          {findings.length === 0 ? (
            <Text className="text-slate-400 text-sm text-center py-4">Bulgu tespit edilmedi</Text>
          ) : (
            findings.map((finding, i) => {
              const { label, variant } = riskLabel(finding.risk);
              const conf = Math.round((finding.confidence || 0) * 100);
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedFinding(selectedFinding === i ? null : i)}
                  className={`mb-4 ${selectedFinding === i ? 'opacity-100' : 'opacity-100'}`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      <View className="w-7 h-7 rounded-full bg-green-500 items-center justify-center">
                        <Text className="text-white text-xs font-bold">{i + 1}</Text>
                      </View>
                      <View>
                        <Text className="font-semibold text-slate-900 text-sm">{finding.name}</Text>
                        <Text className="text-slate-400 text-xs">Tespit edildi</Text>
                      </View>
                    </View>
                    <Badge label={label} variant={variant} />
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: `${conf}%` }}
                      />
                    </View>
                    <Text className="text-slate-500 text-xs font-medium">{conf}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
