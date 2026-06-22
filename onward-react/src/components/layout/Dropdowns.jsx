import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import useSectionNav from '../../hooks/useSectionNav';

const CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
];

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
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
];

export default function Dropdowns() {
  const { dropdown, closeDropdown, setCurrency, currency, setLang, lang, openModal } = useUI();
  const { isLoggedIn, logout, profile } = useAuth();
  const go = useSectionNav();
  const navigate = useNavigate();
  // Open the profile page already drilled into a specific section.
  const goSection = (section) => { navigate('/profile', { state: { section } }); closeDropdown(); };

  if (!dropdown) return null;

  return createPortal(
    <>
      {/* Shared backdrop */}
      <div onClick={closeDropdown} style={{ position: 'fixed', inset: 0, zIndex: 12000 }} />

      {/* CURRENCY */}
      {dropdown === 'currency' && (
        <div id="currency-dropdown" style={panel}>
          <div style={panelTitle}>Currency</div>
          {CURRENCIES.map((c) => (
            <button key={c.code} style={{ ...row, color: currency.code === c.code ? 'var(--gold)' : 'var(--text)' }}
              onClick={() => { setCurrency({ code: c.code, symbol: c.symbol }); closeDropdown(); }}>
              <span style={{ width: 28, fontWeight: 700 }}>{c.symbol}</span>
              <span>{c.code}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 12 }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* LANGUAGE */}
      {dropdown === 'lang' && (
        <div id="lang-dropdown" style={panel}>
          <div style={panelTitle}>Language</div>
          {LANGS.map((l) => (
            <button key={l.code} style={{ ...row, color: lang === l.code ? 'var(--gold)' : 'var(--text)' }}
              onClick={() => { setLang(l.code); closeDropdown(); }}>
              <span style={{ width: 28, fontSize: 18 }}>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* PROFILE MENU */}
      {dropdown === 'profile' && isLoggedIn && (
        <div id="profile-menu" style={{ ...panel, right: 16, minWidth: 264, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎮</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.username || 'Player'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile?.playerCode || ''}</div>
            </div>
          </div>
          <div style={{ padding: 8 }}>
            <button style={row} onClick={() => goSection('security')}>👤 My Profile</button>
            <button style={row} onClick={() => goSection('history')}>📜 Game History</button>
            <button style={row} onClick={() => goSection('transactions')}>💳 Transactions</button>
            <button style={row} onClick={() => goSection('wager')}>🎰 Wager</button>
            <button style={row} onClick={() => { openModal('deposit'); closeDropdown(); }}>💰 Deposit</button>
            <button style={row} onClick={() => { openModal('withdraw'); closeDropdown(); }}>🏦 Withdraw</button>
            <button style={row} onClick={() => { go('vip'); closeDropdown(); }}>💎 VIP Club</button>
            <button style={row} onClick={() => { go('referral'); closeDropdown(); }}>🤝 Referral</button>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button style={{ ...row, color: 'var(--red)' }} onClick={() => { logout(); closeDropdown(); go('lobby'); }}>🚪 Logout</button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}

const panel = {
  position: 'fixed', top: 96, right: 16, zIndex: 12001,
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
  padding: 8, minWidth: 240, boxShadow: '0 20px 60px rgba(0,0,0,.6)', maxHeight: '70vh', overflowY: 'auto',
};
const panelTitle = { fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-muted)', padding: '6px 10px' };
const row = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'none', border: 'none', color: 'var(--text)', padding: '10px', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: 14 };
