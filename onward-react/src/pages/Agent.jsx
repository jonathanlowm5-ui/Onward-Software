import { useUI } from '../context/UIContext';

// Agent / affiliate program page. Reuses the referral page styling for a
// consistent look. A promotion banner can link here via buttonLink "/agent".
const AGENT_LINK = 'https://onward.com/agent/PLAYER123';

const STEPS = [
  { num: '1', icon: '📝', title: 'Apply as Agent', desc: 'Register as an Onward agent in minutes — no cost to join. Get your dedicated agent dashboard and tracking link.' },
  { num: '2', icon: '🔗', title: 'Share Your Link', desc: 'Promote Onward with your unique agent link across your channels, groups and communities.' },
  { num: '3', icon: '💸', title: 'Earn Commission', desc: 'Earn lifetime commission on the net revenue of every player you bring in — paid out every week.' },
];

const TIERS = [
  { name: 'Bronze', players: '1 – 10', rate: '25%' },
  { name: 'Silver', players: '11 – 50', rate: '30%' },
  { name: 'Gold', players: '51 – 150', rate: '40%' },
  { name: 'Diamond', players: '150+', rate: '50%' },
];

export default function Agent() {
  const { toast } = useUI();
  const copyLink = () => { navigator.clipboard.writeText(AGENT_LINK); toast('Agent link copied!', 'success'); };

  return (
    <div id="view-agent">
      <div className="ref-page">
        <div className="ref-inner">

          {/* Hero */}
          <div className="ref-hero">
            <div className="ref-hero-icon">🧑‍💼</div>
            <div className="ref-hero-content">
              <div className="ref-hero-title">Become an<br /><span>Onward Agent</span></div>
              <div className="ref-hero-sub">Partner with Onward and earn up to 50% lifetime commission on every player you refer. Real-time tracking, weekly payouts, dedicated support — no limits on what you can earn.</div>
            </div>
          </div>

          {/* Stats */}
          <div className="ref-stats">
            <div className="ref-stat-card"><div className="ref-stat-label">Commission Rate</div><div className="ref-stat-val">Up to 50%</div><div className="ref-stat-sub">of net revenue</div></div>
            <div className="ref-stat-card"><div className="ref-stat-label">Active Players</div><div className="ref-stat-val">0</div><div className="ref-stat-sub">under you</div></div>
            <div className="ref-stat-card"><div className="ref-stat-label">This Month</div><div className="ref-stat-val">₱0</div><div className="ref-stat-sub">commission</div></div>
            <div className="ref-stat-card"><div className="ref-stat-label">Payout</div><div className="ref-stat-val">Weekly</div><div className="ref-stat-sub">every Monday</div></div>
          </div>

          {/* Agent link */}
          <div className="ref-link-card">
            <div className="ref-link-title">Your Agent Link</div>
            <div className="ref-link-sub">Share this link to start building your downline. You earn commission on every player who joins and plays through it.</div>
            <div className="ref-link-row">
              <input className="ref-link-input" type="text" value={AGENT_LINK} readOnly />
              <button className="ref-copy-btn" onClick={copyLink}>📋 Copy Link</button>
            </div>
          </div>

          {/* Commission tiers */}
          <div className="ref-how-title">Commission Tiers</div>
          <div className="ref-earnings-card">
            <table className="ref-table">
              <thead><tr><th>Tier</th><th>Active Players</th><th>Commission</th></tr></thead>
              <tbody>
                {TIERS.map((t, i) => (
                  <tr key={i}>
                    <td><strong>{t.name}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{t.players}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{t.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* How it works */}
          <div className="ref-how-title">How It Works</div>
          <div className="ref-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="ref-step">
                <div className="ref-step-num">{step.num}</div>
                <span className="ref-step-icon">{step.icon}</span>
                <div className="ref-step-title">{step.title}</div>
                <div className="ref-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="ref-cta">
            <div>
              <div className="ref-cta-text">Ready to start earning?</div>
              <div className="ref-cta-sub">Join the Onward agent program today — it's free, and your earning potential is unlimited.</div>
            </div>
            <button className="ref-cta-btn" onClick={() => toast('Agent application sent! Our team will contact you shortly.', 'success')}>🚀 Apply Now</button>
          </div>

        </div>
      </div>
    </div>
  );
}
