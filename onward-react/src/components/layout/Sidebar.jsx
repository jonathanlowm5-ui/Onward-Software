import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import api from '../../services/api';
import useSectionNav from '../../hooks/useSectionNav';
import useFavorites from '../../hooks/useFavorites';
import useWebDesign from '../../hooks/useWebDesign';
// Uploaded sidebar icons (replace the emoji on the Casino panel menu).
import icFortune from '../../assets/sidebar/fortune-wheel.avif';
import icTournament from '../../assets/sidebar/tournament.avif';
import icGift from '../../assets/sidebar/gift.avif';
import icDiamond from '../../assets/sidebar/diamond.avif';
import icGiveaway from '../../assets/sidebar/giveaway.avif';
import icRewards from '../../assets/sidebar/rewards.avif';
import icUseCode from '../../assets/sidebar/use-code.avif';
import icCrown from '../../assets/sidebar/crown.avif';
// Uploaded monochrome SVG line icons for the menu. Only items with a matching
// icon get one; the rest keep their emoji. Unused SVGs (blackjack, baccarat,
// sicbo, gameshow, recentplay, profile, providers, all) are kept in
// assets/sidebar/svg/ for later use.
import svgPromo from '../../assets/sidebar/svg/promo.svg';
import svgChallenge from '../../assets/sidebar/svg/challenge.svg';
import svgReferral from '../../assets/sidebar/svg/referral.svg';
import svgHot from '../../assets/sidebar/svg/hot.svg';
import svgFavorites from '../../assets/sidebar/svg/favorites.svg';
import svgNew from '../../assets/sidebar/svg/newgames.svg';
import svgFast from '../../assets/sidebar/svg/fastgames.svg';
import svgLive from '../../assets/sidebar/svg/livecasino.svg';
import svgSlots from '../../assets/sidebar/svg/slots.svg';
import svgRoulette from '../../assets/sidebar/svg/roulette.svg';
import svgSupport from '../../assets/sidebar/svg/support.svg';
import svgHome from '../../assets/sidebar/svg/home.svg';

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

