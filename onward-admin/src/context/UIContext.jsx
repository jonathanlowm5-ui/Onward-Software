import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { applyTranslations, startI18nObserver, getStoredLang, storeLang } from '../i18n';

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
  const [lang, setLangState] = useState(getStoredLang);
  // Display currency for the admin panel (persisted). Defaults to PHP.
  const [currency, setCurrencyState] = useState(() => {
    try { return localStorage.getItem('admin_currency') || 'PHP'; } catch { return 'PHP'; }
  });
  const setCurrency = useCallback((c) => {
    setCurrencyState(c);
    try { localStorage.setItem('admin_currency', c); } catch { /* storage unavailable */ }
  }, []);
  const langRef = useRef(lang);
  const tRef = useRef(null);

  // Persist the choice; the effect below applies it after React commits so the
  // re-render doesn't overwrite our translated text.
  const setLang = useCallback((next) => {
    langRef.current = next;
    setLangState(next);
    storeLang(next);
  }, []);

  useEffect(() => { langRef.current = lang; applyTranslations(lang); }, [lang]);
  useEffect(() => { const stop = startI18nObserver(() => langRef.current); return stop; }, []);

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
    () => ({ toastMsg, toast, light, toggleTheme, sidebarOpen, openSidebar, closeSidebar, lang, setLang, currency, setCurrency }),
    [toastMsg, toast, light, toggleTheme, sidebarOpen, openSidebar, closeSidebar, lang, currency, setCurrency]
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
