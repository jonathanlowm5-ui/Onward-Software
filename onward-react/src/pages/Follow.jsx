import { useUI } from '../context/UIContext';

// "Follow Us" page — social channels. A promotion banner can link here via
// buttonLink "/follow". Reuses the referral page styling.
const CHANNELS = [
  { icon: '✈️', name: 'Telegram', handle: '@OnwardOfficial', color: '#229ED9', url: 'https://t.me/' },
  { icon: '📘', name: 'Facebook', handle: 'Onward Casino', color: '#1877F2', url: 'https://facebook.com/' },
  { icon: '📸', name: 'Instagram', handle: '@onward.official', color: '#E1306C', url: 'https://instagram.com/' },
  { icon: '▶️', name: 'YouTube', handle: 'Onward TV', color: '#FF0000', url: 'https://youtube.com/' },
  { icon: '🐦', name: 'Twitter / X', handle: '@OnwardWins', color: '#1DA1F2', url: 'https://x.com/' },
  { icon: '🎵', name: 'TikTok', handle: '@onward', color: '#000000', url: 'https://tiktok.com/' },
];

export default function Follow() {
  const { toast } = useUI();
  const open = (c) => { try { window.open(c.url, '_blank', 'noopener'); } catch { /* */ } toast(`Opening ${c.name}…`); };

  return (
    <div id="view-follow">
      <div className="ref-page">
        <div className="ref-inner">

          {/* Hero */}
          <div className="ref-hero">
            <div className="ref-hero-icon">📣</div>
            <div className="ref-hero-content">
              <div className="ref-hero-title">Follow Onward &<br /><span>Never Miss a Drop</span></div>
              <div className="ref-hero-sub">Join our official channels for exclusive bonus codes, giveaways, big-win highlights and instant updates. Follow all of them — rewards drop where you least expect!</div>
            </div>
          </div>

          {/* Channels grid */}
          <div className="follow-grid">
            {CHANNELS.map((c, i) => (
              <button key={i} className="follow-card" onClick={() => open(c)}>
                <span className="follow-icon" style={{ background: `${c.color}22`, border: `1px solid ${c.color}66` }}>{c.icon}</span>
                <span className="follow-meta">
                  <span className="follow-name">{c.name}</span>
                  <span className="follow-handle">{c.handle}</span>
                </span>
                <span className="follow-btn" style={{ background: c.color }}>Follow</span>
              </button>
            ))}
          </div>

          {/* CTA */}
          <div className="ref-cta">
            <div>
              <div className="ref-cta-text">🎁 Follow & Get Rewarded</div>
              <div className="ref-cta-sub">Follow our Telegram and turn on notifications to catch exclusive promo codes before anyone else.</div>
            </div>
            <button className="ref-cta-btn" onClick={() => open(CHANNELS[0])}>✈️ Join Telegram</button>
          </div>

        </div>
      </div>
    </div>
  );
}
