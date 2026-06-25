import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import useSectionNav from '../../hooks/useSectionNav';

// Collapsible sport groups (id, icon, label, i18n, sub-links).
const SPORT_GROUPS = [
  { id: 'football', icon: '⚽', label: 'Football', i18n: 'sport_football',
    subs: ['▶ Live & Upcoming', '🏅 Outrights', '🏆 World Cup', '🌐 Int. Friendly Games', '🇪🇸 La Liga 2', '⊞ View All'] },
  { id: 'basketball', icon: '🏀', label: 'Basketball', i18n: 'sport_basketball',
    subs: ['▶ Live & Upcoming', '🏅 Outrights', '🏀 NBA', '🇵🇭 PBA', '🌍 EuroLeague', '⊞ View All'] },
  { id: 'tennis', icon: '🎾', label: 'Tennis', i18n: 'sport_tennis',
    subs: ['▶ Live & Upcoming', '🏅 Outrights', '🏆 ATP Tour', '🎾 WTA Tour', '⊞ View All'] },
  { id: 'boxing', icon: '🥊', label: 'Boxing', i18n: 'sport_boxing',
    subs: ['▶ Live & Upcoming', '🏅 Outrights', '🥊 WBC / WBO', '⊞ View All'] },
  { id: 'baseball', icon: '⚾', label: 'Baseball', i18n: 'sport_baseball',
    subs: ['▶ Live & Upcoming', '🏅 Outrights', '⚾ MLB', '⊞ View All'] },
];

const SPORT_SINGLES = [
  { icon: '🏈', label: 'American Football', i18n: 'sport_am_football' },
  { icon: '🏐', label: 'Volleyball', i18n: 'sport_volleyball' },
  { icon: '🎮', label: 'eSports', i18n: 'sport_esports', badge: { cls: 'new', text: 'NEW' } },
  { icon: '🏊', label: 'Swimming', i18n: 'sport_swimming' },
  { icon: '🏋️', label: 'MMA / UFC', i18n: 'sport_mma' },
];

