import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';
import type { Profile } from '@/types';

interface Session {
  token: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setSession(null);
      setProfile(null);
      localStorage.removeItem('token');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setSession({ token });
      loadProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [loadProfile]);

  const signUp = async (name: string, email: string, password: string) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('token', data.token);
    setSession({ token: data.token });
    setProfile(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post('/auth/signin', { email, password });
    localStorage.setItem('token', data.token);
    setSession({ token: data.token });
    setProfile(data.user);
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
