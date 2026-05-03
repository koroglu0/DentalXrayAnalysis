import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#13a4ec',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Bildirimler',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔔</Text>,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Randevular',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
      <Tabs.Screen name="feedback-detail" options={{ href: null }} />
    </Tabs>
  );
}
