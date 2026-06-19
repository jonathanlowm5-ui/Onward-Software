import { useState } from 'react';
import { useUI } from '../context/UIContext';

const OCS_TIERS = {
  newbie: { cls: 't-new', ic: '🌱', bg: 'linear-gradient(135deg,#0b6e4f,#2ecc71)', n: 'Newbie', s: 'Best opening setup', sc: 'var(--green)',
    d: 'Attract brand-new players with aggressive welcome bonuses, deposit matches, free spins and exciting VIP entry-level rewards. Perfect for fresh operator launches.',
    inc: ['🎁 200% Welcome Bonus (up to ₱10,000)', '💳 100% First Deposit Match', '🎰 50 Free Spins on signup', '🏆 New Player Welcome Tournament', '💎 3-Tier VIP: Bronze → Silver → Gold', '🖼️ 6 pre-designed promotion artworks'],
    sum: '✅ 5 Promotions · 1 Tournament · 3 VIP Tiers · Full Artwork Pack' },
  advance: { cls: 't-adv', ic: '🚀', bg: 'linear-gradient(135deg,#b8860b,#f4b223)', n: 'Advance', s: 'Best retention setup', sc: 'var(--gold)', pop: 1,
    d: 'Keep existing players engaged with reload bonuses, cashback programs, loyalty rewards and competitive tournaments. Optimised for player retention and LTV growth.',
    inc: ['🔄 Daily Reload 20% Bonus', '💸 Weekly 10% Cashback', '🎯 Mission & Challenge System', '🏆 Weekly High-Roller Tournament', '💎 5-Tier VIP with escalating perks', '🖼️ 10 pre-designed promotion artworks'],
    sum: '✅ 8 Promotions · 2 Tournaments · 5 VIP Tiers · Full Artwork Pack' },
  pro: { cls: 't-pro', ic: '👑', bg: 'linear-gradient(135deg,#5e2a9e,#9b6dff)', n: 'Pro', s: 'Balanced growth setup', sc: '#c69bff',
    d: 'The complete balanced package — attract new players AND retain existing ones with a full promotional ecosystem, premium VIP program and high-value tournament calendar.',
    inc: ['🎁 Full Welcome + Reload + Cashback pack', '🏆 3 Concurrent Tournaments', '🎯 Mission System + Voucher Campaigns', '💎 7-Tier VIP Diamond Program', '🎰 Jackpot + Progressive Prize Pool', '🖼️ 18 pre-designed promotion artworks'],
    sum: '✅ 12 Promotions · 3 Tournaments · 7 VIP Tiers · Full Artwork Pack' },
};

const INITIAL_PKG = {
  promo: [
    { t: '200% Welcome Bonus', tag: 'welcome', ic: '🎁', bg: 'linear-gradient(135deg,#1e9e50,#2ecc71)', d: 'Massive welcome bonus to attract first-time players. Up to ₱10,000 on your very first deposit.', ch: ['Value: 200%', 'Max: ₱10,000', 'Wager: 30x'], on: 1 },
    { t: '100% First Deposit Match', tag: 'deposit', ic: '💳', bg: 'linear-gradient(135deg,#1a6fd4,#3aa0ff)', d: 'Double your first deposit. Minimum ₱200 required.', ch: ['Value: 100%', 'Max: ₱5,000', 'Wager: 20x'], on: 1 },
    { t: '50 Free Spins on Sign-Up', tag: 'freespin', ic: '🎰', bg: 'linear-gradient(135deg,#b8860b,#f4b223)', d: '50 free spins credited instantly upon registration. No deposit required.', ch: ['Value: 50 Spins', 'Wager: 25x'], on: 1 },
    { t: 'Refer-a-Friend ₱500 Bonus', tag: 'referral', ic: '👥', bg: 'linear-gradient(135deg,#5e2a9e,#9b6dff)', d: 'Earn ₱500 for every friend you refer who completes their first deposit.', ch: ['Value: ₱500', 'Max: ₱500', 'Wager: 10x'], on: 1 },
    { t: 'First Week Cashback 15%', tag: 'cashback', ic: '💸', bg: 'linear-gradient(135deg,#c2410c,#ff8c42)', d: 'Get 15% cashback on net losses during your first 7 days. Max ₱2,000.', ch: ['Value: 15%', 'Max: ₱2,000', 'Wager: 5x'], on: 1 }],
  tour: [
    { t: 'New Player Welcome Cup', tag: 'weekly', ic: '🏆', bg: 'linear-gradient(135deg,#b8860b,#f4b223)', d: '7-day slots race exclusive to new sign-ups.', ch: ['Prize: ₱100,000', 'Min Bet: ₱10'], on: 1 },
    { t: 'Weekend Slots Sprint', tag: 'weekend', ic: '⚡', bg: 'linear-gradient(135deg,#1a6fd4,#3aa0ff)', d: '48-hour leaderboard across all slots.', ch: ['Prize: ₱250,000', 'Min Bet: ₱20'], on: 1 }],
  vip: [
    { t: 'Bronze', tag: 'entry', ic: '🥉', bg: 'linear-gradient(135deg,#7a4a12,#b06a2c)', d: 'Entry tier — 0.5% cashback, birthday gift.', ch: ['Cashback 0.5%'], on: 1 },
    { t: 'Silver', tag: 'tier 2', ic: '🥈', bg: 'linear-gradient(135deg,#5c6675,#c8d2e4)', d: '1% cashback + weekly free spins.', ch: ['Cashback 1%'], on: 1 },
    { t: 'Gold', tag: 'tier 3', ic: '🥇', bg: 'linear-gradient(135deg,#b8860b,#f4b223)', d: '2% cashback, rebate, VIP missions.', ch: ['Cashback 2%', 'Rebate 1%'], on: 1 }],
  art: [
    { t: 'Welcome Banner Pack', tag: '6 pcs', ic: '🖼️', bg: 'linear-gradient(135deg,#0b6e4f,#2ecc71)', d: 'Hero + thumbnail + popup artwork for the welcome offer.', ch: ['PNG + PSD'], on: 1 },
    { t: 'Free Spins Pack', tag: '4 pcs', ic: '🎨', bg: 'linear-gradient(135deg,#5e2a9e,#9b6dff)', d: 'Social-ready visuals for the free-spins promo.', ch: ['PNG + PSD'], on: 1 }],
  mis: [
    { t: 'Daily Login Streak', tag: 'daily', ic: '📅', bg: 'linear-gradient(135deg,#1a6fd4,#3aa0ff)', d: 'Reward 7-day login streaks with bonus credit.', ch: ['Reward: ₱88'], on: 1 },
    { t: 'Slot Explorer', tag: 'weekly', ic: '🧭', bg: 'linear-gradient(135deg,#c2410c,#ff8c42)', d: 'Play 5 different slots to claim free spins.', ch: ['Reward: 50 FS'], on: 1 }],
  tset: [
    { t: 'Leaderboard Engine', tag: 'core', ic: '⚙️', bg: 'linear-gradient(135deg,#222,#555)', d: 'Points = turnover × game weight. Auto-settles prizes.', ch: ['Auto payout'], on: 1 }],
};

