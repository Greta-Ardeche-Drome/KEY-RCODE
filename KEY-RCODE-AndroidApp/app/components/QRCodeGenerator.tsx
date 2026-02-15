import React, { useContext, createContext, type PropsWithChildren } from 'react';
// Corrige le chemin d'import :
import { useStorageState } from '../useStorageState';

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

  return (
    <AuthContext.Provider
      value={{
        signIn: (token, userData) => {
          // On sauvegarde le token de manière persistante (SecureStore)
          setSession(token);
          // On garde les infos utilisateur en mémoire
          setUser(userData);
        },
        signOut: () => {
          setSession(null);
          setUser(null);
        },
        session,
        isLoading,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}