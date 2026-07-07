import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/*
 * Pop-out announcement — a modal shown over the player site with an image and a
 * message that can be clicked through to a link. Admin-controlled via
 * GET /api/announcement (the `popouts` array). Responsive for web + mobile,
 * has a close button, and remembers what the visitor already dismissed this
 * session so it doesn't nag on every page change. Multiple pop-outs queue up
 * one after another.
 */
const SEEN_KEY = 'onward_popouts_seen';

// Frequency: 'session' hides after dismissal for this session, 'once' hides
// forever on this browser, 'always' shows again on every page load.
function loadSeen() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]');
    const l = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    return { session: s, once: l };
  } catch { return { session: [], once: [] }; }
}
function markSeen(p) {
  const freq = p.frequency || 'session';
  if (freq === 'always') return; // shows again next page load
  try {
    const seen = loadSeen();
    const bucket = freq === 'once' ? 'once' : 'session';
    const storage = freq === 'once' ? localStorage : sessionStorage;
    if (!seen[bucket].includes(p.id)) storage.setItem(SEEN_KEY, JSON.stringify([...seen[bucket], p.id]));
  } catch { /* ignore */ }
}
function wasSeen(p, seen) {
  const freq = p.frequency || 'session';
  if (freq === 'always') return false;
  return (freq === 'once' ? seen.once : seen.session).includes(p.id);
}

// Is `now` within the pop-out's optional [start, end] window?
function scheduleActive(p, now) {
  if (p.start) { const s = Date.parse(p.start); if (!Number.isNaN(s) && now < s) return false; }
  if (p.end) { const e = Date.parse(p.end); if (!Number.isNaN(e) && now > e) return false; }
  return true;
}

// Does this visitor fall in the pop-out's target audience?
function audienceMatch(p, isLoggedIn, vipLevel) {
  const aud = p.audience || 'all';
  if (aud === 'all') return true;
  if (aud === 'guest') return !isLoggedIn;          // not logged in (prospects)
  if (aud === 'member') return isLoggedIn;          // any registered player
  if (aud === 'vip') return isLoggedIn && Number(vipLevel) > 0;
  return true;
}

export default function PopoutAnnouncement() {
  const navigate = useNavigate();
  const { isLoggedIn, profile } = useAuth();
  const [queue, setQueue] = useState([]); // enabled, not-yet-seen pop-outs
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    api.get('/announcement')
      .then((r) => {
        if (!alive) return;
        const seen = loadSeen();
        const now = Date.now();
        const vipLevel = profile?.vipLevel || 0;
        const list = Array.isArray(r.data?.popouts) ? r.data.popouts : [];
        setQueue(list.filter((p) => p && p.enabled !== false && !wasSeen(p, seen)
          && (p.title || p.message || p.image)
          && scheduleActive(p, now)
          && audienceMatch(p, isLoggedIn, vipLevel)));
      })
      .catch(() => {});
    return () => { alive = false; };
    // Re-evaluate when the login state / VIP level changes.
  }, [isLoggedIn, profile?.vipLevel]);

  if (!queue.length) return null;
  const p = queue[0];

  const dismiss = () => {
    markSeen(p);
    setQueue((q) => q.slice(1));
  };

  const go = () => {
    if (!p.link) return;
    markSeen(p);
    if (/^https?:\/\//i.test(p.link)) {
      window.open(p.link, '_blank', 'noopener');
    } else {
      navigate(p.link.startsWith('/') ? p.link : `/${p.link}`);
    }
    setQueue((q) => q.slice(1));
  };

  const img = (mobile && p.mobileImage) ? p.mobileImage : p.image;
  const clickable = !!p.link;

  return (
    <div className="pop-ann-ov" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
      <div className="pop-ann">
        <button className="pop-ann-x" onClick={dismiss} aria-label="Close">✕</button>
        <div
          className={'pop-ann-body' + (clickable ? ' clickable' : '')}
          onClick={clickable ? go : undefined}
          role={clickable ? 'button' : undefined}
        >
          {img && <img className="pop-ann-img" src={img} alt={p.title || 'Announcement'} />}
          {(p.title || p.message) && (
            <div className="pop-ann-text">
              {p.title && <div className="pop-ann-title">{p.title}</div>}
              {p.message && <div className="pop-ann-msg">{p.message}</div>}
              {clickable && (
                <button className="pop-ann-cta" onClick={(e) => { e.stopPropagation(); go(); }}>
                  {p.ctaText || 'Learn More'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
