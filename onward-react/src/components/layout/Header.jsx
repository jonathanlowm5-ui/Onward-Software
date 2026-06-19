import { useLocation } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import useSectionNav from '../../hooks/useSectionNav';
import { IMG0 as LOGO } from '../../assets/images';

// Top navigation pills used by both header variants.
const NAV = [
  { id: 'lobby', label: '🎰 Lobby' },
  { id: 'slots', label: '🎲 Slots' },
  { id: 'live', label: '📡 Live Casino', i18n: 'sec_live_casino' },
  { id: 'sports', label: '⚽ Sports' },
  { id: 'fish', label: '🐟 Fish Games', i18n: 'sec_fish_title' },
  { id: 'promos', label: '🎁 Promotions' },
];

export default function Header() {
  const { toggleSidebar, openModal, setSearchQuery, searchQuery, toggleDropdown, currency } = useUI();
  const { isLoggedIn, profile, logout } = useAuth();
  const go = useSectionNav();
  const location = useLocation();

  // Logout: clear the session token (done in AuthContext) then return to the
  // public landing/lobby so member pages aren't reachable via the Back button.
  const handleLogout = async () => {
    await logout();
    go('lobby');
  };

  const activeId =
    NAV.find((n) => sectionMatch(n.id, location.pathname))?.id || 'lobby';

  const balance = profile?.balance != null ? Number(profile.balance).toFixed(2) : '0.00';
  const bonus = profile?.bonus != null ? Number(profile.bonus).toFixed(2) : '500.00';

  return (
    <>
      {/* ===== TOPBAR ===== */}
      <header id="topbar">
        <div className="topbar-inner">
          <button id="sb-toggle" onClick={toggleSidebar} title="Menu">☰</button>
          <div className="logo">
            <img src={LOGO} alt="Onward" style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <nav className="nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={`nav-item${activeId === n.id ? ' active' : ''}`}
                onClick={() => go(n.id)}
                data-i18n={n.i18n}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search games…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
            <span className="wallet-amount" id="wallet-amount">{currency.symbol} {balance}</span>
          </div>
          <div className="wallet-balance">
            <span className="wallet-label" data-i18n="ui_bonus">Bonus</span>
            <span className="wallet-amount" style={{ color: 'var(--cyan)' }} id="bonus-amount">{currency.symbol} {bonus}</span>
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
        <div className="hdr-row1">
          <div className="hdr-pills-scroll">
            <button className="hdr-pill promos" onClick={() => go('promos')}>
              <span className="hdr-pill-icon">🎁</span>
              <span className="hdr-pill-label" data-i18n="nav_promos">Promotions</span>
              <span className="hdr-pill-badge">1</span>
            </button>
            <button className="hdr-pill giveaway" onClick={() => go('giveaways')}>
              <span className="hdr-pill-icon">🎮</span>
              <span className="hdr-pill-label" data-i18n="nav_giveaways">Giveaway</span>
            </button>
          </div>
          <div className="hdr-row1-right">
            <button className="hdr-icon-btn" id="currency-btn" title="Currency" onClick={(e) => { e.stopPropagation(); toggleDropdown('currency'); }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }} id="selected-currency-symbol">{currency.symbol}</span>
            </button>
            <button className="hdr-icon-btn" id="lang-btn" title="Language" onClick={(e) => { e.stopPropagation(); toggleDropdown('lang'); }}>
              <span id="selected-lang-flag" className="hdr-flag">🌐</span>
            </button>
            <button className="hdr-icon-btn" title="Notifications">
              🔔
              <span className="notif-dot"></span>
            </button>
          </div>
        </div>

        <div className="hdr-row2">
          <button className="hdr-hamburger" id="sb-toggle2" onClick={toggleSidebar} title="Menu">☰</button>
          <div className="hdr-logo">
            <img src={LOGO} alt="Onward" style={{ height: '52px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <div className="hdr-online">
            <div className="hdr-wifi">
              <div className="hdr-wbar"></div>
              <div className="hdr-wbar"></div>
              <div className="hdr-wbar"></div>
            </div>
            <span className="hdr-online-num" id="top-online-count">1,847</span>
          </div>
          <div className="hdr-search">
            <span className="hdr-search-icon">🔍</span>
            <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
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
                  <span className="hdr-bal-amount" id="hdr-bal-amount">{balance} {currency.code}</span>
                </div>
                <button className="hdr-deposit-btn" onClick={() => openModal('deposit')}>DEPOSIT</button>
                <div className="hdr-avatar-wrap" onClick={(e) => { e.stopPropagation(); toggleDropdown('profile'); }}>
                  <div className="hdr-avatar" id="hdr-avatar">🎮</div>
                  <div className="hdr-avatar-badge" id="hdr-avatar-badge">0</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

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