// Compact ₱ figure for the Jackpots badge (e.g. ₱1.2M / ₱830K).
const fmtPool = (n) => {
  if (n >= 1e9) return `₱${(n / 1e9).toFixed(1).replace(/\.0$/, '')}B`;
  if (n >= 1e6) return `₱${(n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `₱${Math.round(n / 1e3)}K`;
  return `₱${Math.round(n)}`;
};

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
  const { count: favCount } = useFavorites();
  const wd = useWebDesign(); // admin Website Design: optional sidebar logo
  const go = useSectionNav();
  const navigate = useNavigate();

  const toggleGroup = (id) => setOpenGroups((g) => ({ ...g, [id]: !g[id] }));

  // Real jackpot pool for the Jackpots badge (showcase text while loading).
  const [jpBadge, setJpBadge] = useState('₱128M');
  useEffect(() => {
    let alive = true;
    api.get('/public/stats')
      .then((r) => { const pool = Number(r.data?.jackpotPool); if (alive && pool > 0) setJpBadge(fmtPool(pool)); })
      .catch(() => { /* keep the fallback badge */ });
    return () => { alive = false; };
  }, []);

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
        {/* Admin-configured sidebar logo (Website Design → Side Panel Logo) */}
        {wd?.logo?.text && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 16px 9px', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            {wd.logo.emoji && <span style={{ fontSize: 20 }} aria-hidden="true">{wd.logo.emoji}</span>}
            <span style={{ fontWeight: 900, letterSpacing: '.06em', fontSize: 15, color: 'var(--text)' }}>{wd.logo.text}</span>
          </div>
        )}

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
          <SbItem img={icFortune} icon="🎡" label="Mini Games" i18n="nav_fortune_wheel" onClick={openFortuneWheel} />
          <SbItem img={icTournament} icon="🏆" label="Tournaments" i18n="nav_tournaments" onClick={() => go('tournaments')} />
          <SbItem img={svgPromo} icon="🎁" label="Promotions" i18n="nav_promos" onClick={() => go('promos')} />
          <SbItem img={icDiamond} icon="💎" label="VIP Club" i18n="nav_vip" onClick={() => go('vip')} />
          <SbItem img={icGiveaway} icon="⚡" label="Giveaways" i18n="nav_giveaways" badge={{ cls: 'hot', text: 'HOT' }} onClick={() => go('giveaways')} />
          <SbItem img={svgChallenge} icon="🎯" label="Mission" i18n="nav_mission" onClick={() => go('missions')} />
          <SbItem img={icUseCode} icon="🎟️" label="Use Code" i18n="nav_use_code" onClick={openUseCodeModal} />
          <SbItem img={icCrown} icon="👑" label="Jackpots" i18n="nav_jackpots" badge={{ cls: 'hot', text: jpBadge }} onClick={() => go('jackpots')} />
          <SbItem img={svgReferral} icon="🤝" label="Referral" i18n="nav_referral" onClick={() => go('referral')} />

          <div className="sb-divider"></div>

          <SbItem img={svgHot} icon="🔥" label="Popular" i18n="nav_popular" active={filter === 'popular'} onClick={() => filterSidebar('popular')} />
          <SbItem img={svgFavorites} icon="❤️" label="Favorite" i18n="nav_favorite" active={filter === 'favorite'} badge={favCount > 0 ? { cls: 'hot', text: String(favCount) } : undefined} onClick={() => filterSidebar('favorite')} />
          <SbItem img={svgNew} icon="🆕" label="New" i18n="nav_new" badge={{ cls: 'new', text: 'NEW' }} onClick={() => filterSidebar('new')} />
          <SbItem img={svgFast} icon="⚡" label="Instant Games" i18n="nav_instant" onClick={() => filterSidebar('crash')} />
          <SbItem img={svgLive} icon="📡" label="Live Casino" i18n="nav_live" onClick={() => go('live')} />
          <SbItem img={svgSlots} icon="🎰" label="Slots" i18n="nav_slots" onClick={() => go('slots')} />
          <SbItem icon="💎" label="Jackpot" i18n="nav_jackpot_games" onClick={() => filterSidebar('jackpot')} />
          <SbItem icon="🎇" label="Megaways" i18n="nav_megaways" onClick={() => filterSidebar('megaways')} />
          <SbItem img={svgRoulette} icon="🎡" label="Roulette" i18n="nav_roulette" onClick={() => filterSidebar('roulette')} />
          <SbItem icon="🎲" label="Table Games" i18n="nav_table" onClick={() => filterSidebar('table')} />
          <SbItem icon="🃏" label="Cards" i18n="nav_cards" onClick={() => filterSidebar('cards')} />
          <SbItem icon="♠️" label="Poker" i18n="nav_poker" onClick={() => go('poker')} />
          <SbItem icon="🎱" label="Bingo" i18n="nav_bingo" onClick={() => filterSidebar('bingo')} />
          <SbItem icon="🀄" label="Mahjong" i18n="nav_mahjong" onClick={() => filterSidebar('mahjong')} />
          <SbItem icon="🎫" label="Lottery" i18n="nav_lottery" onClick={() => go('lottery')} />
          <SbItem icon="🐟" label="Fish Games" i18n="nav_fish" onClick={() => go('fish')} />

          <div className="sb-divider"></div>

          <div className="sb-bottom">
            <SbItem img={svgSupport} icon="❓" label="FAQ" i18n="nav_faq" onClick={closeSidebar} />
            <SbItem icon="📱" label="Download APP" i18n="nav_mini" onClick={openDownloadModal} />
          </div>
        </div>

        {/* SPORT PANEL */}
        <div className={`sb-panel${tab === 'sport' ? ' active' : ''}`} id="sb-sport">
          <SbItem img={svgHome} icon="🏠" label="Home" i18n="nav_lobby" onClick={() => go('sports')} />
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

function SbItem({ icon, img, label, i18n, badge, active, onClick }) {
  return (
    <button className={`sb-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      <span className="sb-nav-icon">
        {img ? <img src={img} alt="" className="sb-nav-img" /> : icon}
      </span>
      <span className="sb-nav-label" data-i18n={i18n}>{label}</span>
      {badge && <span className={`sb-nav-badge ${badge.cls}`}>{badge.text}</span>}
    </button>
  );
}
