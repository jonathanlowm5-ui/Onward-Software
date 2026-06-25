import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import useSectionNav from '../hooks/useSectionNav';
import { resolvePromoBanner } from '../utils/promoTerms';
import api from '../services/api';
// Uploaded welcome-tier icons (coin → bag → chest → crown).
import wStep1 from '../assets/welcome/welcome-step1.avif';
import wStep2 from '../assets/welcome/welcome-step2.avif';
import wStep3 from '../assets/welcome/welcome-step3.avif';
import wStep4 from '../assets/welcome/welcome-step4.avif';

const VALID_PROMO_CODES = ['WELCOME100', 'LEGOX', 'VIP500', 'FREESPIN55'];

// Built-in showcase promotions (shown when/while the admin hasn't created its
// own). Each carries full detail so the detail modal can render it properly.
const SHOWCASE_BONUSES = [
  { deco: '125%', title: '1ST DEPOSIT BONUS', lines: ['125% UP TO ₱3,970', '+100 FREE SPINS'], status: 'AWAITS DEPOSIT', highlighted: true,
    bonus: '125%', maxBonus: '₱3,970', minDeposit: '₱500', wager: '30x', turnover: '0x', type: 'deposit',
    description: 'Kick off your journey with a 125% match on your first deposit plus 100 free spins on selected slots.' },
  { deco: '100%', title: '2ND DEPOSIT BONUS', lines: ['100% UP TO ₱1,980', '+25 FREE SPINS'],
    bonus: '100%', maxBonus: '₱1,980', minDeposit: '₱500', wager: '30x', turnover: '0x', type: 'deposit',
    description: 'Top up again and get a 100% match up to ₱1,980 with 25 bonus spins.' },
  { deco: '75%', title: '3RD DEPOSIT BONUS', lines: ['75% UP TO ₱5,950', '+50 FREE SPINS'],
    bonus: '75%', maxBonus: '₱5,950', minDeposit: '₱500', wager: '35x', turnover: '0x', type: 'deposit',
    description: 'Your third deposit earns a 75% boost up to ₱5,950 and 50 free spins.' },
  { deco: '200%', title: '4TH DEPOSIT BONUS', lines: ['200% UP TO ₱7,940', '+25 FREE SPINS'],
    bonus: '200%', maxBonus: '₱7,940', minDeposit: '₱1,000', wager: '40x', turnover: '0x', type: 'deposit',
    description: 'Finish the welcome series strong with a massive 200% match up to ₱7,940.' },
  { deco: '50%', title: 'WEEKEND RELOAD', i18nKey: 'promo_weekend', lines: ['50% UP TO ₱5,000', '+55 FREE SPINS'],
    bonus: '50%', maxBonus: '₱5,000', minDeposit: '₱500', wager: '25x', turnover: '0x', type: 'deposit',
    description: 'Reload every weekend for a 50% bonus up to ₱5,000 plus 55 free spins.' },
  { deco: '10%', title: 'WEEKLY CASHBACK', i18nKey: 'promo_cashback', lines: ['10% CASHBACK', 'EVERY WEEK'],
    bonus: '10%', maxBonus: '₱20,000', minDeposit: '₱0', wager: '5x', turnover: '0x', type: 'cashback',
    description: 'Get 10% cashback on your net losses every week — credited automatically.' },
];

const SHOWCASE_RELOAD = [
  { deco: '50%', title: 'MONDAY RELOAD', i18nKey: 'promo_monday', lines: ['50% UP TO ₱3,000', '+30 FREE SPINS'],
    bonus: '50%', maxBonus: '₱3,000', minDeposit: '₱300', wager: '30x', turnover: '0x', type: 'deposit',
    description: 'Beat the Monday blues with a 50% reload up to ₱3,000 and 30 free spins.' },
  { deco: '30%', title: 'DAILY RELOAD', i18nKey: 'promo_daily', lines: ['30% UP TO ₱2,000', 'EVERY DAY'],
    bonus: '30%', maxBonus: '₱2,000', minDeposit: '₱200', wager: '25x', turnover: '0x', type: 'deposit',
    description: 'A 30% reload bonus available every single day, up to ₱2,000.' },
  { deco: '75%', title: 'WEEKEND SPECIAL', i18nKey: 'promo_weekend_special', lines: ['75% UP TO ₱8,000', 'SAT & SUN ONLY'],
    bonus: '75%', maxBonus: '₱8,000', minDeposit: '₱500', wager: '35x', turnover: '0x', type: 'deposit',
    description: 'A special 75% weekend reload up to ₱8,000 — Saturdays and Sundays only.' },
];

