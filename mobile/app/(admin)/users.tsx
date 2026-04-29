import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TextInput,
  TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import apiClient from '../../src/api/client';
import { UserCard } from '../../components/ui/UserCard';
import { StatCard } from '../../components/ui/StatCard';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  organization?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  specialization?: string;
  phone?: string;
}

interface Stats { total?: number; by_role?: { admin?: number; doctor?: number; patient?: number } }
interface Organization { id: string; name: string; }

type FilterRole = 'all' | 'admin' | 'doctor' | 'patient';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '', password: '', name: '', role: 'patient' as User['role'],
    specialization: '', phone: '', organization_id: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, statsRes, orgRes] = await Promise.all([
        apiClient.get('/api/users'),
        apiClient.get('/api/users/stats').catch(() => ({ data: {} })),
        apiClient.get('/api/organizations').catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data.users || usersRes.data || []);
      setStats(statsRes.data.stats || statsRes.data || {});
      const orgs = orgRes.data.organizations || orgRes.data || [];
      setOrganizations(orgs);
    } catch (err: any) {
      Alert.alert('Hata', 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = users.filter((u) => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const handleCreate = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      Alert.alert('Eksik Bilgi', 'E-posta, şifre ve ad alanları zorunludur');
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/api/register', {
        email: newUser.email.trim(),
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        specialization: newUser.specialization || undefined,
        phone: newUser.phone || undefined,
        organization_id: newUser.organization_id || undefined,
      });
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', name: '', role: 'patient', specialization: '', phone: '', organization_id: '' });
      fetchData();
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Kullanıcı oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await apiClient.put(`/api/users/${selectedUser.email}`, {
        name: selectedUser.name,
        role: selectedUser.role,
        phone: selectedUser.phone,
        specialization: selectedUser.specialization,
      });
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error || 'Güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (user: User) => {
    try {
      await apiClient.post(`/api/users/${user.id}/toggle-status`);
      fetchData();
    } catch {
      Alert.alert('Hata', 'Durum değiştirilemedi');
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Kullanıcıyı Sil',
      `${user.name} silinecek. Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/users/${user.id}`);
              fetchData();
            } catch {
              Alert.alert('Hata', 'Silinemedi');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#13a4ec" />
      </View>
    );
  }

  const roleFilters: { key: FilterRole; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'admin', label: 'Admin' },
    { key: 'doctor', label: 'Doktor' },
    { key: 'patient', label: 'Hasta' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="bg-white border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
        <View>
          <Text className="text-base font-bold text-slate-900">Kullanıcı Yönetimi</Text>
          <Text className="text-xs text-slate-500">Tüm kullanıcıları görüntüle ve yönet</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-cyan-500 px-3 py-1.5 rounded-lg flex-row items-center gap-1"
        >
          <Text className="text-white text-xs font-semibold">+ Yeni</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-slate-900 mb-4">Kullanıcı Yönetimi</Text>

        {/* İstatistik kartları */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-3 pr-4">
            <View className="w-32">
              <StatCard label="Toplam Kullanıcı" value={stats.total ?? users.length} color="blue" />
            </View>
            <View className="w-32">
              <StatCard label="Admin" value={stats.by_role?.admin ?? 0} color="red" />
            </View>
            <View className="w-32">
              <StatCard label="Doktor" value={stats.by_role?.doctor ?? 0} color="purple" />
            </View>
            <View className="w-32">
              <StatCard label="Hasta" value={stats.by_role?.patient ?? 0} color="green" />
            </View>
          </View>
        </ScrollView>

        {/* Arama */}
        <View className="bg-white border border-slate-200 rounded-xl px-3 py-3 flex-row items-center mb-3 shadow-sm">
          <Text className="text-slate-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-slate-900 text-sm"
            placeholder="İsim veya e-posta..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Rol filtresi */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-2 pr-4">
            {roleFilters.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilterRole(f.key)}
                className={`px-4 py-2 rounded-full ${filterRole === f.key ? 'bg-cyan-500' : 'bg-white border border-slate-200'}`}
              >
                <Text className={`text-sm font-semibold ${filterRole === f.key ? 'text-white' : 'text-slate-600'}`}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Kullanıcı listesi */}
        {filtered.length === 0 ? (
          <View className="items-center py-12">
            <Text className="text-4xl mb-3">👥</Text>
            <Text className="text-slate-400 text-sm">Kullanıcı bulunamadı</Text>
          </View>
        ) : (
          filtered.map((user) => (
            <UserCard
              key={user.id || user.email}
              name={user.name}
              email={user.email}
              role={user.role}
              organization={user.organization}
              status={user.status ?? 'active'}
              registeredAt={user.created_at?.slice(0, 10)}
              onEdit={() => { setSelectedUser(user); setShowEditModal(true); }}
              onToggle={() => handleToggle(user)}
              onDelete={() => handleDelete(user)}
            />
          ))
        )}
      </ScrollView>

      {/* Yeni Kullanıcı Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-slate-600">İptal</Text>
            </TouchableOpacity>
            <Text className="font-bold text-slate-900">Yeni Kullanıcı</Text>
            <TouchableOpacity onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#13a4ec" /> : <Text className="text-cyan-500 font-bold">Kaydet</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {[
              { label: 'Ad Soyad', key: 'name', placeholder: 'Ad Soyad' },
              { label: 'E-posta', key: 'email', placeholder: 'eposta@ornek.com', keyboard: 'email-address' as const },
              { label: 'Şifre', key: 'password', placeholder: 'En az 8 karakter', secure: true },
              { label: 'Telefon', key: 'phone', placeholder: '+90 5xx...' },
              { label: 'Uzmanlık', key: 'specialization', placeholder: 'Ortodonti...' },
            ].map((field) => (
              <View key={field.key} className="mb-4">
                <Text className="text-sm font-medium text-slate-700 mb-2">{field.label}</Text>
                <TextInput
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                  placeholder={field.placeholder}
                  placeholderTextColor="#94a3b8"
                  value={(newUser as any)[field.key]}
                  onChangeText={(v) => setNewUser((p) => ({ ...p, [field.key]: v }))}
                  keyboardType={field.keyboard}
                  secureTextEntry={field.secure}
                  autoCapitalize="none"
                />
              </View>
            ))}

            <Text className="text-sm font-medium text-slate-700 mb-3">Rol</Text>
            <View className="flex-row gap-3 mb-4">
              {(['patient', 'doctor', 'admin'] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setNewUser((p) => ({ ...p, role }))}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${newUser.role === role ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`}
                >
                  <Text className={`text-xs font-semibold ${newUser.role === role ? 'text-cyan-600' : 'text-slate-500'}`}>
                    {role === 'patient' ? 'Hasta' : role === 'doctor' ? 'Doktor' : 'Admin'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Düzenle Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-200">
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text className="text-slate-600">İptal</Text>
            </TouchableOpacity>
            <Text className="font-bold text-slate-900">Kullanıcı Düzenle</Text>
            <TouchableOpacity onPress={handleEdit} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#13a4ec" /> : <Text className="text-cyan-500 font-bold">Kaydet</Text>}
            </TouchableOpacity>
          </View>
          {selectedUser && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {[
                { label: 'Ad Soyad', key: 'name' },
                { label: 'Telefon', key: 'phone' },
                { label: 'Uzmanlık', key: 'specialization' },
              ].map((field) => (
                <View key={field.key} className="mb-4">
                  <Text className="text-sm font-medium text-slate-700 mb-2">{field.label}</Text>
                  <TextInput
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900"
                    value={(selectedUser as any)[field.key] ?? ''}
                    onChangeText={(v) => setSelectedUser((p) => p ? { ...p, [field.key]: v } : p)}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              ))}
              <Text className="text-sm font-medium text-slate-700 mb-3">Rol</Text>
              <View className="flex-row gap-3">
                {(['patient', 'doctor', 'admin'] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setSelectedUser((p) => p ? { ...p, role } : p)}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${selectedUser.role === role ? 'border-cyan-500 bg-cyan-50' : 'border-slate-200'}`}
                  >
                    <Text className={`text-xs font-semibold ${selectedUser.role === role ? 'text-cyan-600' : 'text-slate-500'}`}>
                      {role === 'patient' ? 'Hasta' : role === 'doctor' ? 'Doktor' : 'Admin'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
