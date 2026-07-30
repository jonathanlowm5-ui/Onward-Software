import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';
import { SOCIALS } from '../services/social';
import api from '../services/api';

// Marketing placeholder shown to guests (real players get their own code).
const REF_LINK = 'https://legox.com/ref/PLAYER123';
const SHARE_TEXT = 'Join me on Onward Casino and we both get rewarded!';

const STEPS = [
  { num: '1', icon: '🔗', title: 'Share Your Link', titleKey: 'ref_share', desc: 'Copy your unique referral link and share it with friends via social media, messaging apps, or email.' },
  { num: '2', icon: '👤', title: 'Friend Registers', titleKey: 'ref_friend_reg', desc: 'Your friend clicks your link and creates a new account on Onward Casino using your referral code.' },
  { num: '3', icon: '💰', title: 'Both Get Rewarded', titleKey: 'ref_both_win', desc: 'When your friend makes their first deposit, you receive ₱500 bonus and they get a special welcome offer!' },
];

export default function Referral() {
  const { toast, openModal } = useUI();
  const { isLoggedIn } = useAuth();
  const hero = usePageHero('referral');

  // Real referral programme data (code, reward, stats, referred friends).
  const [ref, setRef] = useState(null);
  useEffect(() => {
    if (!isLoggedIn) { setRef(null); return undefined; }
    let alive = true;
    api.get('/player/referral')
      .then((r) => { if (alive && r.data) setRef(r.data); })
      .catch(() => { /* keep marketing defaults if it can't be loaded */ });
    return () => { alive = false; };
  }, [isLoggedIn]);

  // The register modal already consumes ?ref=CODE from the landing URL.
  const refLink = isLoggedIn && ref?.code
    ? `${window.location.origin}/?ref=${ref.code}`
    : REF_LINK;
  const rewardText = ref?.reward || '₱500';

  const copyRefLink = () => {
    if (!isLoggedIn) { openModal('register'); return; }
    navigator.clipboard.writeText(refLink);
    toast('Referral link copied!', 'success');
  };

  const friends = Array.isArray(ref?.referred) ? ref.referred : [];
  const count = friends.length;
  const countLabel = `${count} referral${count !== 1 ? 's' : ''}`;

  return (
    <div id="view-referral">
      <div className="ref-page">
        <div className="ref-inner">

          {/* Hero (uploadable banner falls back to the built-in hero) */}
          <PageBanner pageKey="referral"
            title={hero.title || 'Refer Friends & Earn Together'}
            desc={hero.desc || 'Invite your friends to Onward and earn ₱500 for every friend who registers and makes their first deposit. No limits — the more you refer, the more you earn!'}
          >
            <div className="ref-hero">
              <div className="ref-hero-icon">🤝</div>
              <div className="ref-hero-content">
                <div className="ref-hero-title">{hero.title ? hero.title : <>Refer Friends &<br /><span data-i18n="ref_earn_together">Earn Together</span></>}</div>
                <div className="ref-hero-sub">{hero.desc || 'Invite your friends to Onward and earn ₱500 for every friend who registers and makes their first deposit. No limits — the more you refer, the more you earn!'}</div>
              </div>
            </div>
          </PageBanner>

          {/* Stats */}
          <div className="ref-stats">
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_total">Total Referrals</div>
              <div className="ref-stat-val" id="ref-stat-total">{ref?.total ?? 0}</div>
              <div className="ref-stat-sub" data-i18n="ref_friends_invited">friends invited</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_active">Active Referrals</div>
              <div className="ref-stat-val" id="ref-stat-active">{ref?.active ?? 0}</div>
              <div className="ref-stat-sub" data-i18n="ref_made_deposit">made a deposit</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_earned">Total Earned</div>
              <div className="ref-stat-val" id="ref-stat-earned">₱{((ref?.active ?? 0) * (parseInt(String(rewardText).replace(/[^0-9]/g, ''), 10) || 0)).toLocaleString()}</div>
              <div className="ref-stat-sub" data-i18n="ref_from">from referrals</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_reward">Reward Per Referral</div>
              <div className="ref-stat-val">{rewardText}</div>
              <div className="ref-stat-sub" data-i18n="ref_on_deposit">on first deposit</div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="ref-link-card">
            <div className="ref-link-title" data-i18n="ref_link">Your Referral Link</div>
            <div className="ref-link-sub">Share this link with your friends. When they register and deposit, you both get rewarded!</div>
            <div className="ref-link-row">
              <input className="ref-link-input" id="ref-link-val" type="text" value={refLink} readOnly />
              <button className="ref-copy-btn" onClick={copyRefLink}>📋 Copy Link</button>
            </div>
            <div className="ref-share-btns">
              {SOCIALS.map((s) => (
                <button
                  key={s.key}
                  className="ref-share-btn"
                  title={`Share on ${s.name}`}
                  onClick={() => {
                    if (!isLoggedIn) { openModal('register'); return; }
                    const url = s.share && s.share(refLink, SHARE_TEXT);
                    if (url) { window.open(url, '_blank', 'noopener,width=600,height=520'); }
                    else { navigator.clipboard?.writeText(refLink); toast(`Link copied — paste it on ${s.name}`, 'success'); }
                  }}
                >
                  <img src={s.icon} alt="" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="ref-how-title" data-i18n="ref_how">How It Works</div>
          <div className="ref-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="ref-step">
                <div className="ref-step-num">{step.num}</div>
                <span className="ref-step-icon">{step.icon}</span>
                <div className="ref-step-title" data-i18n={step.titleKey}>{step.title}</div>
                <div className="ref-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Referred Friends Table */}
          <div className="ref-earnings-card">
            <div className="ref-earnings-head">
              <div className="ref-earnings-title" data-i18n="ref_referred">Referred Friends</div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }} id="ref-table-count">{countLabel}</span>
            </div>
            <div id="ref-table-wrap">
              {count === 0 ? (
                <div className="ref-empty">
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>🤝</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }} data-i18n="ref_none">No referrals yet</div>
                  <div style={{ fontSize: '12px' }} data-i18n="ref_share_link">Share your link to start earning!</div>
                </div>
              ) : (
                <table className="ref-table">
                  <thead><tr>
                    <th>Username</th><th>Joined</th><th>Status</th><th>Reward</th>
                  </tr></thead>
                  <tbody>
                    {friends.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.username}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.joined}</td>
                        <td className={`ref-status-${r.active ? 'active' : 'pending'}`}>{r.active ? '✓ Active' : '⏳ Pending'}</td>
                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.active ? rewardText : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="ref-cta">
            <div>
              <div className="ref-cta-text" data-i18n="ref_start">Start Earning Today!</div>
              <div className="ref-cta-sub">Every friend you invite earns you ₱500. No limits, no expiry.</div>
            </div>
            <button className="ref-cta-btn" onClick={copyRefLink}>📋 Copy My Referral Link</button>
          </div>

        </div>
      </div>
    </div>
  );
}
