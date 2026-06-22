import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import useSectionNav from '../hooks/useSectionNav';
import api from '../services/api';

const VALID_PROMO_CODES = ['WELCOME100', 'LEGOX', 'VIP500', 'FREESPIN55'];

// Which section IDs are visible for each filter tab.
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

  const visible = SHOW_MAP[activeTab] || SHOW_MAP.all;
  const show = (id) => (visible.includes(id) ? {} : { display: 'none' });

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

  const openPromoDetail = () => openModal('promo');

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
          <div className="promo-filter-title">Promotions</div>
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

        {/* WELCOME BONUS HERO CARD */}
        <div id="promo-section-welcome" style={show('welcome')}>
          <div className="welcome-hero-card">
            <div className="welcome-hero-left">
              <span className="welcome-hero-activated" data-i18n="promo_activated">ACTIVATED</span>
              <div className="welcome-hero-title" data-i18n="promo_welcome">WELCOME BONUS</div>
              <div className="welcome-hero-amounts">500% UP TO ₱19,850<br />+200 FREE SPINS</div>
            </div>
            <div className="welcome-hero-tiers">
              {/* Tier 1 */}
              <div className="wh-tier active">
                <div className="wh-tier-top">
                  <span className="wh-tier-status green">ACTIVATED</span>
                  <span className="wh-tier-num">#1</span>
                </div>
                <div className="wh-tier-icon">🪙</div>
                <div className="wh-tier-pct">125%</div>
                <div className="wh-tier-detail">UP TO ₱3,970+100FS</div>
                <button className="wh-tier-btn primary" onClick={() => openModal('deposit')}>DEPOSIT</button>
                <button className="wh-tier-info">ℹ</button>
              </div>
              {/* Tier 2 */}
              <div className="wh-tier">
                <div className="wh-tier-top">
                  <span className="wh-tier-status gray">⏳ NOT STARTED</span>
                  <span className="wh-tier-num">#2</span>
                </div>
                <div className="wh-tier-icon">💰</div>
                <div className="wh-tier-pct">100%</div>
                <div className="wh-tier-detail">UP TO ₱1,980+25FS</div>
                <button className="wh-tier-btn" onClick={() => openModal('deposit')} data-i18n="promo_discover">DISCOVER</button>
              </div>
              {/* Tier 3 */}
              <div className="wh-tier">
                <div className="wh-tier-top">
                  <span className="wh-tier-status gray">⏳ NOT STARTED</span>
                  <span className="wh-tier-num">#3</span>
                </div>
                <div className="wh-tier-icon">🧰</div>
                <div className="wh-tier-pct">75%</div>
                <div className="wh-tier-detail">UP TO ₱5,950+50FS</div>
                <button className="wh-tier-btn" onClick={() => openModal('deposit')}>DISCOVER</button>
              </div>
              {/* Tier 4 */}
              <div className="wh-tier">
                <div className="wh-tier-top">
                  <span className="wh-tier-status gray">⏳ NOT STARTED</span>
                  <span className="wh-tier-num">#4</span>
                </div>
                <div className="wh-tier-icon">👑</div>
                <div className="wh-tier-pct">200%</div>
                <div className="wh-tier-detail">UP TO ₱7,940+25FS</div>
                <button className="wh-tier-btn" onClick={() => openModal('deposit')}>DISCOVER</button>
              </div>
            </div>
          </div>
        </div>{/* /promo-section-welcome */}

        {/* BONUSES SECTION */}
        <div id="promo-section-bonuses" style={show('bonuses')}>
          <div className="promo-sub-title" data-i18n="promo_bonuses">BONUSES</div>
          <div className="promo-bonus-grid" id="promo-bonus-grid">

            {/* Live promotions configured in the admin panel */}
            {apiPromos.map((p, i) => (
              <div
                className={'pb-card' + (i === 0 ? ' highlighted' : '')}
                key={p.id ?? 'api-' + i}
                onClick={openPromoDetail}
              >
                {p.image && <img src={p.image} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 10, display: 'block' }} />}
                {p.bonus && <div className="pb-deco">{p.bonus}</div>}
                <div className="pb-title">{p.title}</div>
                {p.description && <div className="pb-detail">{String(p.description).split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</div>}
                {p.buttonText && <button className="wh-tier-btn primary" style={{ marginTop: 10 }}>{p.buttonText}</button>}
              </div>
            ))}

            <div className="pb-card highlighted" onClick={openPromoDetail}>
              <span className="pb-status awaits">AWAITS DEPOSIT</span>
              <div className="pb-deco">125%</div>
              <div className="pb-title">1ST DEPOSIT BONUS</div>
              <div className="pb-detail">125% UP TO ₱3,970<br />+100 FREE SPINS</div>
            </div>

            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">100%</div>
              <div className="pb-title">2ND DEPOSIT BONUS</div>
              <div className="pb-detail">100% UP TO ₱1,980<br />+25 FREE SPINS</div>
            </div>

            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">75%</div>
              <div className="pb-title">3RD DEPOSIT BONUS</div>
              <div className="pb-detail">75% UP TO ₱5,950<br />+50 FREE SPINS</div>
            </div>

            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">200%</div>
              <div className="pb-title">4TH DEPOSIT BONUS</div>
              <div className="pb-detail">200% UP TO ₱7,940<br />+25 FREE SPINS</div>
            </div>

            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">50%</div>
              <div className="pb-title" data-i18n="promo_weekend">WEEKEND RELOAD</div>
              <div className="pb-detail">50% UP TO ₱5,000<br />+55 FREE SPINS</div>
            </div>

            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">10%</div>
              <div className="pb-title" data-i18n="promo_cashback">WEEKLY CASHBACK</div>
              <div className="pb-detail">10% CASHBACK<br />EVERY WEEK</div>
            </div>

          </div>
        </div>{/* /promo-section-bonuses */}

        {/* RELOAD BONUSES */}
        <div id="promo-section-reload" style={show('reload')}>
          <div className="promo-sub-title" data-i18n="promo_reload">RELOAD BONUSES</div>
          <div className="promo-bonus-grid">
            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">50%</div>
              <div className="pb-title" data-i18n="promo_monday">MONDAY RELOAD</div>
              <div className="pb-detail">50% UP TO ₱3,000<br />+30 FREE SPINS</div>
            </div>
            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">30%</div>
              <div className="pb-title" data-i18n="promo_daily">DAILY RELOAD</div>
              <div className="pb-detail">30% UP TO ₱2,000<br />EVERY DAY</div>
            </div>
            <div className="pb-card" onClick={openPromoDetail}>
              <div className="pb-deco">75%</div>
              <div className="pb-title" data-i18n="promo_weekend_special">WEEKEND SPECIAL</div>
              <div className="pb-detail">75% UP TO ₱8,000<br />SAT &amp; SUN ONLY</div>
            </div>
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
