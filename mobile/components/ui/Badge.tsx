import { View, Text } from 'react-native';

type BadgeVariant = 'admin' | 'doctor' | 'patient' | 'processing' | 'completed' | 'pending' | 'active' | 'inactive' | 'high' | 'medium' | 'low' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  admin: { bg: 'bg-red-100', text: 'text-red-700' },
  doctor: { bg: 'bg-blue-100', text: 'text-blue-700' },
  patient: { bg: 'bg-green-100', text: 'text-green-700' },
  processing: { bg: 'bg-orange-100', text: 'text-orange-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-600' },
  high: { bg: 'bg-red-100', text: 'text-red-700' },
  medium: { bg: 'bg-orange-100', text: 'text-orange-700' },
  low: { bg: 'bg-blue-100', text: 'text-blue-700' },
  info: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
};

export function Badge({ label, variant = 'info' }: BadgeProps) {
  const style = variantMap[variant] ?? variantMap.info;
  return (
    <View className={`px-2.5 py-0.5 rounded-full ${style.bg}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{label}</Text>
    </View>
  );
}