export default function Sidebar() {
  const [tab, setTab] = useState('casino');
  const [filter, setFilter] = useState('popular');
  const [openGroups, setOpenGroups] = useState({});
  const { closeSidebar, openModal, sidebarOpen } = useUI();
  const go = useSectionNav();
  const navigate = useNavigate();

  const toggleGroup = (id) => setOpenGroups((g) => ({ ...g, [id]: !g[id] }));

  // filterSidebar(cat) — show a filtered slots view.
  const filterSidebar = (cat) => {
    setFilter(cat);
    if (cat === 'popular') navigate('/');
    else navigate(`/slots?cat=${cat}`);
    closeSidebar();
  };

  const openFortuneWheel = () => { openModal('fortune'); closeSidebar(); };
  const openPromoModal = () => { openModal('promo'); closeSidebar(); };
  const openUseCodeModal = () => { openModal('usecode'); closeSidebar(); };
  const openDownloadModal = () => { openModal('download'); closeSidebar(); };

  return (
    <aside id="sidebar-nav" className={sidebarOpen ? 'open' : ''}>
      <div className="sb-inner">
        {/* Casino / Sport Tabs */}
        <div className="sb-tabs">
          <button className={`sb-tab${tab === 'casino' ? ' active' : ''}`} id="tab-casino" onClick={() => setTab('casino')}>
            <span>🎰</span><span data-i18n="nav_live">Casino</span>
          </button>
          <button className={`sb-tab${tab === 'sport' ? ' active' : ''}`} id="tab-sport" onClick={() => setTab('sport')}>
            <span>🏀</span><span data-i18n="nav_sports">Sport</span>
          </button>
        </div>

        {/* CASINO PANEL */}
        <div className={`sb-panel${tab === 'casino' ? ' active' : ''}`} id="sb-casino">
          <SbItem icon="🎡" label="Mini Games" i18n="nav_fortune_wheel" onClick={openFortuneWheel} />
          <SbItem icon="🏆" label="Tournaments" i18n="nav_tournaments" onClick={() => go('tournaments')} />
          <SbItem icon="🎁" label="Promotions" i18n="nav_promos" onClick={() => go('promos')} />
          <SbItem icon="💎" label="VIP Club" i18n="nav_vip" onClick={() => go('vip')} />
          <SbItem icon="⚡" label="Giveaways" i18n="nav_giveaways" badge={{ cls: 'hot', text: 'HOT' }} onClick={() => go('giveaways')} />
          <SbItem icon="🎯" label="Mission" i18n="nav_mission" onClick={() => go('missions')} />
          <SbItem icon="🎟️" label="Use Code" i18n="nav_use_code" onClick={openUseCodeModal} />
          <SbItem icon="👑" label="Jackpots" i18n="nav_jackpots" badge={{ cls: 'hot', text: '₱128M' }} onClick={() => go('jackpots')} />
          <SbItem icon="🤝" label="Referral" i18n="nav_referral" onClick={() => go('referral')} />
          <SbItem icon="🧑‍💼" label="Agent" i18n="nav_agent" onClick={() => go('agent')} />
          <SbItem icon="📣" label="Follow Us" i18n="nav_follow" onClick={() => go('follow')} />

          <div className="sb-divider"></div>

          <SbItem icon="🔥" label="Popular" i18n="nav_popular" active={filter === 'popular'} onClick={() => filterSidebar('popular')} />
          <SbItem icon="🆕" label="New" i18n="nav_new" badge={{ cls: 'new', text: 'NEW' }} onClick={() => filterSidebar('new')} />
          <SbItem icon="⚡" label="Instant Games" i18n="nav_instant" onClick={() => filterSidebar('crash')} />
          <SbItem icon="📡" label="Live Casino" i18n="nav_live" onClick={() => go('live')} />
          <SbItem icon="🎰" label="Slots" i18n="nav_slots" onClick={() => go('slots')} />
          <SbItem icon="🎡" label="Roulette" i18n="nav_roulette" onClick={() => filterSidebar('roulette')} />
          <SbItem icon="🎲" label="Craps" i18n="nav_craps" onClick={() => filterSidebar('table')} />
          <SbItem icon="🃏" label="Poker" i18n="nav_poker" onClick={() => go('poker')} />
          <SbItem icon="🎫" label="Lottery" i18n="nav_lottery" onClick={() => filterSidebar('lottery')} />
          <SbItem icon="🐟" label="Fish Games" i18n="nav_fish" onClick={() => go('fish')} />

          <div className="sb-divider"></div>

          <div className="sb-bottom">
            <SbItem icon="❓" label="FAQ" i18n="nav_faq" onClick={closeSidebar} />
            <SbItem icon="📱" label="Download APP" i18n="nav_mini" onClick={openDownloadModal} />
          </div>
        </div>

        {/* SPORT PANEL */}
        <div className={`sb-panel${tab === 'sport' ? ' active' : ''}`} id="sb-sport">
          <SbItem icon="🏠" label="Home" i18n="nav_lobby" onClick={() => go('sports')} />
          <SbItem icon="🔴" label="Live Events" i18n="sec_live_events" badge={{ cls: 'hot', text: 'LIVE' }} onClick={() => go('sports')} />

          <div className="sb-divider"></div>

          {SPORT_GROUPS.map((grp) => (
            <div className="sb-sport-group" id={`sbg-${grp.id}`} key={grp.id}>
              <button className="sb-nav-item" onClick={() => toggleGroup(grp.id)} style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="sb-nav-icon">{grp.icon}</span>
                  <span className="sb-nav-label" data-i18n={grp.i18n}>{grp.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', transition: 'transform .2s', transform: openGroups[grp.id] ? 'rotate(180deg)' : 'none' }}>∨</span>
              </button>
              <div style={{ display: openGroups[grp.id] ? 'block' : 'none', paddingLeft: '12px', borderLeft: '2px solid rgba(255,255,255,.07)', margin: '0 8px 4px' }}>
                {grp.subs.map((sub, i) => (
                  <button key={i} className="sb-nav-item" onClick={() => go('sports')}
                    style={{ fontSize: '13px', padding: '7px 12px', ...(sub.startsWith('⊞') ? { background: 'rgba(255,255,255,.06)', borderRadius: '8px', marginTop: '2px' } : {}) }}>
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {SPORT_SINGLES.map((s, i) => (
            <SbItem key={i} icon={s.icon} label={s.label} i18n={s.i18n} badge={s.badge} onClick={() => go('sports')} />
          ))}

          <div className="sb-divider"></div>

          <div className="sb-bottom">
            <SbItem icon="❓" label="Betting Rules" i18n="sport_betting_rules" onClick={closeSidebar} />
            <SbItem icon="📊" label="My Bets" i18n="sport_my_bets" onClick={closeSidebar} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function SbItem({ icon, label, i18n, badge, active, onClick }) {
  return (
    <button className={`sb-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      <span className="sb-nav-icon">{icon}</span>
      <span className="sb-nav-label" data-i18n={i18n}>{label}</span>
      {badge && <span className={`sb-nav-badge ${badge.cls}`}>{badge.text}</span>}
    </button>
  );
}
