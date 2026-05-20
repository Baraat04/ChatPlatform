"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../config';

interface User {
  id: number;
  name: string;
  email: string;
  messagesRemaining: number;
  totalMessagesUsed: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    console.log('AuthContext: refreshProfile START');
    try {
      const res = await fetch(`${API_URL}/auth/profile`, { credentials: 'include' });
      console.log('AuthContext: fetch returned status', res.status);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('AuthContext: fetch error', e);
      setUser(null);
    } finally {
      console.log('AuthContext: setting loading to false in finally block');
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
