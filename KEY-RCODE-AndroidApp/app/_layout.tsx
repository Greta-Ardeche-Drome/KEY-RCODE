import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider, useSession } from './UserContext';
import { View, ActivityIndicator } from 'react-native';
import { DarkModeProvider } from './(tabs)/profile'; // Import du provider

function InitialLayout() {
  const { session, isLoading, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const notLogged = !session || !user || user.email === 'email@domaine.fr';

    if (notLogged && inTabsGroup) {
      router.replace('/login');
    } else if (!notLogged && segments[0] === 'login') {
      router.replace('/(tabs)/home');
    }
  }, [session, user, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <DarkModeProvider>
      <UserProvider>
        <InitialLayout />
      </UserProvider>
    </DarkModeProvider>
  );
}