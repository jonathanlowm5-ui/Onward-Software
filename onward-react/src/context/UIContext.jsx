import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { applyTranslations, startI18nObserver, getStoredLang, storeLang } from '../i18n';
import { useAuth } from './AuthContext';
import api from '../services/api';

const UIContext = createContext(null);

// Modals that require a logged-in player. Guests are sent to the login screen.
const AUTH_REQUIRED_MODALS = new Set(['deposit', 'withdraw']);

// Currency symbols for the display switcher / converter.
const CUR_SYMBOLS = { PHP: '₱', USD: '$', EUR: '€', INR: '₹', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', CNY: '¥', JPY: '¥' };

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

  // Persist the chosen language. The translation itself is applied by the
  // effect below, which runs AFTER React commits the re-render — otherwise
  // React would overwrite our translated text back to the English defaults.
  const setLang = useCallback((next) => {
    langRef.current = next;
    setLangState(next);
    storeLang(next);
  }, []);

  // Re-apply whenever the language changes (covers the post-render revert) and
  // keep newly navigated pages translated via the observer.
  useEffect(() => {
    langRef.current = lang;
    applyTranslations(lang);
  }, [lang]);

  useEffect(() => {
    const stop = startI18nObserver(() => langRef.current);
    return stop;
  }, []);
  // `currency` is the DISPLAY currency (for the converter indicator). The real
  // wallet always stays in the player's account currency.
  const [currency, setCurrencyState] = useState({ code: 'PHP', symbol: '₱' });
  const currencyPinned = useRef(false); // true once the user manually picks one
  const setCurrency = useCallback((c) => { currencyPinned.current = true; setCurrencyState(c); }, []);

  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  // which top dropdown is open: null | 'currency' | 'lang' | 'profile'
  const [dropdown, setDropdown] = useState(null);
  const toastId = useRef(0);

  // Read login state so deposit/withdraw can be gated behind registration.
  // AuthProvider wraps UIProvider, so this is always available.
  const { isLoggedIn, profile } = useAuth();
  const accountCurrency = profile?.currency || 'PHP';

  // Default the display currency to the player's own account currency (until
  // they manually switch it), so amounts are never mislabelled.
  useEffect(() => {
    if (profile?.currency && !currencyPinned.current) {
      setCurrencyState({ code: profile.currency, symbol: CUR_SYMBOLS[profile.currency] || '' });
    }
  }, [profile?.currency]);

  // Conversion rates (admin-configurable). rate[X] = units of X per 1 base unit.
  const [fx, setFx] = useState({ base: 'PHP', rates: {} });
  useEffect(() => { api.get('/currency-rates').then((r) => setFx(r.data || { base: 'PHP', rates: {} })).catch(() => {}); }, []);
  const fxConvert = useCallback((amount, from, to) => {
    const r = fx.rates || {};
    const rf = Number(r[from]) > 0 ? Number(r[from]) : 1;
    const rt = Number(r[to]) > 0 ? Number(r[to]) : 1;
    return (Number(amount) || 0) * (rt / rf);
  }, [fx]);
  const currencySymbol = useCallback((code) => CUR_SYMBOLS[code] || '', []);

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const openModal = useCallback((name, data = null) => {
    // Guests can't deposit or withdraw — send them to login/register instead.
    if (AUTH_REQUIRED_MODALS.has(name) && !isLoggedIn) {
      setModalData(null);
      setActiveModal('login');
      toast('Please log in or register first', 'info');
      return;
    }
    setModalData(data);
    setActiveModal(name);
  }, [isLoggedIn, toast]);
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const toggleDropdown = useCallback((name) => setDropdown((d) => (d === name ? null : name)), []);
  const closeDropdown = useCallback(() => setDropdown(null), []);

  const value = useMemo(
    () => ({
      sidebarOpen, setSidebarOpen, toggleSidebar, closeSidebar,
      activeModal, modalData, openModal, closeModal,
      lang, setLang,
      currency, setCurrency,
      accountCurrency, fx, fxConvert, currencySymbol,
      toasts, toast,
      searchQuery, setSearchQuery,
      dropdown, setDropdown, toggleDropdown, closeDropdown,
    }),
    [sidebarOpen, activeModal, modalData, lang, currency, accountCurrency, fx, fxConvert, currencySymbol,
     toasts, searchQuery, dropdown,
     toggleSidebar, closeSidebar, openModal, closeModal, toast, setCurrency, toggleDropdown, closeDropdown]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
