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


