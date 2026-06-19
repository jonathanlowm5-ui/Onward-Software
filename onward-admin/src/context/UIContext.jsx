import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

const UIContext = createContext(null);

/**
 * Global admin UI state: toast, theme (day/night), mobile sidebar drawer,
 * language — replacing the original DOM helpers (toast, toggleTheme,
 * openSidebar/closeSidebar, langToggle).
 */
export function UIProvider({ children }) {
  const [toastMsg, setToastMsg] = useState('');
  const [light, setLight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const tRef = useRef(null);

  const toast = useCallback((m) => {
    setToastMsg(m);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const toggleTheme = useCallback(() => {
    setLight((v) => {
      const nv = !v;
      document.body.classList.toggle('light', nv);
      return nv;
    });
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => { document.body.classList.toggle('light', light); }, [light]);

  const value = useMemo(
    () => ({ toastMsg, toast, light, toggleTheme, sidebarOpen, openSidebar, closeSidebar, lang, setLang }),
    [toastMsg, toast, light, toggleTheme, sidebarOpen, openSidebar, closeSidebar, lang]
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
