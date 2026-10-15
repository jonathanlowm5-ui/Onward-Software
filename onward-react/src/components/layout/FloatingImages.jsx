import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

/*
 * Floating promo images — small clickable widgets (50–100 px) pinned to a
 * corner, configured in the admin (CMS → Floating Image). Closable ones
 * remember dismissal for the session.
 */
const SEEN_KEY = 'onward_floats_hidden';
const loadHidden = () => { try { return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'); } catch { return []; } };

const POS_STYLE = {
  'bottom-right': { right: 18, bottom: 84 },
  'bottom-left': { left: 18, bottom: 84 },
  'top-right': { right: 18, top: 120 },
  'top-left': { left: 18, top: 120 },
  'center-right': { right: 18, top: '50%', transform: 'translateY(-50%)' },
  'center-left': { left: 18, top: '50%', transform: 'translateY(-50%)' },
};

export default function FloatingImages() {
  const navigate = useNavigate();
  const [floats, setFloats] = useState([]);
  const [hidden, setHidden] = useState(loadHidden);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 600);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= 600);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    api.get('/floating').then((r) => { if (alive && Array.isArray(r.data)) setFloats(r.data); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const dismiss = (id) => {
    const next = [...hidden, id];
    setHidden(next);
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const go = (f) => {
    if (!f.link) return;
    if (/^https?:\/\//i.test(f.link)) window.open(f.link, '_blank', 'noopener');
    else { navigate(f.link.startsWith('/') ? f.link : `/${f.link}`); window.scrollTo({ top: 0 }); }
  };

  const shown = floats.filter((f) => !hidden.includes(f.id));
  if (!shown.length) return null;

  return (
    <>
      {shown.map((f) => {
        const img = (mobile && f.mobileImage) ? f.mobileImage : f.image;
        const size = Math.max(50, Math.min(100, Number(f.size) || 72));
        return (
          <div key={f.id} className={`float-img float-anim-${f.animation || 'slide'}`} style={{ ...POS_STYLE[f.position] || POS_STYLE['bottom-right'], width: size, height: size }}>
            {f.closable !== false && (
              <button className="float-img-x" onClick={() => dismiss(f.id)} aria-label="Close">✕</button>
            )}
            <img
              src={img}
              alt={f.name || 'Promotion'}
              onClick={() => go(f)}
              style={{ cursor: f.link ? 'pointer' : 'default' }}
            />
          </div>
        );
      })}
    </>
  );
}
