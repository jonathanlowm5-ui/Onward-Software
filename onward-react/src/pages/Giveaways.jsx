import { useState, useEffect, useMemo } from 'react';
import useSectionNav from '../hooks/useSectionNav';
import { useUI } from '../context/UIContext';

const GW_DATA = [
  {
    id: 1, badge: 'exclusive', badgeLabel: 'EXCLUSIVE',
    title: 'Swift Start Giveaway!', titleKey: 'gw1_title', sub: '1/2 · Reach VIP level 1+', subKey: 'gw1_sub',
    participants: 195, slides: ['🎡', '🎰', '💰'], prize: 'Wheel', prizeKey: 'gw1_prize', prizeLabel: '15 FS',
    prizeColor: 'orange', totalPrizes: 20, totalLabel: '400 FS', totalColor: '#22c55e',
    endsIn: Date.now() + (5 * 86400 + 8 * 3600 + 29 * 60 + 7) * 1000,
    btnColor: 'purple', active: true,
  },
  {
    id: 2, badge: 'free', badgeLabel: 'FREE',
    title: 'Welcome to Telegram', titleKey: 'gw2_title', sub: 'Join our Telegram community!', subKey: 'gw2_sub',
    participants: 484, slides: ['🐔', '🎁', '⚡'], prize: 'Chicken Run', prizeKey: 'gw2_prize', prizeLabel: '10 FS',
    prizeColor: 'blue', totalPrizes: 40, totalLabel: '600 FS', totalColor: '#22c55e',
    endsIn: Date.now() + (3 * 86400 + 6 * 3600 + 29 * 60 + 7) * 1000,
    btnColor: 'blue', active: true,
  },
  {
    id: 3, badge: 'vip', badgeLabel: 'VIP',
    title: 'VIP Exclusive Giveaway', titleKey: 'gw3_title', sub: 'Diamond & Platinum members only', subKey: 'gw3_sub',
    participants: 48, slides: ['👑', '💎', '🏆'], prize: 'Gold Dragon', prizeKey: 'gw3_prize', prizeLabel: '500 ₱',
    prizeColor: 'gold', totalPrizes: 10, totalLabel: '5,000 ₱', totalColor: 'var(--gold)',
    endsIn: Date.now() + (1 * 86400 + 12 * 3600 + 0 * 60 + 0) * 1000,
    btnColor: 'gold', active: true,
  },
  {
    id: 4, badge: 'limited', badgeLabel: 'LIMITED',
    title: 'Weekend Flash Giveaway', titleKey: 'gw4_title', sub: 'First 50 participants only!', subKey: 'gw4_sub',
    participants: 38, slides: ['🎯', '🎲', '🎳'], prize: 'Jackpot Spins', prizeKey: 'gw4_prize', prizeLabel: '25 FS',
    prizeColor: 'purple', totalPrizes: 50, totalLabel: '1,250 FS', totalColor: '#a855f7',
    endsIn: Date.now() + (0 * 86400 + 4 * 3600 + 15 * 60 + 30) * 1000,
    btnColor: 'red', active: true,
  },
];

const BADGE_CLASS = { exclusive: 'gw-badge-exclusive', free: 'gw-badge-free', vip: 'gw-badge-vip', limited: 'gw-badge-limited' };
const pad = (n) => String(n).padStart(2, '0');

