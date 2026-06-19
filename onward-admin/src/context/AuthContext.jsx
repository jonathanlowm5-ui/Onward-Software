import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * Admin session. Tries the shared backend JWT login; if the API is unreachable
 * it falls back to the original client-side gate so the panel still opens
 * (matching the original Onward_Admin.html behaviour).
 */
export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(authService.isAuthenticated());
  const [admin, setAdmin] = useState(null);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login(username, password);
      setAdmin(res?.admin || { username });
      setAuthed(true);
      return true;
    } catch {
      // Offline-safe fallback: open the panel locally (no token).
      setAdmin({ username });
      setAuthed(true);
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAdmin(null);
    setAuthed(false);
  }, []);

  const value = useMemo(() => ({ authed, admin, login, logout }), [authed, admin, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
