import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import api, { setToken, getToken } from '../services/api';

const AuthContext = createContext(null);

// Friendly label for the player's current section (reported to the admin
// "Live Sessions" view so staff can see where each player is — Lobby or a game).
const SECTION_LABELS = {
  '': 'Lobby', lobby: 'Lobby', slots: 'Slots', sports: 'Sports', lottery: 'Lottery',
  live: 'Live Casino', fish: 'Fish', poker: 'Poker', promotions: 'Promotions',
  tournaments: 'Tournaments', jackpots: 'Jackpots', vip: 'VIP', referral: 'Referral',
  profile: 'Profile', missions: 'Missions', giveaways: 'Giveaways',
};
function currentLocation() {
  try {
    const seg = (window.location.pathname || '/').split('/').filter(Boolean)[0] || '';
    return SECTION_LABELS[seg] || (seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : 'Lobby');
  } catch { return 'Lobby'; }
}

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
      const { data } = await api.get('/player/me', { params: { loc: currentLocation() } });
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

  // Keep the session fresh so admin-side changes (wallet credits, KYC, status)
  // surface without a manual reload: refresh on tab focus and on a light poll.
  useEffect(() => {
    if (!getToken()) return undefined;
    const onFocus = () => { if (getToken()) loadProfile(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const id = setInterval(() => { if (getToken()) loadProfile(); }, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(id);
    };
  }, [loadProfile, profile?.id]);

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
      // First-time players must bind a bank account before they can withdraw.
      needsBankBinding: !!profile && profile.bankBound === false,
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