const ocsTabs = { promo: '🎁 Promotions', tour: '🏆 Tournaments', vip: '💎 VIP Tiers', art: '🖼️ Artwork', mis: '🎯 Missions', tset: '⚙️ Tournament Setup' };

export default function Setup() {
  const { toast } = useUI();
  const [tier, setTier] = useState('newbie');
  const [tab, setTab] = useState('promo');
  const [pkg, setPkg] = useState(INITIAL_PKG);

  const T = OCS_TIERS;
  const items = pkg[tab];
  const selN = items.filter((x) => x.on).length;

  const ocsToggle = (i) => {
    setPkg((prev) => ({ ...prev, [tab]: prev[tab].map((c, idx) => (idx === i ? { ...c, on: c.on ? 0 : 1 } : c)) }));
  };
  const ocsApply = () => {
    const t = OCS_TIERS[tier];
    const n = Object.values(pkg).flat().filter((x) => x.on).length;
    toast('⚡ ' + t.n + ' package applied! ' + n + ' items deployed to your platform ✔');
  };

  return (
    <>
      <h1 className="hero-h">⚡ One Click Setup</h1>
      <div className="hero-sub">New to the platform? Choose a setup tier below to instantly deploy a complete suite of <b style={{ color: 'var(--gold)' }}>Promotions</b>, <b style={{ color: 'var(--gold)' }}>Tournaments</b>, <b style={{ color: 'var(--gold)' }}>VIP Tiers</b> and <b style={{ color: 'var(--gold)' }}>artwork</b> — no designer needed.</div>
      <div className="ocs-tiers">
        {Object.entries(T).map(([k, t]) => (
          <div className={`tier ${t.cls} ${tier === k ? 'sel' : ''}`} key={k} onClick={() => setTier(k)}>
            {t.pop ? <div className="pop">⭐ MOST POPULAR</div> : null}
            <div className="radio"></div>
            <div className="th"><div className="ticon" style={{ background: t.bg }}>{t.ic}</div><div><div className="tn">{t.n}</div><div className="ts" style={{ color: t.sc }}>{t.s}</div></div></div>
            <div className="td">{t.d}</div>
            <div className="wi">WHAT'S INCLUDED</div>
            <ul>{t.inc.map((x, xi) => <li key={xi}>{x}</li>)}</ul>
            <div className="sum">{t.sum}</div>
          </div>
        ))}
      </div>
      <div className="ocs-divider">📦 PACKAGE PREVIEW</div>
      <div className="ptabs" style={{ marginBottom: '12px' }}>
        {Object.entries(ocsTabs).map(([k, l]) => (
          <button className={`ptab ${tab === k ? 'active' : ''}`} key={k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="ocs-hint"><span>Click a card to include/exclude it from your setup</span><span className="selcnt">{selN} / {items.length} selected</span></div>
      <div className="pk-grid">
        {items.map((c, i) => (
          <div className={`pk-card ${c.on ? 'on' : 'off'}`} key={i} onClick={() => ocsToggle(i)}>
            <div className="ph" style={{ background: c.bg }}>{c.ic}<span className="chk">✓</span></div>
            <div className="pb">
              <div className="pt">{c.t}<span className="pk-tag">{c.tag}</span></div>
              <div className="pd">{c.d}</div>
              <div className="pk-chips">{c.ch.map((x, xi) => <span key={xi}>{x}</span>)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="ocs-foot">
        <div><div className="ft">Apply {T[tier].n} Package</div><div className="fd">This will create all promotions, tournaments, VIP tiers and upload artwork to your platform in one click.</div></div>
        <button className="btn-search" onClick={ocsApply}>⚡ Apply Now</button>
      </div>
    </>
  );
}
