import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { UserProvider, useSession } from './UserContext';
import { View, ActivityIndicator } from 'react-native';
import { DarkModeProvider } from './DarkModeContext';
import AnimatedSplashScreen from './components/AnimatedSplashScreen';
import * as SplashScreen from 'expo-splash-screen';

// Empêche le splash screen natif de disparaître automatiquement 
// pendant que l'on charge les assets et les sessions
SplashScreen.preventAutoHideAsync();

// Désactivation des logs console en production
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

function InitialLayout() {
  const { session, isLoading, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

  const [isAppReady, setIsAppReady] = useState(false);
  const [splashAnimationFinished, setSplashAnimationFinished] = useState(false);

  // Dès que le chargement initial de la session est terminé, l'app est prête
  useEffect(() => {
    if (!isLoading) {
      setIsAppReady(true);
    }
  }, [isLoading]);

  // Si l'application est prête, on cache le splash screen natif très vite,
  // ce qui révèle notre splash screen animé en React Native par-dessus.
  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  useEffect(() => {
    // On ne redirige que si l'animation est finie, l'app est prête et la navigation est dispo
    if (!isAppReady || !splashAnimationFinished) return;

    const inTabsGroup = segments[0] === '(tabs)';
    const isLoggedOut = !session || !user;

    if (isLoggedOut && inTabsGroup) {
      router.replace('/login');
    } else if (!isLoggedOut && segments[0] === 'login') {
      router.replace('/(tabs)/home');
    }
  }, [session, user, isAppReady, splashAnimationFinished, segments]);

  const onSplashAnimationComplete = useCallback(() => {
    setSplashAnimationFinished(true);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* On montre le layout interne (le routeur/slot) */}
      <Slot />
      
      {/* 
        Le Splash Screen animé vient par-dessus tout le reste.
        Une fois que splashAnimationFinished passe à vrai, on ne le rend plus, 
        il a disparu avec une opacité à 0 et laisse place à l'app.
      */}
      {!splashAnimationFinished && (
        <AnimatedSplashScreen 
          isAppReady={isAppReady} 
          onAnimationFinished={onSplashAnimationComplete} 
        />
      )}
    </View>
  );
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