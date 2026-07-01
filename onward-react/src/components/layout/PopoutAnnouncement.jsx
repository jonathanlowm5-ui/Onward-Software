import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

function loadSeen() {
  try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; }
}
function markSeen(id) {
  try {
    const seen = loadSeen();
    if (!seen.includes(id)) sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
  } catch { /* ignore */ }
}

export default function PopoutAnnouncement() {
  const navigate = useNavigate();
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
        const list = Array.isArray(r.data?.popouts) ? r.data.popouts : [];
        setQueue(list.filter((p) => p && p.enabled !== false && !seen.includes(p.id)
          && (p.title || p.message || p.image)));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!queue.length) return null;
  const p = queue[0];

  const dismiss = () => {
    markSeen(p.id);
    setQueue((q) => q.slice(1));
  };

  const go = () => {
    if (!p.link) return;
    markSeen(p.id);
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
