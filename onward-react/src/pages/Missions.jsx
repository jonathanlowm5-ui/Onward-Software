import { useCallback, useEffect, useState } from 'react';
import useSectionNav from '../hooks/useSectionNav';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';
import api from '../services/api';

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
    ['login', '📅 Daily Login'],
    ['deposit', '💳 Deposit'],
    ['wager', '🎲 Wager'],
    ['referral', '🤝 Refer a Friend'],
    ['game', '🎮 Games'],
    ['other', '🎯 Missions'],
  ];
  const grouped = SECTIONS
    .map(([type, label]) => [label, missions.filter((m) => (m.type || 'other') === type)])
    .filter(([, list]) => list.length);
  // Showcase fallback has no types — show it as one plain group.
  const sections = apiMissions ? grouped : [['', missions]];

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
        {sections.map(([label, list]) => (
          <div key={label || 'all'} style={{ marginBottom: 28 }}>
            {label && (
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', margin: '4px 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                {label}
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(255,255,255,.06)', borderRadius: 999, padding: '2px 9px' }}>{list.length}</span>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '16px' }}>
              {list.map((m, i) => (
                <div key={m.id || i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(240,192,64,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '23px', flexShrink: 0 }}>{m.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '15px' }}>{m.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.desc}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}><span data-i18n="mission_progress">Progress</span><span>{m.progress}</span></div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,.08)', borderRadius: '6px', overflow: 'hidden' }}><div style={{ width: m.pct, height: '100%', background: 'linear-gradient(90deg,#f0c040,#d4a017)' }}></div></div>
                  </div>

                  {(m.tiers?.length || 0) > 0 ? (
                    /* Ladder — one row per tier, claimable independently */
                    <div style={{ maxHeight: 218, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 2 }}>
                      {m.tiers.map((t) => (
                        <div key={t.index} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: '7px 10px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: t.claimable || t.claimed ? 'var(--text)' : 'var(--text-muted)', flex: 1, minWidth: 0 }}>
                            {m.type === 'login' ? <>Day {t.target}</> : t.target}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', flexShrink: 0 }}>🎁 {t.reward}</span>
                          {t.claimed ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', flexShrink: 0 }}>✔</span>
                          ) : t.claimable ? (
                            <button onClick={() => missionClaim(m, t.index)} style={{ background: 'linear-gradient(135deg,#f0c040,#d4a017)', color: '#1a1206', border: 'none', padding: '5px 13px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Claim</button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>🔒</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 800 }}>{m.reward}</div>
                      {m.claimed ? (
                        <button disabled style={{ background: 'rgba(34,197,94,.14)', color: '#4ade80', border: '1px solid rgba(34,197,94,.35)', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 800, cursor: 'default', fontFamily: 'inherit' }}>✔ Claimed</button>
                      ) : m.claimable ? (
                        <button onClick={() => missionClaim(m)} style={{ background: 'linear-gradient(135deg,#f0c040,#d4a017)', color: '#1a1206', border: 'none', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="mission_claim">Claim</button>
                      ) : (
                        <button disabled style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'default', fontFamily: 'inherit' }} data-i18n="mission_inprogress">In progress</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