function GWCard({ g, openModal }) {
  const [slide, setSlide] = useState(0);
  const [diff, setDiff] = useState(() => Math.max(0, g.endsIn - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const d = Math.max(0, g.endsIn - Date.now());
      setDiff(d);
      if (d === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [g.endsIn]);

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const goDir = (dir) => setSlide((cur) => (cur + dir + g.slides.length) % g.slides.length);

  return (
    <div className="gw-card">
      <div className="gw-card-head">
        <div className="gw-card-info">
          <div className={`gw-card-badge ${BADGE_CLASS[g.badge] || 'gw-badge-free'}`} data-i18n={`gw_badge_${g.badge}`}>{g.badgeLabel}</div>
          <div className="gw-card-title" data-i18n={g.titleKey || ''}>{g.title}</div>
          <div className="gw-card-sub" data-i18n={g.subKey || ''}>{g.sub}</div>
        </div>
        <div className="gw-participants">{g.participants}</div>
      </div>
      <div className="gw-carousel">
        <div className="gw-carousel-slides" id={`gw-slides-${g.id}`} style={{ transform: `translateX(-${slide * 100}%)` }}>
          {g.slides.map((sl, i) => (
            <div key={i} className="gw-carousel-slide" style={{ background: 'var(--bg3)' }}>{sl}</div>
          ))}
        </div>
        <button className="gw-carousel-arrow left" onClick={() => goDir(-1)}>‹</button>
        <button className="gw-carousel-arrow right" onClick={() => goDir(1)}>›</button>
        <div className="gw-carousel-dots">
          {g.slides.map((_, i) => (
            <button key={i} className={`gw-cdot ${i === slide ? 'active' : ''}`} onClick={() => setSlide(i)}></button>
          ))}
        </div>
      </div>
      <div className="gw-prize-row">
        <div className="gw-prize-name" data-i18n={g.prizeKey || ''}>{g.prize}</div>
        <div className={`gw-prize-badge ${g.prizeColor}`}>{g.prizeLabel}</div>
      </div>
      <div className="gw-total-row">
        <div className="gw-total-label"><span data-i18n="gw_total_word">Total</span> <span>{g.totalPrizes} <span data-i18n="gw_prizes">prizes</span></span></div>
        <div className="gw-total-prize" style={{ background: g.totalColor, color: g.totalColor === 'var(--gold)' ? '#06091a' : '#fff' }}>{g.totalLabel}</div>
      </div>
      <div className="gw-countdown" id={`gw-cd-${g.id}`}>
        <div className="gw-countdown-unit"><div className="gw-countdown-num" id={`gw-d-${g.id}`}>{pad(d)}</div><div className="gw-countdown-label" data-i18n="misc_days">Days</div></div>
        <div className="gw-countdown-unit"><div className="gw-countdown-num" id={`gw-h-${g.id}`}>{pad(h)}</div><div className="gw-countdown-label" data-i18n="misc_hours">Hours</div></div>
        <div className="gw-countdown-unit"><div className="gw-countdown-num" id={`gw-m-${g.id}`}>{pad(m)}</div><div className="gw-countdown-label" data-i18n="misc_minutes">Minutes</div></div>
        <div className="gw-countdown-unit"><div className="gw-countdown-num" id={`gw-s-${g.id}`}>{pad(s)}</div><div className="gw-countdown-label" data-i18n="misc_seconds">Seconds</div></div>
      </div>
      <button className={`gw-take-btn ${g.btnColor}`} onClick={() => openModal('register')} data-i18n="gw_take">TAKE PART</button>
    </div>
  );
}

export default function Giveaways() {
  const go = useSectionNav();
  const { openModal } = useUI();
  const [tab, setTab] = useState('active');

  const activeData = useMemo(() => GW_DATA.filter((g) => g.active), []);
  const total = tab === 'archive' ? 0 : activeData.length;

  return (
    <div id="view-giveaways">
      <div className="gw-page">

        {/* Top bar */}
        <div className="gw-topbar">
          <button className="gw-back-btn" onClick={() => go('lobby')} data-i18n="gw_back">← BACK</button>
          <div className="gw-page-title" data-i18n="gw_title">GIVEAWAYS</div>
          <div className="gw-active-archive seg-tabs">
            <button className={`gw-aa-btn ${tab === 'active' ? 'active' : ''}`} id="gw-active-btn" onClick={() => setTab('active')} data-i18n="misc_active">Active</button>
            <button className={`gw-aa-btn ${tab === 'archive' ? 'active' : ''}`} id="gw-archive-btn" onClick={() => setTab('archive')} data-i18n="misc_archive">Archive</button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="gw-filterbar">
          <div className="gw-total"><span data-i18n="gw_total">Total:</span> <span id="gw-total-count">{total}</span></div>
          <div className="gw-filter-select" data-i18n="gw_price">⚖ Price: Default ▾</div>
          <div className="gw-filter-select" data-i18n="gw_type">▼ Type: All ▾</div>
          <label className="gw-check-label"><input type="checkbox" /> <span data-i18n="gw_my_part">My participation</span></label>
          <label className="gw-check-label"><input type="checkbox" /> <span data-i18n="gw_part_limit">Participants limit</span></label>
        </div>

        {/* Cards grid */}
        <div className="gw-grid" id="gw-grid">
          {tab === 'archive' ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '15px' }}>No archived giveaways yet.</div>
          ) : (
            activeData.map((g) => <GWCard key={g.id} g={g} openModal={openModal} />)
          )}
        </div>

      </div>
    </div>
  );
}
