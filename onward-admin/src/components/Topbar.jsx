import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import MENU from '../services/menu';
import { ADMIN_LANGS } from '../i18n/dict';
import { listNotifications } from '../services/notificationService';

const fmtTime = (t) => { if (!t) return ''; const d = new Date(t); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(); };

// Currencies the admin can display amounts in (top-bar selector).
const ADMIN_CURRENCIES = [
  { code: 'PHP', sym: '₱', flag: '🇵🇭', name: 'Philippine Peso' },
  { code: 'MYR', sym: 'RM', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'THB', sym: '฿', flag: '🇹🇭', name: 'Thai Baht' },
  { code: 'IDR', sym: 'Rp', flag: '🇮🇩', name: 'Indonesian Rupiah' },
  { code: 'VND', sym: '₫', flag: '🇻🇳', name: 'Vietnamese Dong' },
  { code: 'INR', sym: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'USD', sym: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'CNY', sym: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
];

// Notification bell with a real dropdown that loads admin notifications.
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  const load = () => {
    setLoading(true);
    listNotifications()
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const count = items.length;
  return (
    <div ref={ref} style={{ position: 'relative' }} id="nbWrap">
      <button className="tb-btn bell" onClick={() => { setOpen((o) => !o); if (!open) load(); }} aria-label="Notifications">
        🔔{count > 0 && <span className="dot" id="nbDot">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '120%', right: 0, zIndex: 9999, width: 320, maxHeight: '72vh', overflowY: 'auto',
          background: 'var(--card, #131a2c)', border: '1px solid var(--border, #243049)', borderRadius: 10, boxShadow: '0 16px 44px rgba(0,0,0,.5)',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border, #243049)', fontWeight: 800 }}>Notifications</div>
          {loading ? (
            <div style={{ padding: 16, color: 'var(--muted, #8898b8)', fontSize: 13 }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 18, color: 'var(--muted, #8898b8)', fontSize: 13, textAlign: 'center' }}>No notifications</div>
          ) : items.map((n, i) => (
            <div key={n.id || i} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border, #243049)' }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text, #e8edf7)' }}>
                {n.title || 'Untitled'}{n.status === 'draft' && <span style={{ fontSize: 10, color: 'var(--gold, #f4b223)', marginLeft: 6 }}>· draft</span>}
              </div>
              {n.body && <div style={{ fontSize: 12.5, color: 'var(--muted, #8898b8)', marginTop: 3 }}>{n.body}</div>}
              <div style={{ fontSize: 11, color: 'var(--muted, #8898b8)', marginTop: 4 }}>{fmtTime(n.sentAt || n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Resolve the page title for the current route from the MENU hierarchy.
function titleFor(id) {
  for (const m of MENU) {
    if (m.link && m.link.id === id) return m.link.t;
    if (m.sub) { const s = m.sub.find((x) => x.id === id); if (s) return s.t; }
  }
  return 'Dashboard';
}

export default function Topbar() {
  const { openSidebar, toggleTheme, light, toast, lang, setLang, currency, setCurrency } = useUI();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const langWrapRef = useRef(null);
  const curWrapRef = useRef(null);
  const id = location.pathname === '/' ? 'dashboard' : location.pathname.slice(1);

  // Close the language menu on a genuine outside click (attached next tick so
  // the opening click can't immediately close it).
  useEffect(() => {
    if (!langOpen) return undefined;
    const onDown = (e) => { if (langWrapRef.current && !langWrapRef.current.contains(e.target)) setLangOpen(false); };
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', onDown); };
  }, [langOpen]);

  useEffect(() => {
    if (!curOpen) return undefined;
    const onDown = (e) => { if (curWrapRef.current && !curWrapRef.current.contains(e.target)) setCurOpen(false); };
    const t = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', onDown); };
  }, [curOpen]);

  const cur = ADMIN_LANGS.find((l) => l.code === lang) || ADMIN_LANGS[0];
  const curInfo = ADMIN_CURRENCIES.find((c) => c.code === currency) || ADMIN_CURRENCIES[0];

  return (
    <header className="topbar">
      <button className="hamburger" onClick={openSidebar} aria-label="Open menu">☰</button>
      <div className="page-title" id="pageTitle">{titleFor(id)}</div>
      <div className="tb-right">
        <NotificationBell />
        <button className="tb-btn tb-theme" id="themeBtn" title="Toggle day / night" onClick={toggleTheme}>
          <span className="ic">{light ? '☀️' : '🌙'}</span>
        </button>
        <button className="tb-btn hide-m" onClick={() => toast('Opening player site…')}>View Site</button>
        <div className="lang-wrap" ref={curWrapRef} style={{ position: 'relative' }}>
          <button className="tb-btn" onClick={() => setCurOpen((v) => !v)} title="Display currency">{curInfo.flag} {curInfo.code} ▾</button>
          {curOpen && (
            <div className="lang-menu show" style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 9999, minWidth: 220, maxHeight: '72vh', overflowY: 'auto',
              background: 'var(--card, #131a2c)', border: '1px solid var(--border, #243049)',
              borderRadius: 10, padding: 6, boxShadow: '0 16px 44px rgba(0,0,0,.5)',
            }}>
              {ADMIN_CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCurrency(c.code); setCurOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                    background: currency === c.code ? 'rgba(244,178,35,.14)' : 'transparent', border: 'none',
                    color: currency === c.code ? 'var(--gold, #f4b223)' : 'var(--text, #e8edf7)',
                    padding: '9px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{c.flag}</span>
                  <span style={{ width: 30, fontWeight: 800 }}>{c.sym}</span>
                  <span style={{ width: 40 }}>{c.code}</span>
                  <span style={{ color: 'var(--muted,#8898b8)', fontWeight: 600 }}>{c.name}</span>
                  {currency === c.code && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="lang-wrap" id="langWrap" ref={langWrapRef} style={{ position: 'relative' }}>
          <button className="tb-btn" onClick={() => setLangOpen((v) => !v)} id="langBtn">{cur.flag} ▾</button>
          {langOpen && (
            <div className="lang-menu show" id="langMenu" style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 9999, minWidth: 180,
              background: 'var(--card, #131a2c)', border: '1px solid var(--border, #243049)',
              borderRadius: 10, padding: 6, boxShadow: '0 16px 44px rgba(0,0,0,.5)',
            }}>
              {ADMIN_LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                    background: lang === l.code ? 'rgba(244,178,35,.14)' : 'transparent', border: 'none',
                    color: lang === l.code ? 'var(--gold, #f4b223)' : 'var(--text, #e8edf7)',
                    padding: '9px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{l.flag}</span>
                  <span>{l.name}</span>
                  {lang === l.code && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
