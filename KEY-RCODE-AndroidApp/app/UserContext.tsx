import React, { useContext, createContext, type PropsWithChildren, useState, useCallback } from 'react';
import { useStorageState } from './useStorageState';

type UserData = { username: string; email: string; domain: string; };

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
  return useContext(AuthContext);
}

export function UserProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session_token');
  const [user, setUser] = useState<UserData | null>(null);

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
  }, [setSession]);

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