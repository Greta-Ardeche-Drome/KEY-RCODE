import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { UserProvider, useSession } from './UserContext';
import { View, ActivityIndicator } from 'react-native';

function InitialLayout() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Vérifie si l'utilisateur essaie d'accéder aux onglets protégés
    const inTabsGroup = segments[0] === '(tabs)';

    if (!session && inTabsGroup) {
      // Pas de session + tentative d'accès aux tabs -> Login obligatoire
      router.replace('/login');
    } else if (session && segments[0] === 'login') {
      // Session active + tentative d'accès au login -> Redirection vers Home
      router.replace('/(tabs)/home');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Affiche l'écran demandé (Login ou Tabs)
  return <Slot />;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <InitialLayout />
    </UserProvider>
  );
}