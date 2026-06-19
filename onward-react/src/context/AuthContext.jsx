import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { setToken, getToken } from '../services/api';

const AuthContext = createContext(null);

/**
 * Customer session via the shared backend (JWT). Login/register/profile all hit
 * /api/player/*; the bearer token is kept in the Axios layer so every request is
 * authenticated. Wallet/KYC/profile reflect admin changes on refresh.
 */
export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!getToken()) { setProfile(null); setLoading(false); return null; }
    try {
      const { data } = await api.get('/player/me');
      setProfile(data);
      return data;
    } catch {
      setToken('');
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const login = useCallback(async (username, password) => {
    setError('');
    try {
      const { data } = await api.post('/player/login', { username, password });
      setToken(data.token);
      setProfile(data.player);
      return data.player;
    } catch (e) {
      setError(e.message || 'Login failed');
      throw e;
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError('');
    try {
      const { data } = await api.post('/player/register', payload);
      setToken(data.token);
      setProfile(data.player);
      return data.player;
    } catch (e) {
      setError(e.message || 'Registration failed');
      throw e;
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const { data } = await api.post('/player/forgot-password', { email });
    return data;
  }, []);

  const logout = useCallback(async () => {
    setToken('');
    setProfile(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const { data } = await api.put('/player/me', patch);
    setProfile(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isLoggedIn: !!profile,
      loading,
      error,
      setError,
      login,
      register,
      forgotPassword,
      logout,
      updateProfile,
      refreshProfile: loadProfile,
    }),
    [profile, loading, error, login, register, forgotPassword, logout, updateProfile, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
