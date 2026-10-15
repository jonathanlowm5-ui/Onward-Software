import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import useSectionNav from '../../hooks/useSectionNav';
import useWebDesign from '../../hooks/useWebDesign';
import { IMG0 as LOGO } from '../../assets/images';
import PlayerAvatar from '../common/PlayerAvatar';
import { POPULAR_GAMES, ALL_SLOTS } from '../../services/data/gameData';
import { launchGame as resolveLaunch, fetchPromotions, fetchGames } from '../../services/gamesService';
import api from '../../services/api';

// Flag + short name shown on the header language button for the active language.
const LANG_FLAGS = {
  en: '🇬🇧', zh: '🇨🇳', id: '🇮🇩', ms: '🇲🇾', th: '🇹🇭', vi: '🇻🇳',
  hi: '🇮🇳', ko: '🇰🇷', ja: '🇯🇵', es: '🇪🇸', pt: '🇵🇹',
};
const LANG_SHORT = {
  en: 'EN', zh: '中文', id: 'ID', ms: 'MS', th: 'TH', vi: 'VI',
  hi: 'HI', ko: '한국어', ja: '日本語', es: 'ES', pt: 'PT',
};
const LANGS = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'id', flag: '🇮🇩', name: 'Bahasa Indonesia' },
  { code: 'ms', flag: '🇲🇾', name: 'Bahasa Melayu' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
];

