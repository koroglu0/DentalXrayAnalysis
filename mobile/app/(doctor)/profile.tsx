import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Badge } from '../../components/ui/Badge';

export default function DoctorProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-slate-900 mb-6">Profilim</Text>

        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-sky-100 items-center justify-center mb-3">
            <Text className="text-sky-600 font-bold text-3xl">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xl font-bold text-slate-900">Dr. {user?.name}</Text>
          <Text className="text-slate-500 text-sm">{user?.email}</Text>
          <View className="mt-2">
            <Badge label="DOKTOR" variant="doctor" />
          </View>
        </View>

        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          {[
            { label: 'Ad Soyad', value: user?.name },
            { label: 'E-posta', value: user?.email },
            { label: 'Uzmanlık', value: user?.specialization || '—' },
            { label: 'Telefon', value: user?.phone || '—' },
          ].map((item, i, arr) => (
            <View key={i} className={`px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <Text className="text-slate-400 text-xs mb-1">{item.label}</Text>
              <Text className="text-slate-900 text-sm font-medium">{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={logout}
          className="bg-red-50 border border-red-200 rounded-2xl py-4 items-center"
        >
          <Text className="text-red-600 font-semibold">Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
