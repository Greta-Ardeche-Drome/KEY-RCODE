import React, { useContext, createContext, type PropsWithChildren, useState, useCallback } from 'react';
import { useStorageState } from './useStorageState';
import { API_URLS } from './config';

type UserData = { username: string; email: string; domain: string; };
type ApiChoice = 'OnPremises' | 'Cloud';

const AuthContext = createContext<{
  signIn: (token: string, userData: UserData, apiChoice: ApiChoice) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
  user: UserData | null;
  apiChoice: ApiChoice;
  currentApiUrl: string;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
  user: null,
  apiChoice: 'OnPremises',
  currentApiUrl: API_URLS.OnPremises,
});

export function useSession() {
  return useContext(AuthContext);
}

export function UserProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session_token');
  const [[, apiChoice], setApiChoice] = useStorageState('api_choice');
  const [user, setUser] = useState<UserData | null>(null);

  // Valeur par défaut si pas encore défini
  const currentApiChoice: ApiChoice = (apiChoice as ApiChoice) || 'OnPremises';
  const currentApiUrl = API_URLS[currentApiChoice];

  const signOut = useCallback(() => {
    setSession(null);
    setUser(null);
    setApiChoice(null);
  }, [setSession, setApiChoice]);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token, userData, apiChoice) => {
          setSession(token);
          setUser(userData);
          setApiChoice(apiChoice);
        },
        signOut,
        session,
        isLoading,
        user,
        apiChoice: currentApiChoice,
        currentApiUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}