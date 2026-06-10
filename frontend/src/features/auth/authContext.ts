import { createContext } from 'react';

export interface AuthContextValue {
  isAuthenticated: boolean;
  signIn: (accessToken: string, expiresInSeconds: number) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
