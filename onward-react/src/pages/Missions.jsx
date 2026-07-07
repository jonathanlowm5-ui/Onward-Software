import { useCallback, useEffect, useState } from 'react';
import useSectionNav from '../hooks/useSectionNav';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';
import api from '../services/api';

// Per-category card gradients (Rewards-style banner cards).
const GRADS = {
  login: 'linear-gradient(100deg,#d43a2a 0%,#f0741f 55%,#f7a21b 100%)',
  deposit: 'linear-gradient(100deg,#123fbd 0%,#1e63e0 55%,#2f9bff 100%)',
  wager: 'linear-gradient(100deg,#4c1fb8 0%,#6d28d9 55%,#9333ea 100%)',
  referral: 'linear-gradient(100deg,#0b7a44 0%,#15a35a 55%,#22c55e 100%)',
  game: 'linear-gradient(100deg,#0b5e74 0%,#0e7490 55%,#06b6d4 100%)',
  other: 'linear-gradient(100deg,#28344a 0%,#3a4a68 55%,#4c5f85 100%)',
};

// Built-in showcase (used while the admin hasn't created any missions).
const MISSIONS = [
  { icon: '🔥', title: 'Daily Login Streak', desc: 'Log in 7 days in a row', progress: '4 / 7', pct: '57%', reward: '🎁 ₱50', claimable: false },
  { icon: '💰', title: 'First Deposit', desc: 'Make your first deposit', progress: '1 / 1', pct: '100%', reward: '🎁 50 FS', claimable: true },
  { icon: '🎰', title: 'Weekly Wager', desc: 'Wager ₱10,000 this week', progress: '₱6,200 / ₱10,000', pct: '62%', reward: '🎁 ₱200', claimable: false },
  { icon: '🏆', title: 'Win 5 Games', desc: 'Win 5 games in any category', progress: '3 / 5', pct: '60%', reward: '🎁 ₱100', claimable: false },
  { icon: '👥', title: 'Refer a Friend', desc: 'Invite 1 friend who deposits', progress: '1 / 1', pct: '100%', reward: '🎁 ₱150', claimable: true },
  { icon: '🎡', title: 'Spin the Wheel', desc: 'Use the Fortune Wheel 3 times', progress: '0 / 3', pct: '0%', reward: '🎁 25 FS', claimable: false },
];

