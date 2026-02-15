import React, { useContext, createContext, type PropsWithChildren, useEffect } from 'react';
import { useStorageState } from './useStorageState';
import { useRouter } from 'expo-router';

type UserData = {
  username: string;
  email: string;
  domain: string;
};

const AuthContext = createContext<{
  signIn: (token: string, userData: UserData) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
  user: UserData | null;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
  user: null,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== 'production') {
    if (!value) {
      throw new Error('useSession must be wrapped in a <UserProvider />');
    }
  }
  return value;
}

export function UserProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session_token');
  const [user, setUser] = React.useState<UserData | null>(null);
  const router = useRouter();

  // signOut effectue le logout et la redirection une seule fois
  const signOut = React.useCallback(() => {
    setSession(null);
    setUser(null);
    router.replace('/login');
  }, [router, setSession]);

  // Vérifie l'état d'authentification uniquement pour les cas automatiques (ex: session expirée)
  useEffect(() => {
    if (!isLoading && (!session || !user || user.email === 'email@domaine.fr')) {
      // Ne pas appeler signOut si déjà sur login
      if (router.pathname !== '/login') {
        signOut();
      }
    }
  }, [isLoading, session, user, signOut, router.pathname]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token, userData) => {
          setSession(token);
          setUser(userData);
        },
        signOut,
        session,
        isLoading,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
