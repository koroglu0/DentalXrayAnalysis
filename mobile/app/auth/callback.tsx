import { View, ActivityIndicator, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// dental-ai://auth/callback geldiğinde Expo Router buraya yönlendirir.
// maybeCompleteAuthSession() openAuthSessionAsync promise'ini hemen çözer
// ve loginWithGoogle() kaldığı yerden devam eder.
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: 16 }}>
      <ActivityIndicator size="large" color="#13a4ec" />
      <Text style={{ color: '#64748b', fontSize: 14 }}>Giriş yapılıyor...</Text>
    </View>
  );
}