// Which section IDs are visible for each filter tab.
const WELCOME_TIERS = [
  { icon: '🪙', img: wStep1, pct: '125%', detail: 'UP TO ₱3,970+100FS' },
  { icon: '💰', img: wStep2, pct: '100%', detail: 'UP TO ₱1,980+25FS' },
  { icon: '🧰', img: wStep3, pct: '75%', detail: 'UP TO ₱5,950+50FS' },
  { icon: '👑', img: wStep4, pct: '200%', detail: 'UP TO ₱7,940+25FS' },
];

const SHOW_MAP = {
  all: ['welcome', 'bonuses', 'reload', 'tournaments'],
  bonuses: ['welcome', 'bonuses'],
  reload: ['reload'],
  tournaments: ['tournaments'],
  soon: ['soon'],
  drafts: ['drafts'],
};

export default function Promotions() {
  const { openModal, toast } = useUI();
  const { profile, isLoggedIn, refreshProfile } = useAuth();
  const go = useSectionNav();
  const [promoCode, setPromoCode] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Live promotions created in the admin panel (backend-driven). Only real
  // server records are shown here — when none exist the built-in showcase below
  // remains as-is.
  const [apiPromos, setApiPromos] = useState([]);
  useEffect(() => {
    let alive = true;
    api.get('/promotions?active=1')
      .then((r) => { if (alive && Array.isArray(r.data)) setApiPromos(r.data); })
      .catch(() => { /* keep the built-in showcase if the API is unreachable */ });
    return () => { alive = false; };
  }, []);

  // Region targeting is now a LABEL, not a filter: every player sees all
  // promotions (so nothing ever silently disappears), but those matching the
  // player's currency/country are shown first and region-specific ones carry a
  // 🌏 badge.
  const viewerCur = profile?.currency;
  const viewerCountry = profile?.country;
  const matchesViewer = (p) =>
    (!p.currency || !viewerCur || p.currency === viewerCur) &&
    (!p.country || !viewerCountry || p.country === viewerCountry);
  const visiblePromos = [...apiPromos].sort((a, b) => (matchesViewer(b) ? 1 : 0) - (matchesViewer(a) ? 1 : 0));

  const visible = SHOW_MAP[activeTab] || SHOW_MAP.all;
  const show = (id) => (visible.includes(id) ? {} : { display: 'none' });

  // Welcome card: a promotion with type "welcome" supplies the card photo
  // (admin-editable). Each player claims the 4 tiers; once all 4 are claimed
  // the whole card is hidden for that player.
  const welcomePromo = visiblePromos.find((p) => String(p.type || '').toLowerCase() === 'welcome');
  const welcomeImg = welcomePromo ? resolvePromoBanner(welcomePromo, viewerCur) : '';
  const welcomeClaimed = Math.max(0, Number(profile?.welcomeClaimed || 0));
  const welcomeDone = isLoggedIn && welcomeClaimed >= WELCOME_TIERS.length;
  const claimWelcome = async (i) => {
    if (i !== welcomeClaimed) return;                 // only the active tier
    if (!isLoggedIn) { openModal('login'); return; }   // guests log in first
    try {
      await api.post('/player/welcome/claim');
      await refreshProfile?.();
    } catch (e) {
      toast('❌ Could not claim: ' + (e?.response?.data?.error || e?.message || 'try again'), 'error');
      return; // don't advance to deposit on a failed claim
    }
    openModal('deposit');
  };

  function activatePromoCode() {
    const val = promoCode.trim();
    if (!val) {
      toast('Please enter a promocode', 'error');
      return;
    }
    if (VALID_PROMO_CODES.includes(val.toUpperCase())) {
      toast('🎉 Promocode activated! Your bonus has been added.', 'success');
      setPromoCode('');
    } else {
      toast('❌ Invalid promocode. Please try again.', 'error');
    }
  }

  const openPromoDetail = (promo) => openModal('promo', promo || null);

  return (
    <div id="view-promos">

      {/* PROMO CODE BAR */}
      <div className="promo-code-bar">
        <div className="promo-code-img">🎟️</div>
        <div className="promo-code-text">
          <div className="promo-code-title" data-i18n="promo_have_code">Have a Special Promocode?</div>
          <div className="promo-code-sub" data-i18n="promo_activate_bonus">Activate Exclusive Bonus</div>
        </div>
        <div className="promo-code-input-wrap">
          <span className="promo-code-icon">🎫</span>
          <input
            type="text"
            id="promo-code-input"
            placeholder="Enter promocode"
            className="promo-code-input"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
        </div>
        <button className="promo-code-btn" onClick={activatePromoCode} data-i18n="ui_activate">ACTIVATE</button>
        <button className="promo-code-help">?</button>
      </div>

      {/* FILTER TABS */}
      <div className="promo-page-wrap">
        <div className="promo-filter-row">
          <div className="promo-filter-title">
            Promotions
            {profile && (viewerCountry || viewerCur) && (
              <span className="promo-region-chip">🌏 {[viewerCountry, viewerCur].filter(Boolean).join(' · ')}</span>
            )}
          </div>
          <div className="promo-filter-tabs">
            <button
              className={`promo-ftab${activeTab === 'all' ? ' active' : ''}`}
              onClick={() => setActiveTab('all')}
              data-i18n="promo_all"
            >All</button>
            <button
              className={`promo-ftab${activeTab === 'bonuses' ? ' active' : ''}`}
              onClick={() => setActiveTab('bonuses')}
            >Bonuses <span className="promo-ftab-badge">4</span></button>
            <button
              className={`promo-ftab${activeTab === 'reload' ? ' active' : ''}`}
              onClick={() => setActiveTab('reload')}
            >Reload Bonuses <span className="promo-ftab-badge">3</span></button>
            <button
              className={`promo-ftab${activeTab === 'tournaments' ? ' active' : ''}`}
              onClick={() => setActiveTab('tournaments')}
            >Tournaments <span className="promo-ftab-badge">5</span></button>
            <button
              className={`promo-ftab${activeTab === 'soon' ? ' active' : ''}`}
              onClick={() => setActiveTab('soon')}
            >Coming soon <span className="promo-ftab-badge red">1</span></button>
            <button
              className={`promo-ftab${activeTab === 'drafts' ? ' active' : ''}`}
              onClick={() => setActiveTab('drafts')}
            >Drafts queue <span className="promo-ftab-badge red">1</span></button>
          </div>
        </div>

        {/* WELCOME BONUS HERO CARD — hidden once the player claims all 4 tiers */}
        {!welcomeDone && (
        <div id="promo-section-welcome" style={show('welcome')}>
          <div className="welcome-hero-card">
            <div className="welcome-hero-left">
              {welcomeImg
                ? <img src={welcomeImg} alt="Welcome Bonus" className="welcome-hero-img" />
                : (
                  <>
                    <span className="welcome-hero-activated" data-i18n="promo_activated">ACTIVATED</span>
                    <div className="welcome-hero-title" data-i18n="promo_welcome">WELCOME BONUS</div>
                    <div className="welcome-hero-amounts">500% UP TO ₱19,850<br />+200 FREE SPINS</div>
                  </>
                )}
            </div>
            <div className="welcome-hero-tiers">
              {WELCOME_TIERS.map((t, i) => {
                const claimed = isLoggedIn && i < welcomeClaimed;
                const active = !isLoggedIn ? i === 0 : i === welcomeClaimed;
                return (
                  <div className={'wh-tier' + (active ? ' active' : '')} key={i}>
                    <div className="wh-tier-top">
                      <span className={'wh-tier-status ' + (claimed || active ? 'green' : 'gray')}>
                        {claimed ? '✔ CLAIMED' : active ? 'ACTIVATED' : '⏳ NOT STARTED'}
                      </span>
                      <span className="wh-tier-num">#{i + 1}</span>
                    </div>
                    <div className="wh-tier-icon">{t.img ? <img src={t.img} alt="" className="wh-tier-img" /> : t.icon}</div>
                    <div className="wh-tier-pct">{t.pct}</div>
                    <div className="wh-tier-detail">{t.detail}</div>
                    {claimed
                      ? <button className="wh-tier-btn" disabled style={{ opacity: 0.6, cursor: 'default' }}>CLAIMED</button>
                      : active
                        ? <button className="wh-tier-btn primary" onClick={() => claimWelcome(i)}>{isLoggedIn ? 'DEPOSIT' : 'CLAIM'}</button>
                        : <button className="wh-tier-btn" onClick={() => openPromoDetail(SHOWCASE_BONUSES[i])}>DISCOVER</button>}
                    {active && SHOWCASE_BONUSES[i] && <button className="wh-tier-info" onClick={() => openPromoDetail(SHOWCASE_BONUSES[i])}>ℹ</button>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}{/* /promo-section-welcome */}

        {/* BONUSES SECTION */}
        <div id="promo-section-bonuses" style={show('bonuses')}>
          <div className="promo-sub-title" data-i18n="promo_bonuses">BONUSES</div>
          <div className="promo-bonus-grid" id="promo-bonus-grid">

            {/* Live promotions configured in the admin panel (region-targeted) */}
            {visiblePromos.map((p, i) => (
              <div
                className={'pb-card' + (i === 0 ? ' highlighted' : '')}
                key={p.id ?? 'api-' + i}
                onClick={() => openPromoDetail(p)}
              >
                {(p.country || p.currency) && (
                  <span className="pb-region">🌏 {[p.country, p.currency].filter(Boolean).join(' · ')}</span>
                )}
                {resolvePromoBanner(p, viewerCur) && <img src={resolvePromoBanner(p, viewerCur)} alt="" className="pb-banner" />}
                {p.bonus && <div className="pb-deco">{p.bonus}</div>}
                <div className="pb-title">{p.title}</div>
                {p.description && <div className="pb-detail">{String(p.description).split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</div>}
                <button className="wh-tier-btn primary" style={{ marginTop: 12, width: '100%' }}>{p.buttonText || 'Claim now'}</button>
              </div>
            ))}

            {/* Built-in showcase bonuses */}
            {SHOWCASE_BONUSES.map((p, i) => (
              <div className={'pb-card' + (p.highlighted ? ' highlighted' : '')} key={'bonus-' + i} onClick={() => openPromoDetail(p)}>
                {p.status && <span className="pb-status awaits">{p.status}</span>}
                <div className="pb-deco">{p.deco}</div>
                <div className="pb-title" {...(p.i18nKey ? { 'data-i18n': p.i18nKey } : {})}>{p.title}</div>
                <div className="pb-detail">{p.lines.map((l, j) => <span key={j}>{l}<br /></span>)}</div>
                <button className="wh-tier-btn primary" style={{ marginTop: 12, width: '100%' }}>Claim now</button>
              </div>
            ))}

          </div>
        </div>{/* /promo-section-bonuses */}

        {/* RELOAD BONUSES */}
        <div id="promo-section-reload" style={show('reload')}>
          <div className="promo-sub-title" data-i18n="promo_reload">RELOAD BONUSES</div>
          <div className="promo-bonus-grid">
            {SHOWCASE_RELOAD.map((p, i) => (
              <div className="pb-card" key={'reload-' + i} onClick={() => openPromoDetail(p)}>
                <div className="pb-deco">{p.deco}</div>
                <div className="pb-title" {...(p.i18nKey ? { 'data-i18n': p.i18nKey } : {})}>{p.title}</div>
                <div className="pb-detail">{p.lines.map((l, j) => <span key={j}>{l}<br /></span>)}</div>
                <button className="wh-tier-btn primary" style={{ marginTop: 12, width: '100%' }}>Claim now</button>
              </div>
            ))}
          </div>
        </div>{/* /promo-section-reload */}

        {/* TOURNAMENTS */}
        <div id="promo-section-tournaments" style={show('tournaments')}>
          <div className="promo-sub-title">TOURNAMENTS</div>
          <div className="tourn-grid">

            {/* Pixel Rush */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#1a0a5e 0%,#2d1280 40%,#0d47a1 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge"><span className="tourn-badge-icon">🕐</span> 6 DAYS LEFT</div>
              <div className="tourn-content">
                <div className="tourn-title">PIXEL RUSH</div>
                <div className="tourn-duration">During time: 21 days</div>
                <div className="tourn-prizes" style={{ marginTop: '8px' }}>
                  <div className="tourn-prize-pill">799.57K ₱</div>
                  <div className="tourn-prize-pill fs">2000 FS</div>
                </div>
              </div>
            </div>

            {/* Fast Tournament #3 */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#8b0000 0%,#c0152a 50%,#a31c29 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge"><span className="tourn-badge-icon">🕐</span> 01:51:15 LEFT</div>
              <div className="tourn-content">
                <div className="tourn-title">FAST TOURNAMENT #3</div>
                <div className="tourn-duration">During time: 2 hours</div>
                <div className="tourn-prizes" style={{ marginTop: '8px' }}>
                  <div className="tourn-prize-pill">18.45K ₱</div>
                </div>
              </div>
            </div>

            {/* Lucky Races */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#6d0020 0%,#8b0000 50%,#5a0010 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge">01.05.2026 – 07.01.2027</div>
              <div className="tourn-provider">3 OAKS</div>
              <div className="tourn-content">
                <div className="tourn-title">Lucky Races by 3 Oaks Gaming</div>
                <div className="tourn-desc">Play daily tournaments and trigger Lucky Drops to win a share of 151,000 EUR plus extra rewards.</div>
                <div className="tourn-prizes">
                  <div className="tourn-prize-pill euro">€2,500,000</div>
                </div>
              </div>
            </div>

            {/* Drops & Wins */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#0a1a0a 0%,#1a2a10 50%,#243018 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge">04.03.2026 – 03.03.2027</div>
              <div className="tourn-provider">PRAGMATIC PLAY</div>
              <div className="tourn-content">
                <div className="tourn-title">Drops &amp; Wins by Pragmatic Play</div>
                <div className="tourn-desc">Total Prize Pool: 25,000,000 EUR</div>
              </div>
            </div>

            {/* Spin Express */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#0a1428 0%,#1a2840 50%,#243050 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge">01.01.2026 – 03.01.2027</div>
              <div className="tourn-provider">GAMZIX</div>
              <div className="tourn-content">
                <div className="tourn-title">Spin Express by Gamzix</div>
                <div className="tourn-desc">Total yearly prize pool: 1,000,000 EUR</div>
              </div>
            </div>

            {/* Platipus Network */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#2a0a00 0%,#4a1500 50%,#6a2800 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge">29.01.2026 – 19.09.2026</div>
              <div className="tourn-provider">Platipus</div>
              <div className="tourn-content">
                <div className="tourn-title">Platipus Network Tournament</div>
                <div className="tourn-desc">Total Prize Pool: 125,000 EUR</div>
              </div>
            </div>

            {/* BGaming Millions */}
            <div className="tourn-card" onClick={() => go('tournaments')} style={{ minHeight: '200px' }}>
              <div className="tourn-card-bg" style={{ background: 'linear-gradient(135deg,#4a0080 0%,#7c00c0 50%,#9c10d0 100%)' }}></div>
              <div className="tourn-card-overlay"></div>
              <div className="tourn-badge">01.01.2026 – 01.01.2027</div>
              <div className="tourn-content">
                <div className="tourn-title">BGaming Millions of Drops</div>
                <div className="tourn-desc">€1,000,000 — 77k+ prizes</div>
              </div>
            </div>

          </div>
        </div>{/* /promo-section-tournaments */}

        {/* COMING SOON placeholder */}
        <div id="promo-section-soon" style={show('soon')}>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '56px', marginBottom: '14px' }}>🔜</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }} data-i18n="promo_coming_soon">Coming Soon</div>
            <div style={{ fontSize: '14px' }} data-i18n="promo_coming_soon_desc">New promotions are on their way. Stay tuned!</div>
          </div>
        </div>

        {/* DRAFTS placeholder */}
        <div id="promo-section-drafts" style={show('drafts')}>
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '56px', marginBottom: '14px' }}>📝</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }} data-i18n="promo_drafts">Drafts Queue</div>
            <div style={{ fontSize: '14px' }} data-i18n="promo_drafts_desc">Promotions pending review will appear here.</div>
          </div>
        </div>

      </div>
    </div>
  );
}
