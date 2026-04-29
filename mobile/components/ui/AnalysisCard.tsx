import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Badge } from './Badge';

interface AnalysisCardProps {
  id: string;
  filename: string;
  date: string;
  findings: string[];
  totalFindings: number;
  status: string;
}

export function AnalysisCard({ id, filename, date, findings, totalFindings, status }: AnalysisCardProps) {
  const displayFindings = findings.slice(0, 2);
  const extra = findings.length - 2;

  const statusVariant = status === 'completed' ? 'completed' : status === 'processing' ? 'processing' : 'pending';

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/(doctor)/result', params: { analysisId: id } })}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3"
    >
      {/* Thumbnail placeholder */}
      <View className="w-full h-36 rounded-xl bg-slate-100 items-center justify-center mb-3">
        <Text className="text-slate-400 text-3xl">🦷</Text>
      </View>

      <Text className="font-bold text-slate-900 text-sm mb-0.5" numberOfLines={1}>{filename}</Text>
      <Text className="text-slate-400 text-xs mb-1">{date}</Text>

      {findings.length > 0 ? (
        <Text className="text-slate-600 text-xs mb-3">
          {displayFindings.join(', ')}
          {extra > 0 ? ` +${extra} daha` : ''}
        </Text>
      ) : (
        <Text className="text-slate-400 text-xs mb-3">Bulgu yok</Text>
      )}

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <View className="w-2 h-2 rounded-full bg-green-500" />
          <Badge label="Tamamlandı" variant={statusVariant} />
        </View>
        <Text className="text-slate-500 text-xs font-medium">{totalFindings} bulgu</Text>
      </View>
    </TouchableOpacity>
  );
}
