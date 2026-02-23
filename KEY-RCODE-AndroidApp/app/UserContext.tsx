import React, { useContext, createContext, type PropsWithChildren, useState, useCallback } from 'react';
import { useStorageState } from './useStorageState';
import { API_URLS, CLOUD_API_URL, resolveOnPremisesUrl, KNOWN_SITES } from './config';
import { Alert } from 'react-native';

type UserData = { 
  username: string; 
  email: string; 
  domain: string; 
  role: 'admin' | 'user';
  ldapGroup: string;
  /** Site AD auquel appartient l'utilisateur (ex: "Paris") */
  site?: string;
};
type ApiChoice = 'OnPremises' | 'Cloud';

const AuthContext = createContext<{
  signIn: (token: string, userData: UserData, apiChoice: ApiChoice, site?: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
  user: UserData | null;
  apiChoice: ApiChoice;
  currentApiUrl: string;
  /** Site on-premises sélectionné (null si Cloud) */
  currentSite: string | null;
  isLocked: boolean;
  triggerEmergencyLock: () => Promise<boolean>;
  resetUserLock: (targetUsername: string) => Promise<boolean>;
  checkLockStatus: () => Promise<void>;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
  user: null,
  apiChoice: 'OnPremises',
  currentApiUrl: API_URLS.OnPremises,
  currentSite: null,
  isLocked: false,
  triggerEmergencyLock: async () => false,
  resetUserLock: async () => false,
  checkLockStatus: async () => {},
});

export function useSession() {
  return useContext(AuthContext);
}

export function UserProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session_token');
  const [[, apiChoice], setApiChoice] = useStorageState('api_choice');
  const [[, storedSite], setStoredSite] = useStorageState('krc_site');
  const [user, setUser] = useState<UserData | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Valeur par défaut si pas encore défini
  const currentApiChoice: ApiChoice = (apiChoice as ApiChoice) || 'OnPremises';
  const currentSite: string | null = storedSite || null;

  // Résolution d'URL : si OnPremises + site → URL spécifique au site
  const currentApiUrl = currentApiChoice === 'Cloud'
    ? CLOUD_API_URL
    : currentSite
      ? resolveOnPremisesUrl(currentSite)
      : API_URLS.OnPremises;

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    setApiChoice(null);
    setStoredSite(null);
    setIsLocked(false);
  }, [setSession, setApiChoice, setStoredSite]);

  // Fonction pour déclencher le verrouillage d'urgence
  const triggerEmergencyLock = useCallback(async (): Promise<boolean> => {
    if (!session || !user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour déclencher le verrouillage d\'urgence.');
      return false;
    }

    try {
      const response = await fetch(`${currentApiUrl}/emergency/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ username: user.username }),
      });

      if (response.ok) {
        setIsLocked(true);
        Alert.alert(
          'Verrouillage d\'urgence activé',
          'Votre compte et ceux de votre groupe ont été verrouillés pour sécurité. Contactez un administrateur pour déverrouiller.',
          [{ text: 'Compris', onPress: signOut }]
        );
        return true;
      } else if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'EMERGENCY_LOCKED') {
          setIsLocked(true);
          Alert.alert('Compte verrouillé', data.message);
          return false;
        }
      }
      
      const data = await response.json();
      Alert.alert('Erreur', data.error || 'Impossible de déclencher le verrouillage d\'urgence.');
      return false;
    } catch (error) {
      console.error('Erreur lors du verrouillage d\'urgence:', error);
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
      return false;
    }
  }, [session, user, currentApiUrl, signOut]);

  // Fonction pour déverrouiller un utilisateur (admin uniquement)
  const resetUserLock = useCallback(async (targetUsername: string): Promise<boolean> => {
    if (!session || !user || user.role !== 'admin') {
      Alert.alert('Erreur', 'Seuls les administrateurs peuvent déverrouiller des comptes.');
      return false;
    }

    try {
      const response = await fetch(`${currentApiUrl}/emergency/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ targetUsername }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Succès', data.message || `Compte ${targetUsername} déverrouillé avec succès.`);
        return true;
      } else {
        Alert.alert('Erreur', data.error || data.message || 'Impossible de déverrouiller le compte.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors du déverrouillage:', error);
      Alert.alert('Erreur réseau', 'Impossible de contacter le serveur.');
      return false;
    }
  }, [session, user, currentApiUrl]);

  // Fonction pour vérifier le statut de verrouillage
  const checkLockStatus = useCallback(async (): Promise<void> => {
    if (!session || !user) return;

    try {
      // On fait un appel simple pour vérifier si le compte est verrouillé
      const response = await fetch(`${currentApiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session}`,
        },
        body: JSON.stringify({ userId: user.email }),
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'EMERGENCY_LOCKED') {
          setIsLocked(true);
          Alert.alert(
            'Compte verrouillé',
            data.message,
            [{ text: 'Déconnexion', onPress: signOut }]
          );
        }
      } else {
        setIsLocked(false);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    }
  }, [session, user, currentApiUrl, signOut]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token, userData, apiChoice, site) => {
          setSession(token);
          setUser(userData);
          setApiChoice(apiChoice);
          setStoredSite(site || null);
          setIsLocked(false);
        },
        signOut,
        session,
        isLoading,
        user,
        apiChoice: currentApiChoice,
        currentApiUrl,
        currentSite,
        isLocked,
        triggerEmergencyLock,
        resetUserLock,
        checkLockStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}