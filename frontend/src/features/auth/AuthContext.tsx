import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { clearSession, getAccessToken, saveSession } from '../../lib/tokenStorage';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => getAccessToken() !== null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signIn = useCallback((accessToken: string, expiresInSeconds: number) => {
    saveSession(accessToken, expiresInSeconds);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    queryClient.clear();
    navigate('/login');
  }, [navigate, queryClient]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
