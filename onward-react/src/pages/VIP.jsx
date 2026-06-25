// VIP page — faithful conversion of the original #view-vip markup + interactions.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';
import usePageBanner from '../hooks/usePageBanner';
import useSectionNav from '../hooks/useSectionNav';
import api from '../services/api';

// ---- Default theme (used until the admin-configured tiers load) ----
const DEFAULT_VIP_LEVELS = [
  { lvl: 1, c: '#cd7f32', cl: '#e3a565', cd: '#9c5e20', rgb: '205,127,50', rb: '1%' },
  { lvl: 2, c: '#c0c8d0', cl: '#e6ecf2', cd: '#8b929b', rgb: '192,200,208', rb: '1.5%' },
  { lvl: 3, c: '#f0c040', cl: '#fbe08a', cd: '#c9971a', rgb: '240,192,64', rb: '2%' },
  { lvl: 4, c: '#34c759', cl: '#7ee59a', cd: '#1f8f3e', rgb: '52,199,89', rb: '2.5%' },
  { lvl: 5, c: '#1ab5b5', cl: '#5fe0e0', cd: '#0f8585', rgb: '26,181,181', rb: '3%' },
  { lvl: 6, c: '#3b82f6', cl: '#7dabff', cd: '#2360c8', rgb: '59,130,246', rb: '4%' },
  { lvl: 7, c: '#a855f7', cl: '#c89bff', cd: '#7d34c8', rgb: '168,85,247', rb: '5%' },
  { lvl: 8, c: '#ec4899', cl: '#f888bf', cd: '#bd2e74', rgb: '236,72,153', rb: '6%' },
  { lvl: 9, c: '#ef4444', cl: '#f88080', cd: '#c22e2e', rgb: '239,68,68', rb: '8%' },
  { lvl: 10, c: '#5ad1ed', cl: '#a8eeff', cd: '#22b8d4', rgb: '90,209,237', rb: '10%' },
];

// Map an admin VIP tier (from /api/vip/tiers) into the shape this page renders.
function tierToLevel(t, i) {
  const def = DEFAULT_VIP_LEVELS[i] || DEFAULT_VIP_LEVELS[0];
  return {
    lvl: t.lv ?? def.lvl,
    c: t.c || def.c,
    cl: t.cl || def.cl,
    cd: t.cd || def.cd,
    rgb: t.rgb || def.rgb,
    rb: t.rake || def.rb,        // rakeback chip on the card
    name: t.n || '',             // admin-configured tier name
    ic: t.ic || '',              // emoji icon
    icImg: t.icImg || '',        // uploaded icon picture (Firebase Storage)
    bonus: Number(t.bonus) || 0, // claimable level bonus
  };
}

const VIP_FAQ = [
  { q: 'Why should I become a VIP on Onward?', a: 'VIP members enjoy exclusive benefits including higher cashback rates, personal account managers, special bonuses, and access to exclusive giveaways and tournaments.' },
  { q: 'How do I increase my rank?', a: 'Your rank increases based on your total wagered amount. Place bets on any game to accumulate wager points and level up through the rank system.' },
  { q: 'What is a Rakeback?', a: 'Rakeback is a percentage of your total wager returned to you regardless of wins or losses. It is credited automatically and has no wagering requirements.' },
  { q: 'What is a Cashback?', a: 'Cashback is a percentage of your net losses returned to your balance. Different tiers offer Daily, Weekly, and Monthly cashback with increasing percentages.' },
  { q: 'When are different types of Cashback scheduled for?', a: 'Daily cashback is credited every day at midnight UTC. Weekly cashback is credited every Monday. Monthly cashback is credited on the 1st of each month.' },
  { q: 'When is Rakeback payed out?', a: 'Rakeback is calculated and paid out in real time as you place bets. You can see your accumulated rakeback in your account dashboard.' },
  { q: 'When do I become a VIP player?', a: 'You become a VIP player either by reaching level 25 through regular play, or by applying for a VIP transfer if you hold VIP status at another casino.' },
  { q: 'What are the minimum and maximum amount of Cashback or Rakeback I can claim?', a: 'The minimum cashback claim is ₱10. There is no maximum limit — larger players receive proportionally larger cashback and rakeback amounts.' },
  { q: 'Which games are available for VIP Club wagering?', a: 'All games on Onward contribute to VIP Club wagering, including slots, live casino games, sports betting, and crash games.' },
  { q: 'Which bets are eligible to participate in the VIP club?', a: 'All real money bets placed with your main balance count toward VIP Club progression. Bets made with bonus funds may have reduced contribution rates.' },
];

