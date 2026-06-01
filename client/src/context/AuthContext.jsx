import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { request } from '../api/request';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/api/auth/me')
      .then((payload) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const payload = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setUser(payload.user);
      return payload.user;
    },
    async register(details) {
      return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(details),
      });
    },
    async logout() {
      await request('/api/auth/logout', { method: 'POST' });
      setUser(null);
    },
    refresh: async () => {
      const payload = await request('/api/auth/me');
      setUser(payload.user);
      return payload.user;
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}