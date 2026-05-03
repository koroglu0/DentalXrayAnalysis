import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, LayoutChangeEvent, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';

interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Finding {
  name: string;
  risk: 'high' | 'medium' | 'low' | 'info';
  confidence: number;
  bbox?: BBox;
}

interface ResultData {
  findings: Finding[];
  total_findings: number;
  timestamp?: string;
  image_url?: string;
  image_s3_key?: string;
  status?: string;
  id?: string;
  filename?: string;
}

export default function DoctorResultScreen() {
  const { resultData, imageUri, analysisId } = useLocalSearchParams<{
    resultData?: string;
    imageUri?: string;
    analysisId?: string;
  }>();

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<number | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | undefined>(imageUri);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    if (resultData) {
      try {
        setData(JSON.parse(resultData));
      } catch {}
    } else if (analysisId) {
      setLoading(true);
      apiClient
        .get(`/api/analysis/${analysisId}`)
        .then((res) => {
          // Backend { analysis: {...} } döndürür
          const analysis = res.data.analysis || res.data;
          setData(analysis);
          // Presigned URL varsa bunu yerel görüntü URI olarak kullan
          if (analysis?.image_url) {
            setLocalImageUri(analysis.image_url);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [resultData, analysisId]);

  const handleSendFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('Hata', 'Mesaj boş bırakılamaz');
      return;
    }
    const patientEmail = (data as any)?.user_email || (data as any)?.patient_email;
    if (!patientEmail) {
      Alert.alert('Hata', 'Hasta bilgisi bulunamadı');
      return;
    }
    setSendingFeedback(true);
    try {
      await apiClient.post('/api/feedbacks', {
        analysis_id: data?.id || '',
        patient_email: patientEmail,
        message: feedbackMessage.trim(),
      });
      setFeedbackModal(false);
      setFeedbackMessage('');
      Alert.alert('Gönderildi', 'Geri bildiriminiz hastaya iletildi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Gönderilemedi');
    } finally {
      setSendingFeedback(false);
    }
  };

  // Pending analizi AI ile analiz et
  const handleAnalyzePending = async () => {
    if (!data?.image_s3_key && !data?.image_url) {
      Alert.alert('Hata', 'Görüntü verisi bulunamadı');
      return;
    }
    setAnalyzing(true);
    try {
      // 1. Presigned URL al (zaten varsa kullan)
      let presignedUrl = data.image_url;
      if (!presignedUrl && data.image_s3_key) {
        const urlRes = await apiClient.get(
          `/api/analysis/image-url?key=${encodeURIComponent(data.image_s3_key)}`
        );
        presignedUrl = urlRes.data.url;
      }
      if (!presignedUrl) throw new Error('URL alınamadı');

      // 2. Görüntüyü blob olarak indir
      const imgRes = await fetch(presignedUrl);
      if (!imgRes.ok) throw new Error('Görüntü indirilemedi');
      const blob = await imgRes.blob();

      // 3. FormData oluştur ve analiz gönder
      const formData = new FormData();
      formData.append('file', {
        uri: presignedUrl,
        type: blob.type || 'image/jpeg',
        name: data.filename || 'xray.jpg',
      } as any);
      if (data.id) {
        formData.append('analysis_id', data.id);
      }

      const res = await apiClient.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 4. Sonuçları güncelle
      const result = res.data;
      setData((prev) => ({
        ...prev,
        ...result,
        status: 'completed',
      }));
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || err.message || 'Analiz başarısız');
    } finally {
      setAnalyzing(false);
    }
  };


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

  const isPending = data.status === 'pending';
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

  const bboxColor = (risk: string) => {
    if (risk === 'high') return 'rgba(239,68,68,0.9)';   // kırmızı
    if (risk === 'medium') return 'rgba(249,115,22,0.9)'; // turuncu
    return 'rgba(34,197,94,0.9)';                         // yeşil
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Text className="text-slate-600 text-base">← Geri</Text>
        </TouchableOpacity>
        <Text className="font-bold text-slate-900">
          {isPending ? 'Bekleyen Röntgen' : 'Analiz Raporu'}
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-1">
          {isPending ? 'Bekleyen Röntgen' : 'Analiz Raporu'}
        </Text>
        {data.timestamp && (
          <Text className="text-slate-400 text-sm mb-5">Analiz Tarihi: {data.timestamp}</Text>
        )}

        {/* X-Ray Görüntüsü + BBox Overlay */}
        {localImageUri ? (
          <View
            className="bg-black rounded-2xl overflow-hidden mb-4"
            onLayout={(e: LayoutChangeEvent) => {
              const { width, height } = e.nativeEvent.layout;
              setImageLayout({ width, height });
            }}
          >
            <Image
              source={{ uri: localImageUri }}
              style={{ width: '100%', height: 224 }}
              resizeMode="contain"
            />
            {/* Bounding box overlay — sadece tamamlanmış analizlerde */}
            {!isPending && imageLayout && findings.map((f, i) => {
              const bbox = f.bbox as BBox | undefined;
              if (!bbox) return null;
              const iw = imageLayout.width;
              const ih = imageLayout.height;
              // resizeMode='contain' ile görselin gerçek render boyutunu hesapla
              // Görüntünün orijinal en-boy oranı bilinmediğinden bbox normalize coords
              // direkt container boyutuna uygulanır
              const left = bbox.x1 * iw;
              const top = bbox.y1 * ih;
              const width = (bbox.x2 - bbox.x1) * iw;
              const height = (bbox.y2 - bbox.y1) * ih;
              const color = bboxColor(f.risk);
              const isSelected = selectedFinding === i;
              return (
                <View
                  key={i}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    borderWidth: isSelected ? 2.5 : 1.5,
                    borderColor: color,
                    borderRadius: 3,
                  }}
                >
                  {/* Numara badge — sol üst köşe */}
                  <View
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: -8,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: color,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold', lineHeight: 10 }}>
                      {i + 1}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-black rounded-2xl h-48 items-center justify-center mb-4">
            <Text className="text-slate-500 text-sm">Görüntü mevcut değil</Text>
          </View>
        )}

        {/* Pending ise analiz butonu göster */}
        {isPending ? (
          <TouchableOpacity
            onPress={handleAnalyzePending}
            disabled={analyzing}
            className={`rounded-2xl py-4 items-center mb-6 ${analyzing ? 'bg-cyan-300' : 'bg-cyan-500'}`}
          >
            {analyzing ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-bold text-base">Analiz Ediliyor...</Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-base">🔬 AI ile Analiz Et</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            {/* Özet İstatistikler */}
            <View className="flex-row gap-3 mb-3">
              <StatCard label="Toplam" value={data.total_findings ?? findings.length} color="blue" icon="📋" subtitle="Tespit Edilen Bulgu" />
              <StatCard label="Yüksek Risk" value={highRisk} color="red" icon="⚠️" subtitle="Acil Müdahale Gerekli" />
            </View>
            <View className="flex-row gap-3 mb-5">
              <StatCard label="Orta Risk" value={medRisk} color="orange" icon="⚡" subtitle="Takip Gerekli" />
              <StatCard label="Güven Ort." value={`${(avgConf * 100).toFixed(1)}%`} color="green" icon="✅" subtitle="AI Güven Skoru" />
            </View>
          </>
        )}

        {/* Bulgular Listesi — sadece tamamlanmış analizlerde */}
        {!isPending && (
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
        )}

        {/* Hastaya Geri Bildirim Gönder butonu (tamamlanmış analizlerde) */}
        {!isPending && (
          <TouchableOpacity
            onPress={() => setFeedbackModal(true)}
            className="bg-cyan-500 rounded-2xl py-4 items-center mt-4"
          >
            <Text className="text-white font-bold text-base">💬 Hastaya Geri Bildirim Gönder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Geri Bildirim Modalı */}
      <Modal visible={feedbackModal} transparent animationType="slide" onRequestClose={() => setFeedbackModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="w-10 h-1 bg-slate-200 rounded-full self-center mb-5" />
            <Text className="text-lg font-bold text-slate-900 mb-1">Hastaya Geri Bildirim</Text>
            <Text className="text-slate-400 text-xs mb-4">
              Analiz sonucunu hastanıza iletin. Hasta ana sayfasında bildirim olarak görecek.
            </Text>
            <TextInput
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Örn: Röntgeninizde 2 adet diş çürüğü tespit ettim. Muayene olmanızı öneririm..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm mb-5"
              style={{ minHeight: 100 }}
            />
            <TouchableOpacity
              onPress={handleSendFeedback}
              disabled={sendingFeedback}
              className="bg-cyan-500 rounded-xl py-3.5 items-center mb-3"
            >
              {sendingFeedback ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Gönder</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeedbackModal(false)} className="bg-slate-100 rounded-xl py-3.5 items-center">
              <Text className="text-slate-600 font-semibold">İptal</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