// Self-contained language switcher: own local open state + own portal, so it
// never depends on the shared dropdown/backdrop wiring. Closes on outside click
// via a document listener attached on the NEXT tick — so the opening tap (and
// any mobile "ghost click") can't immediately close it (the flash-then-close bug).
function LangSwitcher() {
  const { lang, setLang } = useUI();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const t = e.target;
      if (wrapRef.current && wrapRef.current.contains(t)) return; // the button
      if (t.closest && t.closest('[data-langmenu]')) return;      // inside the menu
      setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ display: 'inline-flex' }}>
      <button
        className="hdr-icon-btn hdr-lang-btn"
        id="lang-btn"
        title="Language"
        onClick={() => setOpen((o) => !o)}
      >
        <span id="selected-lang-flag" className="hdr-flag">{LANG_FLAGS[lang] || '🌐'}</span>
      </button>
      {open && createPortal(
        <div data-langmenu role="menu" style={{
          position: 'fixed', top: 64, right: 14, zIndex: 99999,
          background: 'var(--surface, #131a2c)', border: '1px solid var(--border, #243049)',
          borderRadius: 12, padding: 8, minWidth: 230, maxHeight: '72vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted, #8898b8)', padding: '6px 10px' }}>Language</div>
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                background: lang === l.code ? 'rgba(240,192,64,.12)' : 'none', border: 'none',
                color: lang === l.code ? 'var(--gold, #f0c040)' : 'var(--text, #fff)',
                padding: '11px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              <span style={{ width: 26, fontSize: 18 }}>{l.flag}</span>
              <span>{l.name}</span>
              {lang === l.code && <span style={{ marginLeft: 'auto', color: 'var(--gold,#f0c040)' }}>✓</span>}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// Live "players online" counter — real count from /public/stats, refreshed
// every 60s. Keeps the original showcase figure until the first response.
function OnlineCount() {
  const [online, setOnline] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/public/stats')
      .then((r) => { const n = Number(r.data?.online); if (alive && n > 0) setOnline(n); })
      .catch(() => { /* keep the fallback figure */ });
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return (
    <span className="hdr-online-num" id="top-online-count">
      {online != null ? online.toLocaleString() : '1,847'}
    </span>
  );
}

// Self-contained currency switcher — mirrors LangSwitcher so it opens reliably
// on mobile (the shared dropdown wiring had a flash-then-close bug). Lets the
// player switch the DISPLAY currency; the real wallet stays in their account
// currency, so each row shows the balance converted into that currency.
const CURRENCIES = [
  { code: 'PHP', symbol: '₱', flag: '🇵🇭', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'MYR', symbol: 'RM', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', flag: '🇹🇭', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', flag: '🇮🇩', name: 'Indonesian Rupiah' },
  { code: 'VND', symbol: '₫', flag: '🇻🇳', name: 'Vietnamese Dong' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
];

function CurrencySwitcher() {
  const { currency, setCurrency, accountCurrency, fxConvert } = useUI();
  const { isLoggedIn, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const bal = Number(profile?.balance || 0);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const t = e.target;
      if (wrapRef.current && wrapRef.current.contains(t)) return; // the button
      if (t.closest && t.closest('[data-curmenu]')) return;       // inside the menu
      setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ display: 'inline-flex' }}>
      <button className="hdr-icon-btn" id="currency-btn" title="Currency" onClick={() => setOpen((o) => !o)}>
        <span style={{ fontSize: '13px', fontWeight: 700 }} id="selected-currency-symbol">{currency.symbol}</span>
      </button>
      {open && createPortal(
        <div data-curmenu role="menu" style={{
          position: 'fixed', top: 64, right: 14, zIndex: 99999,
          background: 'var(--surface, #131a2c)', border: '1px solid var(--border, #243049)',
          borderRadius: 12, padding: 8, minWidth: 250, maxHeight: '72vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted, #8898b8)', padding: '6px 10px' }}>Display Currency</div>
          {isLoggedIn && (
            <div style={{ fontSize: 11, color: 'var(--text-muted, #8898b8)', padding: '0 10px 8px' }}>
              ≈ approximate. Your wallet stays in <b style={{ color: 'var(--gold, #f0c040)' }}>{accountCurrency}</b>.
            </div>
          )}
          {CURRENCIES.map((c) => {
            const active = currency.code === c.code;
            return (
              <button
                key={c.code}
                onClick={() => { setCurrency({ code: c.code, symbol: c.symbol }); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  background: active ? 'rgba(240,192,64,.12)' : 'none', border: 'none',
                  color: active ? 'var(--gold, #f0c040)' : 'var(--text, #fff)',
                  padding: '11px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                <span style={{ width: 24, fontSize: 18 }}>{c.flag}</span>
                <span style={{ width: 28, fontWeight: 800 }}>{c.symbol}</span>
                <span>{c.code}</span>
                {isLoggedIn
                  ? <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: c.code === accountCurrency ? 'var(--text,#fff)' : 'var(--text-muted,#8898b8)' }}>{c.code === accountCurrency ? '' : '≈ '}{c.symbol}{fxConvert(bal, accountCurrency || 'PHP', c.code).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  : <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted,#8898b8)' }}>{c.name}</span>}
                {active && <span style={{ marginLeft: isLoggedIn ? 8 : 'auto', color: 'var(--gold,#f0c040)' }}>✓</span>}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}

// Stable pseudo-random "live players" count for a game, derived from its id/name
// so it never jumps between renders (looks live without needing a real feed).
function playerCount(g) {
  const s = String(g.id != null ? g.id : g.name || '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 180 + (h % 9600);
}

const RECENT_KEY = 'onward_recent_searches';
function loadRecent() {
  try { const v = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

// Self-contained search box + results panel. On focus/click it opens a portalled
// dropdown showing the player's recent searches (left) and a popular-games grid
// (right) that live-filters to matches as they type — clicking a game launches
// it, clicking a recent term re-runs that search. `variant` picks the wrapper
// markup so both header layouts keep their existing styling.
function SearchPanel({ variant }) {
  const { searchQuery, setSearchQuery, openModal } = useUI();
  const { profile, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(loadRecent);
  const [rect, setRect] = useState(null);
  const wrapRef = useRef(null);

  const country = profile?.country || 'your region';

  useEffect(() => {
    if (!open) return undefined;
    const measure = () => { if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect()); };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      const t = e.target;
      if (wrapRef.current && wrapRef.current.contains(t)) return;
      if (t.closest && t.closest('[data-searchpanel]')) return;
      setOpen(false);
    };
    const id = setTimeout(() => document.addEventListener('pointerdown', onDown), 0);
    return () => { clearTimeout(id); document.removeEventListener('pointerdown', onDown); };
  }, [open]);

  const q = searchQuery.trim().toLowerCase();
  // Live catalogue (session-cached): admin-starred games first, real artwork only.
  const [liveGames, setLiveGames] = useState([]);
  useEffect(() => {
    let alive = true;
    fetchGames().then((g) => { if (alive && Array.isArray(g)) setLiveGames(g); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const popular = useMemo(() => {
    const good = liveGames.filter((g) => g.img && !String(g.img).startsWith('data:'));
    if (!good.length) return POPULAR_GAMES.slice(0, 12);
    return [...good.filter((g) => g.popular), ...good.filter((g) => !g.popular)].slice(0, 12);
  }, [liveGames]);
  const results = useMemo(() => {
    if (!q) return popular;
    const source = liveGames.length ? liveGames : ALL_SLOTS;
    return source
      .filter((g) => g.name.toLowerCase().includes(q) || (g.provider || '').toLowerCase().includes(q))
      .slice(0, 18);
  }, [q, popular, liveGames]);

  const saveRecent = (term) => {
    const t = String(term || '').trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const clearRecent = () => { setRecent([]); try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ } };

  const submit = (term) => {
    const t = String(term != null ? term : searchQuery).trim();
    setSearchQuery(t);
    if (t) saveRecent(t);
    setOpen(false);
    navigate('/slots');
  };

  const launch = async (g) => {
    saveRecent(g.name);
    setSearchQuery('');
    setOpen(false);
    if (!isLoggedIn) { openModal('register'); return; }
    try {
      const url = g.id != null ? await resolveLaunch(g.id) : g.launchUrl;
      if (url) window.open(url, '_blank', 'noopener');
      else openModal('game', { name: g.name, icon: g.icon });
    } catch { openModal('game', { name: g.name, icon: g.icon }); }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') submit();
    else if (e.key === 'Escape') setOpen(false);
  };

  const inputEl = (
    <input
      type="text"
      placeholder={variant === 'topbar' ? 'Search games…' : 'Search'}
      value={searchQuery}
      onChange={(e) => { setSearchQuery(e.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
      onClick={() => setOpen(true)}
      onKeyDown={onKeyDown}
    />
  );

  const W = typeof window !== 'undefined' ? Math.min(760, window.innerWidth - 24) : 760;
  let left = rect ? rect.left : 12;
  if (left + W > (typeof window !== 'undefined' ? window.innerWidth : 1200) - 12) {
    left = (typeof window !== 'undefined' ? window.innerWidth : 1200) - 12 - W;
  }
  if (left < 12) left = 12;

  return (
    <div className={variant === 'topbar' ? 'search-bar' : 'hdr-search'} ref={wrapRef}>
      {variant !== 'topbar' && <span className="hdr-search-icon">🔍</span>}
      {inputEl}
      {open && rect && createPortal(
        <div data-searchpanel className="srch-panel" style={{ position: 'fixed', top: rect.bottom + 8, left, width: W, zIndex: 99999 }}>
          <div className="srch-cols">
            <div className="srch-left">
              <div className="srch-head">
                <span>Latest search</span>
                {recent.length > 0 && <button type="button" className="srch-clear" onClick={clearRecent}>Clear</button>}
              </div>
              {recent.length ? (
                <div className="srch-recent">
                  {recent.map((r) => (
                    <button key={r} type="button" className="srch-chip" onClick={() => submit(r)}>
                      <span className="srch-chip-ic">🕘</span>{r}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="srch-empty">No recent searches yet — try “fortune”.</div>
              )}
            </div>
            <div className="srch-right">
              <div className="srch-rhead">
                <span className="srch-rtitle">🔥 Popular in {country}</span>
                <span className="srch-pill">{q ? 'Results' : 'All'}</span>
              </div>
              <div className="srch-grid">
                {results.length ? results.map((g) => (
                  <button key={g.id != null ? g.id : g.name} type="button" className="srch-card" onClick={() => launch(g)} title={g.name}>
                    <div className="srch-card-img" style={g.img ? { backgroundImage: `url(${g.img})` } : { background: `linear-gradient(135deg,${g.color || '#1a2240'},#0c1322)` }}>
                      {!g.img && <span className="srch-card-emoji">{g.icon || '🎰'}</span>}
                      <span className="srch-card-players">👤 {playerCount(g).toLocaleString()}</span>
                    </div>
                    <div className="srch-card-name">{g.name}</div>
                  </button>
                )) : (
                  <div className="srch-empty" style={{ gridColumn: '1 / -1' }}>No games match “{searchQuery}”.</div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// Top navigation pills used by both header variants. Emoji is kept separate
// from the translatable text so switching language never wipes the icon.
const NAV = [
  { id: 'lobby', emoji: '🎰', text: 'Lobby', i18n: 'nav_lobby' },
  { id: 'slots', emoji: '🎲', text: 'Slots', i18n: 'nav_slots' },
  { id: 'live', emoji: '📡', text: 'Live Casino', i18n: 'nav_live' },
  { id: 'sports', emoji: '⚽', text: 'Sports', i18n: 'nav_sports' },
  { id: 'fish', emoji: '🐟', text: 'Fish Games', i18n: 'nav_fish' },
  { id: 'promos', emoji: '🎁', text: 'Promotions', i18n: 'nav_promos' },
];


// Header bell — a real notification feed of the player's account events
// (rewards credited, deposit/withdrawal status). Polls while open + on mount.
function NotifBell() {
  const { openModal } = useUI();
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [seenAt, setSeenAt] = useState(() => {
    try { return localStorage.getItem('onward_notif_seen') || ''; } catch { return ''; }
  });

  useEffect(() => {
    if (!isLoggedIn) { setItems([]); return undefined; }
    let alive = true;
    const load = () => api.get('/player/notifications')
      .then((r) => { if (alive && Array.isArray(r.data)) setItems(r.data); })
      .catch(() => {});
    load();
    const id = setInterval(load, 45000);
    return () => { alive = false; clearInterval(id); };
  }, [isLoggedIn]);

  const unseen = items.filter((n) => !seenAt || (n.at || '') > seenAt).length;
  const toggle = () => {
    if (!isLoggedIn) { openModal('login'); return; }
    setOpen((o) => {
      const next = !o;
      if (next && items.length) {
        const latest = items[0]?.at || new Date().toISOString();
        setSeenAt(latest);
        try { localStorage.setItem('onward_notif_seen', latest); } catch { /* ignore */ }
      }
      return next;
    });
  };

  return (
    <>
      <button className="hdr-icon-btn" title="Notifications" onClick={(e) => { e.stopPropagation(); toggle(); }}>
        🔔
        {unseen > 0 && <span className="notif-dot"></span>}
      </button>
      {open && createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 5000 }} />
          <div style={{ position: 'fixed', top: 52, right: 12, zIndex: 5001, width: 330, maxWidth: 'calc(100vw - 20px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text)', borderBottom: '1px solid var(--border)', fontSize: 14 }}>🔔 Notifications</div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  No notifications yet — deposits, rewards and payouts show up here.
                </div>
              ) : items.map((n) => (
                <div key={n.id} style={{ display: 'flex', gap: 10, padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.45 }}>{n.text}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{String(n.at || '').replace('T', ' ').slice(0, 16)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default function Header() {
  const { toggleSidebar, openModal, currency, accountCurrency, fxConvert } = useUI();
  const { isLoggedIn, profile, logout } = useAuth();
  const go = useSectionNav();
  // Admin-uploaded webpage logo (Web Design → Webpage Logo) overrides the
  // built-in header logo when set.
  const webDesign = useWebDesign();
  const headerLogo = webDesign?.logo?.img || LOGO;
  const navigate = useNavigate();
  const location = useLocation();

  // Self-contained account menu (avatar). Local state + a portal to <body> so it
  // can never be clipped or out-stacked by the header.
  const [acctOpen, setAcctOpen] = useState(false);

  // Real promotions count on the header badge (was a hardcoded "1").
  const [promoCount, setPromoCount] = useState(0);
  useEffect(() => {
    let alive = true;
    fetchPromotions().then((list) => { if (alive) setPromoCount(Array.isArray(list) ? list.length : 0); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Admin-designed top banner buttons (Web Design → Top Banner Buttons):
  // label, icon, gradient, target URL, on/off + optional bar background.
  const [topCfg, setTopCfg] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/top-buttons').then((r) => { if (alive && r.data?.buttons) setTopCfg(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const topButtons = (topCfg?.buttons || []).filter((b) => b.enabled !== false);
  const goTopButton = (b) => {
    const url = String(b.url || '/');
    if (/^https?:\/\//i.test(url)) { window.open(url, '_blank', 'noopener'); return; }
    navigate(url.startsWith('/') ? url : `/${url}`);
    window.scrollTo({ top: 0 });
  };
  const goSection = (section) => { setAcctOpen(false); navigate('/profile', { state: { section } }); };

  // Logout: clear the session token (done in AuthContext) then return to the
  // public landing/lobby so member pages aren't reachable via the Back button.
  const handleLogout = async () => {
    setAcctOpen(false);
    await logout();
    go('lobby');
  };

  const activeId =
    NAV.find((n) => sectionMatch(n.id, location.pathname))?.id || 'lobby';

  // The wallet is in the player's account currency; convert for display when a
  // different display currency is selected (shown with a ≈ indicator).
  const converted = currency.code !== accountCurrency;
  const approx = converted ? '≈ ' : '';
  const fmt = (raw, fallback) => {
    if (raw == null) return fallback;
    const v = converted ? fxConvert(Number(raw), accountCurrency, currency.code) : Number(raw);
    return v.toFixed(2);
  };
  const balance = fmt(profile?.balance, '0.00');
  const bonus = fmt(profile?.bonus, '0.00');

  return (
    <>
      {/* ===== TOPBAR ===== */}
      <header id="topbar">
        <div className="topbar-inner">
          <button id="sb-toggle" onClick={toggleSidebar} title="Menu">☰</button>
          <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Home">
            <img src={headerLogo} alt="Onward" style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav-item${activeId === n.id ? ' active' : ''}`}
                onClick={() => go(n.id)}
              >
                <span aria-hidden="true">{n.emoji}</span>{' '}
                <span data-i18n={n.i18n}>{n.text}</span>
              </button>
            ))}
          </nav>
          <SearchPanel variant="topbar" />
          <div className="auth-btns">
            {!isLoggedIn ? (
              <>
                <button className="btn btn-outline" onClick={() => openModal('login')} data-i18n="ui_login">Log In</button>
                <button className="btn btn-primary" onClick={() => openModal('register')} data-i18n="ui_join_now">Join Now</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary" onClick={() => openModal('deposit')} data-i18n="ui_deposit_btn">＋ Deposit</button>
                <button className="btn btn-outline" onClick={handleLogout} data-i18n="ui_logout">Logout</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* WALLET BAR (shown after login) */}
      <div id="wallet-bar" className={isLoggedIn ? 'open' : ''} style={{ display: isLoggedIn ? '' : 'none' }}>
        <div className="wallet-inner">
          <div className="wallet-balance">
            <span className="wallet-label" data-i18n="ui_balance">Balance</span>
            <span className="wallet-amount" id="wallet-amount">{approx}{currency.symbol} {balance}</span>
          </div>
          <div className="wallet-balance">
            <span className="wallet-label" data-i18n="ui_bonus">Bonus</span>
            <span className="wallet-amount" style={{ color: 'var(--cyan)' }} id="bonus-amount">{approx}{currency.symbol} {bonus}</span>
          </div>
          <div className="wallet-actions">
            <button className="btn btn-primary btn-sm" onClick={() => openModal('deposit')} data-i18n="ui_deposit_btn">＋ Deposit</button>
            <button className="btn btn-outline btn-sm" onClick={() => openModal('withdraw')} data-i18n="ui_withdraw">Withdraw</button>
            <button className="btn btn-outline btn-sm" onClick={handleLogout} data-i18n="ui_logout">Logout</button>
          </div>
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY handled in Layout */}

      {/* ===== TWO-ROW SITE HEADER ===== */}
      <div id="site-header">
        <div className="hdr-row1" style={topCfg?.bg ? { background: topCfg.bg } : undefined}>
          <div className="hdr-pills-scroll">
            {topButtons.length > 0 ? topButtons.map((b) => (
              <button key={b.id} className="hdr-pill" style={{ background: `linear-gradient(110deg,${b.c1},${b.c2})` }} onClick={() => goTopButton(b)}>
                {b.iconImg
                  ? <img src={b.iconImg} alt="" style={{ width: 20, height: 20, objectFit: 'contain', display: 'block' }} />
                  : <span className="hdr-pill-icon">{b.icon}</span>}
                <span className="hdr-pill-label">{b.label}</span>
                {b.badge && promoCount > 0 && <span className="hdr-pill-badge">{promoCount}</span>}
              </button>
            )) : (
              /* fallback while the config loads / API unreachable */
              <>
                <button className="hdr-pill promos" onClick={() => go('promos')}>
                  <span className="hdr-pill-icon">🎁</span>
                  <span className="hdr-pill-label" data-i18n="nav_promos">Promotions</span>
                  {promoCount > 0 && <span className="hdr-pill-badge">{promoCount}</span>}
                </button>
                <button className="hdr-pill giveaway" onClick={() => go('giveaways')}>
                  <span className="hdr-pill-icon">🎮</span>
                  <span className="hdr-pill-label" data-i18n="nav_giveaways">Giveaway</span>
                </button>
              </>
            )}
          </div>
          <div className="hdr-row1-right">
            <CurrencySwitcher />
            <LangSwitcher />
            <NotifBell />
          </div>
        </div>

        <div className="hdr-row2">
          <button className="hdr-hamburger" id="sb-toggle2" onClick={toggleSidebar} title="Menu">☰</button>
          <div className="hdr-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Home">
            <img src={headerLogo} alt="Onward" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <div className="hdr-online">
            <div className="hdr-wifi">
              <div className="hdr-wbar"></div>
              <div className="hdr-wbar"></div>
              <div className="hdr-wbar"></div>
            </div>
            <OnlineCount />
          </div>
          <SearchPanel variant="header" />
          <div className="hdr-row2-right">
            {!isLoggedIn ? (
              <div className="hdr-auth-group" id="hdr-auth">
                <button className="btn btn-outline" style={{ padding: '7px 16px', fontSize: '13px' }} onClick={() => openModal('login')} data-i18n="ui_login">Log In</button>
                <button className="hdr-deposit-btn" onClick={() => openModal('register')} data-i18n="ui_join_now">Join Now</button>
              </div>
            ) : (
              <div className="hdr-wallet-group" id="hdr-wallet">
                <button className="hdr-bonus-btn" title="Bonuses & Promotions" onClick={() => go('promos')}>
                  🎁
                  <span className="hdr-bonus-dot">!</span>
                </button>
                <div className="hdr-balance">
                  <span className="hdr-bal-amount" id="hdr-bal-amount">{approx}{balance} {currency.code}</span>
                </div>
                <button className="hdr-deposit-btn" onClick={() => openModal('deposit')}>DEPOSIT</button>
                <div className="hdr-avatar-wrap" onClick={(e) => { e.stopPropagation(); setAcctOpen((o) => !o); }} style={{ cursor: 'pointer' }}>
                  <div className="hdr-avatar" id="hdr-avatar" style={profile?.avatar ? { backgroundImage: `url(${profile.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>{profile?.avatar ? '' : '🎮'}</div>
                  <div className="hdr-avatar-badge" id="hdr-avatar-badge">0</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar account menu — portalled to <body>, always on top */}
      {acctOpen && isLoggedIn && createPortal(
        <>
          <div onClick={() => setAcctOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 5000 }} />
          <div style={{ position: 'fixed', top: 96, right: 16, zIndex: 5001, width: 264, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.6)', overflow: 'hidden', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <PlayerAvatar size={42} fontSize={22} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.username || 'Player'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile?.playerCode || ''}</div>
              </div>
            </div>
            <div style={{ padding: 8 }}>
              {[
                ['👤', 'My Profile', () => goSection('security')],
                ['📜', 'Game History', () => goSection('history')],
                ['💳', 'Transactions', () => goSection('transactions')],
                ['🎰', 'Wager', () => goSection('wager')],
                ['💸', 'Withdraw', () => { setAcctOpen(false); openModal('withdraw'); }],
                ['🕴️', 'Agent', () => goSection('agent')],
              ].map(([ic, label, fn]) => (
                <button key={label} onClick={fn} style={acctRow}>
                  <span style={{ width: 22, textAlign: 'center' }}>{ic}</span><span>{label}</span>
                </button>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
              <button onClick={handleLogout} style={{ ...acctRow, color: 'var(--red,#e8293a)' }}>
                <span style={{ width: 22, textAlign: 'center' }}>🚪</span><span>Logout</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

const acctRow = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
  background: 'none', border: 'none', color: 'var(--text)', padding: '10px',
  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
};

// Determine which nav pill is active for the current route.
function sectionMatch(id, pathname) {
  const map = {
    lobby: '/',
    slots: '/slots',
    live: '/live',
    sports: '/sports',
    fish: '/fish',
    promos: '/promotions',
  };
  const path = map[id];
  if (path === '/') return pathname === '/';
  return pathname.startsWith(path);
}
