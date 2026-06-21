import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { applyTranslations, startI18nObserver, getStoredLang, storeLang } from '../i18n';

const UIContext = createContext(null);

/**
 * Global UI state that used to live in DOM-manipulating helpers
 * (toggleSidebar, openModal, switchTab, toast, language/currency dropdowns…).
 * Centralising it here lets components open modals and react to UI changes
 * without reaching into the DOM.
 */
export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // activeModal: null | 'login' | 'register' | 'deposit' | 'withdraw' | 'game' | 'bank' | 'download' | 'promo'
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [lang, setLangState] = useState(getStoredLang);
  const langRef = useRef(lang);

  // Persist + apply the chosen language to the live DOM.
  const setLang = useCallback((next) => {
    langRef.current = next;
    setLangState(next);
    storeLang(next);
    applyTranslations(next);
  }, []);

  // Apply the stored language on first load and keep newly mounted pages
  // translated as the user navigates.
  useEffect(() => {
    applyTranslations(lang);
    const stop = startI18nObserver(() => langRef.current);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [currency, setCurrency] = useState({ code: 'PHP', symbol: '₱' });
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // which top dropdown is open: null | 'currency' | 'lang' | 'profile'
  const [dropdown, setDropdown] = useState(null);
  const toastId = useRef(0);

  const openModal = useCallback((name, data = null) => {
    setModalData(data);
    setActiveModal(name);
  }, []);
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const toggleDropdown = useCallback((name) => setDropdown((d) => (d === name ? null : name)), []);
  const closeDropdown = useCallback(() => setDropdown(null), []);

  const value = useMemo(
    () => ({
      sidebarOpen, setSidebarOpen, toggleSidebar, closeSidebar,
      activeModal, modalData, openModal, closeModal,
      lang, setLang,
      currency, setCurrency,
      toasts, toast,
      searchQuery, setSearchQuery,
      dropdown, setDropdown, toggleDropdown, closeDropdown,
    }),
    [sidebarOpen, activeModal, modalData, lang, currency, toasts, searchQuery, dropdown,
     toggleSidebar, closeSidebar, openModal, closeModal, toast, toggleDropdown, closeDropdown]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