const VIP_BENEFITS = [
  { name: 'Upgrade Bonus', icon: '🪙', minLevel: 1, amts: [100, 200, 300, 500, 800, 1200, 1800, 2500, 3500, 5000] },
  { name: 'Birthday Bonus', icon: '🎂', minLevel: 6, amts: [0, 0, 0, 0, 0, 1000, 1500, 2000, 3000, 5000] },
  { name: 'Month Bonus', icon: '🧧', minLevel: 9, amts: [0, 0, 0, 0, 0, 0, 0, 0, 2000, 3000] },
  { name: 'Weekly Aid Bonus', icon: '💎', minLevel: 3, amts: [0, 0, 200, 300, 400, 600, 800, 1000, 1500, 2000] },
];

const PLAYER_VIP_LEVEL = 1; // the level the player has achieved (default VIP 1)

// English vt() equivalents (the original uses per-language tables; defaults to en)
const T = {
  ribbon: 'Current Level', yourLevel: 'Your Level', level: 'Level', rakeback: 'Rakeback',
  deposit: 'Deposit', points: 'VIP Points', max: 'MAX',
  benefits: 'Benefits', claim: 'Claim', insufficient: 'Insufficient Level',
  depMore: (n, lvl) => `Deposit ${n} PHP more to ${lvl}`,
  expMore: (n, lvl) => `Need ${n} Exp More To ${lvl}`,
  lvlBenefits: (n) => `VIP ${n} Level Benefits`,
  atVip: (n) => `at VIP ${n}`,
};

