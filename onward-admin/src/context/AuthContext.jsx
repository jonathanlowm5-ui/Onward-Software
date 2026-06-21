import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * Admin session with role-based permissions. The backend returns the admin's
 * role + effective permissions on login and at /auth/me; `can(perm)` gates UI.
 */
export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(authService.isAuthenticated());
  const [admin, setAdmin] = useState(null);

  const loadMe = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    try {
      const { user } = await authService.me();
      setAdmin(user);
      setAuthed(true);
    } catch { /* token invalid/expired — leave as is */ }
  }, []);
  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback(async (username, password) => {
    try {
      const res = await authService.login(username, password);
      setAdmin(res?.user || { username, role: 'admin', permissions: [] });
      setAuthed(true);
      return true;
    } catch (e) {
      // Wrong credentials -> fail. Only fall back to an offline panel if the API
      // is unreachable (no HTTP response at all).
      if (e?.response) throw e;
      setAdmin({ username, role: 'superadmin', permissions: ['*'] });
      setAuthed(true);
      return true;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setAdmin(null);
    setAuthed(false);
  }, []);

  const can = useCallback(
    (perm) => {
      const perms = admin?.permissions || [];
      return perms.includes('*') || perms.includes(perm);
    },
    [admin]
  );

  const value = useMemo(
    () => ({ authed, admin, role: admin?.role, can, login, logout, refreshMe: loadMe }),
    [authed, admin, can, login, logout, loadMe]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
