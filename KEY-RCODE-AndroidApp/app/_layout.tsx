import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider, useSession } from './UserContext';
import { View, ActivityIndicator } from 'react-native';
import { DarkModeProvider } from './DarkModeContext';

function InitialLayout() {
  const { session, isLoading, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';
    // Si pas de session OU pas d'user OU email par défaut => Déconnecté
    const isLoggedOut = !session || !user || user.email === 'email@domaine.fr';

    if (isLoggedOut && inTabsGroup) {
      router.replace('/login');
    } else if (!isLoggedOut && segments[0] === 'login') {
      router.replace('/(tabs)/home');
    }
  }, [session, user, isLoading, segments]);

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