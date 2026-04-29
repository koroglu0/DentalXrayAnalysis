import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';

export default function DoctorUploadScreen() {
  const [selectedFile, setSelectedFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin verin');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Kameraya erişmek için izin verin');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setProgress(0);

    // Sahte progress animasyonu
    const interval = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 10 : p));
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'image/jpeg',
        name: selectedFile.fileName || 'xray.jpg',
      } as any);

      const res = await apiClient.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        router.push({
          pathname: '/(doctor)/result',
          params: {
            resultData: JSON.stringify(res.data),
            imageUri: selectedFile.uri,
          },
        });
        setIsAnalyzing(false);
        setProgress(0);
        setSelectedFile(null);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setProgress(0);
      Alert.alert('Analiz Başarısız', err?.response?.data?.error || 'Analiz yapılamadı');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

      <View className="bg-white border-b border-slate-200 px-4 py-3">
        <Text className="text-base font-bold text-slate-900">Röntgen Analizi</Text>
        <Text className="text-xs text-slate-500">AI ile röntgen analiz et</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-2">Röntgen Yükle</Text>
        <Text className="text-slate-500 text-sm mb-6">Analiz edilecek röntgen görüntüsünü seçin</Text>

        {/* Dosya Seçim Alanı */}
        {selectedFile ? (
          <View className="mb-5">
            <Image
              source={{ uri: selectedFile.uri }}
              className="w-full h-56 rounded-2xl mb-3"
              resizeMode="cover"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 border border-slate-300 rounded-xl py-3 items-center"
              >
                <Text className="text-slate-600 text-sm font-medium">Değiştir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedFile(null)}
                className="border border-red-200 rounded-xl py-3 px-4 items-center"
              >
                <Text className="text-red-500 text-sm">Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="border-2 border-dashed border-cyan-300 rounded-2xl py-14 items-center bg-cyan-50/50 mb-5"
          >
            <Text className="text-5xl mb-3">🦷</Text>
            <Text className="text-cyan-600 font-semibold text-base mb-1">Röntgen Seç</Text>
            <Text className="text-slate-400 text-sm">Sürükle bırak veya dosya seç</Text>
          </TouchableOpacity>
        )}

        {/* Seçenekler */}
        {!selectedFile && (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity onPress={pickImage} className="flex-1 bg-white border border-slate-200 rounded-xl py-3.5 items-center shadow-sm">
              <Text className="text-2xl mb-1">🖼️</Text>
              <Text className="text-slate-700 text-xs font-semibold">Galeri</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} className="flex-1 bg-white border border-slate-200 rounded-xl py-3.5 items-center shadow-sm">
              <Text className="text-2xl mb-1">📷</Text>
              <Text className="text-slate-700 text-xs font-semibold">Kamera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar */}
        {isAnalyzing && (
          <View className="mb-5">
            <View className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <View
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-slate-500 text-xs text-center">
              Analiz ediliyor... {progress}%
            </Text>
          </View>
        )}

        {/* Analiz Butonu */}
        <TouchableOpacity
          onPress={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className={`rounded-2xl py-4 items-center ${selectedFile && !isAnalyzing ? 'bg-cyan-500' : 'bg-slate-200'}`}
        >
          {isAnalyzing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" size="small" />
              <Text className="text-white font-bold">Analiz Ediliyor...</Text>
            </View>
          ) : (
            <Text className={`font-bold text-base ${selectedFile ? 'text-white' : 'text-slate-400'}`}>
              🔬 Analizi Başlat
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-slate-400 text-xs text-center mt-4">
          Ortalama analiz süresi ~3 saniye
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