// One horizontal VIP rank card (port of vipHCardHTML).
function VipHCard({ l, idx, active, mine, onTap, cardRef, levels }) {
  const tierBg = usePageBanner('vip' + l.lvl); // admin-uploaded per-tier background
  const next = levels[idx + 1];
  const nextLabel = next ? 'VIP ' + next.lvl : T.max;
  const depDone = 1000, depTarget = 1600, depMore = Math.max(depTarget - depDone, 0);
  const depPct = Math.min(100, Math.round((depDone / depTarget) * 100));
  const ptsDone = 404, ptsTarget = 4000, ptsMore = Math.max(ptsTarget - ptsDone, 0);
  const ptsPct = Math.min(100, Math.round((ptsDone / ptsTarget) * 100));
  return (
    <div
      ref={cardRef}
      className={'vipw-header vipw-hcard' + (mine ? ' mine' : '') + (active ? ' active' : '')}
      style={{ '--vc': l.c, '--vc-l': l.cl, '--vc-d': l.cd, '--vc-rgb': l.rgb,
        ...(tierBg ? { backgroundImage: `linear-gradient(rgba(8,6,2,.45),rgba(8,6,2,.6)), url(${tierBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}) }}
      onClick={onTap}
    >
      {mine && <div className="vipw-mine-tag">{T.ribbon}</div>}
      <div className="vipw-badge">{l.icImg ? <img className="vipw-badge-img" src={l.icImg} alt="" /> : (l.ic || '★')}</div>
      <div className="vipw-level-title">VIP {l.lvl}{l.name ? ' · ' + l.name : ''}</div>
      <div className="vipw-current">
        {mine ? T.yourLevel : T.level + ' ' + l.lvl}{' '}
        <span className="vipw-rb-chip">♻️ {T.rakeback} <b>{l.rb}</b></span>
      </div>
      <div className="vipw-prog-block">
        <div className="vipw-prog-line"><span className="lbl">{T.deposit}</span> PHP <b>{depDone.toLocaleString()}</b>/{depTarget.toLocaleString()}</div>
        <div className="vipw-bar"><div className="vipw-bar-fill" style={{ width: depPct + '%' }} /><span className="vipw-bar-cap">{T.depMore(depMore, nextLabel)}</span></div>
      </div>
      <div className="vipw-prog-block">
        <div className="vipw-prog-line"><span className="lbl">{T.points}</span> PHP <b>{ptsDone.toLocaleString()}</b>/{ptsTarget.toLocaleString()}</div>
        <div className="vipw-bar"><div className="vipw-bar-fill" style={{ width: ptsPct + '%' }} /><span className="vipw-bar-cap">{T.expMore(ptsMore.toLocaleString(), nextLabel)}</span></div>
      </div>
    </div>
  );
}

export default function VIP() {
  const { openModal } = useUI();
  const go = useSectionNav();
  const hero = usePageHero('vip');

  // Admin-configured VIP tiers (names, icon pictures, rebate, level bonus).
  // Falls back to the bundled default theme until the backend responds.
  const [VIP_LEVELS, setVipLevels] = useState(DEFAULT_VIP_LEVELS);
  useEffect(() => {
    let alive = true;
    api.get('/vip/tiers')
      .then((r) => {
        if (alive && Array.isArray(r.data) && r.data.length) {
          setVipLevels(r.data.map(tierToLevel));
        }
      })
      .catch(() => { /* keep defaults if the config can't be loaded */ });
    return () => { alive = false; };
  }, []);

  // Selected VIP level (index into VIP_LEVELS), default to player's achieved level.
  const [selLevel, setSelLevel] = useState(Math.min(Math.max(PLAYER_VIP_LEVEL - 1, 0), DEFAULT_VIP_LEVELS.length - 1));
  const [benefitsOpen, setBenefitsOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState(() => new Set());
  const toggleFaq = (i) =>
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const levelsRef = useRef(null);
  const cardRefs = useRef([]);

  const N = VIP_LEVELS.length;
  // Circular wheel: three flattened copies, start on the middle copy.
  const globals = useMemo(() => Array.from({ length: N * 3 }, (_, g) => g), [N]);

  // Center a given global card index in the scroller (port of vipCenterGlobal).
  const centerGlobal = (g, smooth) => {
    const wrap = levelsRef.current;
    const card = cardRefs.current[g];
    if (!wrap || !card) return;
    wrap.scrollTo({ left: card.offsetLeft - (wrap.clientWidth - card.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  // Initial centering on the selected level (middle copy).
  useEffect(() => {
    centerGlobal(N + selLevel, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arrow stepping (port of vipStep): center neighbour, settle handler selects.
  const vipStep = (dir) => centerGlobal(N + selLevel + dir, true);

  // Tap a card: center it; settle handler updates selection.
  const vipCardTap = (g) => centerGlobal(g, true);

  // Settle / snap logic (port of the scroll handler in renderVIPRankTable).
  const settleTimer = useRef(null);
  const onScroll = () => {
    const wrap = levelsRef.current;
    if (!wrap) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const cards = cardRefs.current;
      const mid = wrap.scrollLeft + wrap.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      cards.forEach((c, idx) => {
        if (!c) return;
        const center = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(center - mid);
        if (d < bestDist) { bestDist = d; best = idx; }
      });
      const real = best % N;
      // If drifted onto an outer copy, jump (no animation) to the middle-copy twin.
      if (best < N || best >= N * 2) centerGlobal(N + real, false);
      if (real !== selLevel) setSelLevel(real);
    }, 120);
  };

  const l = VIP_LEVELS[selLevel];

  // Benefit cards for the selected level (port of selectVIPLevel).
  const benefitCards = VIP_BENEFITS.map((b, bi) => {
    const unlocked = l.lvl >= b.minLevel;
    // The "Upgrade Bonus" reflects the admin-configured claimable level bonus.
    const amt = b.name === 'Upgrade Bonus' && l.bonus
      ? l.bonus
      : (b.amts ? b.amts[Math.min(l.lvl, 10) - 1] : 0);
    const amtAtUnlock = b.amts ? b.amts[b.minLevel - 1] : 0;
    return (
      <div key={bi} className={'vipw-bcard ' + (unlocked ? 'active' : 'locked')}>
        <div className="vipw-bcard-title">{b.name}</div>
        {unlocked ? (
          <div className="vipw-bcard-amt">₱{amt.toLocaleString()}</div>
        ) : (
          <div className="vipw-bcard-amt locked">₱{amtAtUnlock.toLocaleString()} <span>{T.atVip(b.minLevel)}</span></div>
        )}
        {unlocked ? (
          <button className="vipw-claim" onClick={() => openModal('register')}>{T.claim}</button>
        ) : (
          <div className="vipw-bcard-status">{T.insufficient}</div>
        )}
        <div className="vipw-bcard-icon">{b.icon}</div>
      </div>
    );
  });

  return (
    <div id="view-vip">
      <div className="vip-page">

        {/* Welcome bar */}
        <div className="vip-welcome-bar">
          <div className="vip-welcome-icon">👋</div>
          <div className="vip-welcome-info">
            <div className="vip-welcome-text"><span data-i18n="vip_welcome_back">Welcome back, </span><span id="vip-username">Player</span></div>
            <div className="vip-welcome-sub"><span data-i18n="vip_growth">Growth Up your level and Get more Benefits!</span> <span>→</span></div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="vip-xp-wrap">
              <div className="vip-xp-left">🥉</div>
              <div style={{ flex: 1 }}>
                <div className="vip-xp-track"><div className="vip-xp-fill" id="vip-xp-fill" style={{ width: '0%' }} /></div>
                <div className="vip-xp-label" id="vip-xp-label">0.00 ₱ / 615.05 ₱</div>
              </div>
              <div className="vip-xp-right">🥈</div>
            </div>
          </div>
        </div>

        <div className="vip-inner">

          {/* Hero banner */}
          <PageBanner pageKey="vip"
            title={hero.title || 'Become a member of the Onward VIP Club'}
            desc={hero.desc || 'Experience the highest level of service, exclusive bonuses and other benefits'}
          >
            <div className="vip-hero" style={{ marginBottom: 40 }}>
              <div className="vip-hero-coins">
                <span>🪙</span><span>💰</span><span>🏆</span><span>💎</span>
                <span>🎰</span><span>🃏</span><span>💵</span><span>🎁</span>
              </div>
              <div className="vip-hero-content">
                <div className="vip-hero-title">{hero.title ? <span>{hero.title}</span> : <span data-i18n="vip_hero_title">Become a member of the Onward VIP Club</span>}</div>
                <div className="vip-hero-sub" {...(hero.desc ? {} : { 'data-i18n': 'vip_hero_sub' })}>{hero.desc || 'Experience the highest level of service, exclusive bonuses and other benefits'}</div>
              </div>
            </div>
          </PageBanner>

          {/* Benefits section (removed in v10.55 per request) */}
          <div className="vip-benefits" style={{ display: 'none' }}>
            <div className="vip-benefits-title" data-i18n="vip_join_unlock">Join to unlock all the benefits</div>
            <div className="vip-benefit-tabs">
              <button className="vip-benefit-tab active"><span className="vip-benefit-tab-icon">🪙</span> <span data-i18n="vip_cashback">Cashback</span></button>
              <button className="vip-benefit-tab"><span className="vip-benefit-tab-icon">🎮</span> <span data-i18n="vip_rakeback">Rakeback</span></button>
              <button className="vip-benefit-tab"><span className="vip-benefit-tab-icon">👔</span> <span data-i18n="vip_manager">VIP manager</span></button>
              <button className="vip-benefit-tab"><span className="vip-benefit-tab-icon">🎁</span> <span data-i18n="vip_rewards">Special Rewards</span></button>
            </div>
            <div className="vip-benefit-panels" id="vip-benefit-panels">
              <div className="vip-benefit-feature-card">
                <div className="vip-feature-card-title" data-i18n="vip_cashback">Cashback</div>
                <span className="vip-feature-card-icon">💰</span>
                <div className="vip-feature-card-desc" data-i18n="vip_cashback_desc">Receive UP TO 25% of your last deposit back</div>
              </div>
              <div className="vip-benefit-item-card">
                <span className="vip-benefit-item-icon">☕</span>
                <div className="vip-benefit-item-title" data-i18n="vip_daily_cb">Daily Cashback</div>
                <div className="vip-benefit-item-desc" data-i18n="vip_daily_cb_desc">Get a safety cushion every day – part of your losses returns to your balance</div>
              </div>
              <div className="vip-benefit-item-card">
                <span className="vip-benefit-item-icon">🐷</span>
                <div className="vip-benefit-item-title" data-i18n="vip_weekly_cb">Weekly Cashback</div>
                <div className="vip-benefit-item-desc" data-i18n="vip_weekly_cb_desc">Collect your week's play into one solid refund</div>
              </div>
              <div className="vip-benefit-item-card">
                <span className="vip-benefit-item-icon">📅</span>
                <div className="vip-benefit-item-title" data-i18n="vip_monthly_cb">Monthly cashback</div>
                <div className="vip-benefit-item-desc" data-i18n="vip_monthly_cb_desc">Your long-term activity turns into a substantial cashback reward every month</div>
              </div>
            </div>
          </div>

          {/* Rank system */}
          <div className="vip-rank-section">
            <div className="vip-rank-title" data-i18n="vip_rank">Rank system</div>
            <div className="vip-rank-sub" data-i18n="vip_rank_desc">Increase your rank and unlock new features!</div>
            <div
              className="vip-rank-widget"
              style={{ '--vc': l.c, '--vc-l': l.cl, '--vc-d': l.cd, '--vc-rgb': l.rgb }}
            >
              <div className="vipw-carousel-wrap">
                <button className="vipw-arrow left" onClick={() => vipStep(-1)} aria-label="Previous level">‹</button>
                <div className="vipw-levels vipw-carousel" id="vip-rank-levels" ref={levelsRef} onScroll={onScroll}>
                  {globals.map((g) => {
                    const i = g % N;
                    return (
                      <VipHCard
                        key={g}
                        l={VIP_LEVELS[i]}
                        idx={i}
                        mine={i === PLAYER_VIP_LEVEL - 1}
                        active={g === N + selLevel}
                        onTap={() => vipCardTap(g)}
                        cardRef={(el) => { cardRefs.current[g] = el; }}
                        levels={VIP_LEVELS}
                      />
                    );
                  })}
                </div>
                <button className="vipw-arrow right" onClick={() => vipStep(1)} aria-label="Next level">›</button>
              </div>
              <div className="vipw-card" id="vip-rank-detail">
                <button
                  className={'vipw-benefits-btn' + (benefitsOpen ? ' open' : '')}
                  onClick={() => setBenefitsOpen((o) => !o)}
                >
                  {T.benefits}<span className="vipw-bchev">▼</span>
                </button>
                <div className={'vipw-benefits-wrap' + (benefitsOpen ? ' open' : '')}>
                  <div className="vipw-benefits-head"><span className="chev">▼</span> {T.lvlBenefits(l.lvl)}</div>
                  <div className="vipw-bgrid">{benefitCards}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Two ways to become VIP (removed in v10.56 per request) */}
          <div className="vip-two-ways" style={{ display: 'none' }}>
            <div className="vip-two-ways-title" data-i18n="vip_two_ways">Two ways to become a VIP</div>
            <div className="vip-two-ways-grid">
              <div className="vip-way">
                <span className="vip-way-icon">🏆</span>
                <div className="vip-way-title" data-i18n="vip_reach">Reach the 25 level</div>
                <div className="vip-way-desc">Receive an invitation from your personal account manager – once you reach the 25 level</div>
                <button className="vip-way-btn" onClick={() => go('slots')} data-i18n="vip_play_slots">PLAY SLOTS</button>
              </div>
              <div className="vip-way-divider" />
              <div className="vip-way">
                <span className="vip-way-icon">🔄</span>
                <div className="vip-way-title" data-i18n="vip_account_transfer">Account transfer</div>
                <div className="vip-way-desc">Apply for a VIP Transfer if you're already a VIP player at another casino</div>
                <button className="vip-way-btn" onClick={() => openModal('register')} data-i18n="vip_apply">APPLY FOR VIP</button>
              </div>
            </div>
          </div>

          {/* Other benefits */}
          <div className="vip-other-benefits">
            <div className="vip-other-title" data-i18n="vip_other">Other benefits</div>
            <div className="vip-other-grid">
              <div className="vip-other-card blue">
                <div className="vip-other-card-deco">🤖</div>
                <div className="vip-other-card-title">Private<br />Special Events</div>
                <div className="vip-other-card-desc">Take part in invitation-only tournaments, seasonal VIP competitions and exclusive events with premium rewards</div>
              </div>
              <div className="vip-other-card red">
                <div className="vip-other-card-deco">🎀</div>
                <div className="vip-other-card-title">Giveaways<br />for VIP</div>
                <div className="vip-other-card-desc">Access luxury giveaways, rare prizes and limited VIP drops reserved for selected members</div>
              </div>
              <div className="vip-other-card green">
                <div className="vip-other-card-deco">💰</div>
                <div className="vip-other-card-title">Exclusive<br />VIP Bonuses</div>
                <div className="vip-other-card-desc">Receive customized bonuses, enhanced cashback, higher-value rewards and exclusive VIP promotions</div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="vip-faq">
            <div className="vip-faq-title" data-i18n="vip_faq">Most popular questions</div>
            <div className="vip-faq-sub" data-i18n="vip_about">About VIP Club</div>
            <div id="vip-faq-list">
              {VIP_FAQ.map((f, i) => (
                <div key={i} className={'vip-faq-item' + (openFaqs.has(i) ? ' open' : '')} id={'vip-faq-' + i}>
                  <div className="vip-faq-q" onClick={() => toggleFaq(i)}>
                    <span className="vip-faq-q-icon">❓</span>
                    {f.q}
                    <span className="vip-faq-chevron">▾</span>
                  </div>
                  <div className="vip-faq-a">{f.a}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
