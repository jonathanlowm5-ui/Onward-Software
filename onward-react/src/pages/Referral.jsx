import { useUI } from '../context/UIContext';
import PageBanner from '../components/common/PageBanner.jsx';
import usePageHero from '../hooks/usePageHero';

const REF_LINK = 'https://legox.com/ref/PLAYER123';

// Demo data shown when logged in (empty by default in the original).
const REF_FRIENDS = [];

const SHARE_BTNS = [
  { label: '📘 Facebook' },
  { label: '✈️ Telegram' },
  { label: '🐦 Twitter / X' },
  { label: '💬 WhatsApp' },
  { label: '📧 Email' },
];

const STEPS = [
  { num: '1', icon: '🔗', title: 'Share Your Link', titleKey: 'ref_share', desc: 'Copy your unique referral link and share it with friends via social media, messaging apps, or email.' },
  { num: '2', icon: '👤', title: 'Friend Registers', titleKey: 'ref_friend_reg', desc: 'Your friend clicks your link and creates a new account on Onward Casino using your referral code.' },
  { num: '3', icon: '💰', title: 'Both Get Rewarded', titleKey: 'ref_both_win', desc: 'When your friend makes their first deposit, you receive ₱500 bonus and they get a special welcome offer!' },
];

export default function Referral() {
  const { toast } = useUI();
  const hero = usePageHero('referral');

  const copyRefLink = () => {
    navigator.clipboard.writeText(REF_LINK);
    toast('Referral link copied!', 'success');
  };

  const count = REF_FRIENDS.length;
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
              <div className="ref-stat-val" id="ref-stat-total">0</div>
              <div className="ref-stat-sub" data-i18n="ref_friends_invited">friends invited</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_active">Active Referrals</div>
              <div className="ref-stat-val" id="ref-stat-active">0</div>
              <div className="ref-stat-sub" data-i18n="ref_made_deposit">made a deposit</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_earned">Total Earned</div>
              <div className="ref-stat-val" id="ref-stat-earned">₱0</div>
              <div className="ref-stat-sub" data-i18n="ref_from">from referrals</div>
            </div>
            <div className="ref-stat-card">
              <div className="ref-stat-label" data-i18n="ref_reward">Reward Per Referral</div>
              <div className="ref-stat-val">₱500</div>
              <div className="ref-stat-sub" data-i18n="ref_on_deposit">on first deposit</div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="ref-link-card">
            <div className="ref-link-title" data-i18n="ref_link">Your Referral Link</div>
            <div className="ref-link-sub">Share this link with your friends. When they register and deposit, you both get rewarded!</div>
            <div className="ref-link-row">
              <input className="ref-link-input" id="ref-link-val" type="text" value={REF_LINK} readOnly />
              <button className="ref-copy-btn" onClick={copyRefLink}>📋 Copy Link</button>
            </div>
            <div className="ref-share-btns">
              {SHARE_BTNS.map((b, i) => (
                <button key={i} className="ref-share-btn" onClick={() => toast('Link shared!', 'success')}>{b.label}</button>
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
                    {REF_FRIENDS.map((r, i) => (
                      <tr key={i}>
                        <td><strong>{r.name}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.joined}</td>
                        <td className={`ref-status-${r.status}`}>{r.status === 'active' ? '✓ Active' : '⏳ Pending'}</td>
                        <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.status === 'active' ? '₱500' : '—'}</td>
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