export default function Missions() {
  const go = useSectionNav();
  const { toast, openModal } = useUI();
  const { isLoggedIn, refreshProfile } = useAuth();
  const hero = usePageHero('missions');

  // Admin-created missions replace the showcase when any exist. Logged-in
  // players get their real progress (login streak, deposits, referrals) from
  // /missions/me and can claim completed ones; guests see them at 0.
  const [apiMissions, setApiMissions] = useState(null);
  const load = useCallback(() => {
    api.get(isLoggedIn ? '/missions/me' : '/missions?active=1')
      .then((r) => { if (Array.isArray(r.data) && r.data.length) setApiMissions(r.data); })
      .catch(() => {});
  }, [isLoggedIn]);
  useEffect(() => { load(); }, [load]);

  const missions = apiMissions
    ? apiMissions.map((m) => ({
      id: m.id,
      type: m.type || 'other',
      icon: m.icon || '🎯',
      title: m.title,
      desc: m.desc || (m.duration ? `Duration: ${m.duration}` : ''),
      tiers: (Array.isArray(m.tiers) ? m.tiers : []).map((t, ti) => ({
        index: t.index ?? ti,
        target: t.target,
        reward: t.reward,
        claimed: !!t.claimed,
        claimable: !!t.claimable,
      })),
      progress: m.claimed
        ? '✔ Completed'
        : m.target ? `${m.progress ?? 0} / ${m.target}` : (m.duration || '—'),
      pct: `${m.claimed ? 100 : (m.pct ?? 0)}%`,
      reward: m.reward ? `🎁 ${m.reward}` : '',
      claimable: !!m.claimable,
      claimed: !!m.claimed,
    }))
    : MISSIONS;

  // Group into category sections (Daily Login / Deposit / Wager / …).
  const SECTIONS = [
    ['login', '📅', 'Daily Login', 'mission_sec_login'],
    ['deposit', '💳', 'Deposit', 'mission_sec_deposit'],
    ['wager', '🎲', 'Wager', 'mission_sec_wager'],
    ['referral', '🤝', 'Refer a Friend', 'mission_sec_referral'],
    ['game', '🎮', 'Games', 'mission_sec_game'],
    ['other', '🎯', 'Missions', 'mission_sec_other'],
  ];
  const grouped = SECTIONS
    .map(([type, icon, label, i18n]) => [icon, label, i18n, missions.filter((m) => (m.type || 'other') === type)])
    .filter(([, , , list]) => list.length);
  // Showcase fallback has no types — show it as one plain group.
  const sections = apiMissions ? grouped : [['', '', '', missions]];

  const missionClaim = async (m, tier) => {
    if (!isLoggedIn) { openModal('register'); return; }
    if (!m.id) { toast('Reward claimed!', 'success'); return; } // showcase fallback
    try {
      const { data } = await api.post('/missions/claim', { id: m.id, ...(tier != null ? { tier } : {}) });
      toast(data.credited > 0
        ? `🎉 ${data.reward} credited to your balance!`
        : `🎉 Reward claimed! ${data.reward || ''} will be added to your account.`, 'success');
      load();
      refreshProfile?.(); // reflect the new balance in the header
    } catch (e) {
      toast('❌ ' + (e?.response?.data?.error || 'Could not claim'), 'error');
    }
  };

  return (
    <div id="view-missions">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 60px' }}>
        <button onClick={() => go('lobby')} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="mission_back">← BACK</button>
        <div style={{ marginTop: 16, marginBottom: 22 }}>
          <PageBanner pageKey="missions"
            title={hero.title || 'Complete Missions & Earn Rewards'}
            desc={hero.desc || 'Finish daily and weekly tasks to unlock bonuses, free spins and cash — the more you play, the more you earn!'}
          >
            <div className="ref-hero" style={{ marginBottom: 0 }}>
              <div className="ref-hero-icon">🎯</div>
              <div className="ref-hero-content">
                <div className="ref-hero-title">{hero.title ? hero.title : <>Complete Missions &amp;<br /><span data-i18n="mission_earn">Earn Rewards</span></>}</div>
                <div className="ref-hero-sub" {...(hero.desc ? {} : { 'data-i18n': 'mission_subtitle' })}>{hero.desc || 'Finish daily and weekly tasks to unlock bonuses, free spins and cash — the more you play, the more you earn!'}</div>
              </div>
            </div>
          </PageBanner>
        </div>
        {sections.map(([icon, label, i18n, list]) => (
          <div key={label || 'all'} style={{ marginBottom: 30 }}>
            {label && (
              <div className="msn-section-h">
                <span aria-hidden="true">{icon}</span>
                <span data-i18n={i18n}>{label}</span>
                <span className="cnt">{list.length}</span>
              </div>
            )}
            {list.map((m, i) => (
              <div key={m.id || i} className="msn-card" style={{ background: GRADS[m.type] || GRADS.other }}>
                <div className="msn-emoji" aria-hidden="true">{m.icon}</div>
                <div className="msn-body">
                  <div className="msn-title">{m.title}</div>
                  {m.desc && <div className="msn-desc">{m.desc}</div>}
                  {!m.claimed && (
                    <div className="msn-progress"><div style={{ width: m.pct }}></div></div>
                  )}

                  {(m.tiers?.length || 0) > 0 && (
                    /* Ladder — one row per rung, claimable independently */
                    <div className="msn-tiers">
                      {m.tiers.map((t) => (
                        <div key={t.index} className={'msn-tier' + (!t.claimed && !t.claimable ? ' locked' : '')}>
                          <span className="lbl">{m.type === 'login' ? <>Day {t.target}</> : t.target}</span>
                          <span className="rwd">🎁 {t.reward}</span>
                          {t.claimed ? (
                            <span className="st" style={{ color: '#7dffa9' }}>✔</span>
                          ) : t.claimable ? (
                            <button className="st claim-btn" onClick={() => missionClaim(m, t.index)}>CLAIM</button>
                          ) : (
                            <span className="st">🔒</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="msn-side">
                  {(m.tiers?.length || 0) > 0 ? (
                    <span className={'msn-chip' + (m.claimed ? ' done' : '')}>
                      {m.claimed ? '✔ ALL CLAIMED' : <>{m.claimable ? '🎁' : '🔒'} {m.progress}</>}
                    </span>
                  ) : m.claimed ? (
                    <span className="msn-chip done">✔ CLAIMED</span>
                  ) : m.claimable ? (
                    <button className="msn-claim" onClick={() => missionClaim(m)} data-i18n="mission_claim">CLAIM</button>
                  ) : (
                    <span className="msn-chip">🔒 {m.progress}</span>
                  )}
                  {!(m.tiers?.length) && m.reward && (
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#ffd75e', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>{m.reward}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
