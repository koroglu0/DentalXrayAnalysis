import { View, Text } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'gray';
  icon?: string;
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  gray: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
};

export function StatCard({ label, value, color = 'blue', icon, subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <View className={`flex-1 rounded-2xl p-4 border ${c.bg} ${c.border}`}>
      {icon ? (
        <Text className={`text-xl mb-1`}>{icon}</Text>
      ) : null}
      <Text className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-1`}>
        {label}
      </Text>
      <Text className="text-3xl font-bold text-slate-900">{value}</Text>
      {subtitle ? (
        <Text className={`text-xs ${c.text} font-medium mt-1`}>{subtitle}</Text>
      ) : null}
    </View>
  );
}
