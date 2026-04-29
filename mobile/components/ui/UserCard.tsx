import { View, Text, TouchableOpacity } from 'react-native';
import { Badge } from './Badge';

interface UserCardProps {
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  organization?: string;
  status?: 'active' | 'inactive';
  registeredAt?: string;
  onEdit?: () => void;
  onToggle?: () => void;
  onDelete?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'ADMİN',
  doctor: 'DOKTOR',
  patient: 'HASTA',
};

export function UserCard({ name, email, role, organization, status, registeredAt, onEdit, onToggle, onDelete }: UserCardProps) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          {/* Avatar */}
          <View className="w-10 h-10 rounded-full bg-sky-100 items-center justify-center">
            <Text className="text-sky-600 font-bold text-sm">{initials}</Text>
          </View>
          <View>
            <Text className="font-bold text-slate-900 text-sm">{name}</Text>
            <Text className="text-slate-400 text-xs">{email}</Text>
          </View>
        </View>
        <Badge label={roleLabels[role] ?? role} variant={role as any} />
      </View>

      <View className="flex-row gap-6 mb-3">
        <View>
          <Text className="text-slate-400 text-xs mb-0.5">Organizasyon</Text>
          <Text className="text-slate-700 text-xs font-medium">{organization || 'Atanmamış'}</Text>
        </View>
        <View>
          <Text className="text-slate-400 text-xs mb-0.5">Durum</Text>
          <Badge label={status === 'active' ? 'Aktif' : 'Pasif'} variant={status ?? 'active'} />
        </View>
      </View>

      {registeredAt && (
        <Text className="text-slate-400 text-xs mb-3">Kayıt: {registeredAt}</Text>
      )}

      {/* Aksiyon butonları */}
      <View className="flex-row gap-3">
        {onEdit && (
          <TouchableOpacity onPress={onEdit} className="p-2 rounded-lg bg-slate-50">
            <Text className="text-base">✏️</Text>
          </TouchableOpacity>
        )}
        {onToggle && (
          <TouchableOpacity onPress={onToggle} className="p-2 rounded-lg bg-slate-50">
            <Text className="text-base">🚫</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} className="p-2 rounded-lg bg-red-50">
            <Text className="text-base">🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
