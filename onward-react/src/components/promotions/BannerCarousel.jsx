import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { resolvePromoBanner, localizePromo } from '../../utils/promoTerms';
import { fetchPromotions } from '../../services/gamesService';

/*
 * BannerCarousel — one responsive hero banner reused across the site (front
 * page, promotions page, …). It renders the admin promotions that have a banner
 * image (resolved to the viewer's currency) in a single fixed 1200x425 frame, so a
 * single uploaded banner looks right everywhere — no need to upload different
 * sizes per page. Auto-rotates, click opens the promo detail. Renders nothing
 * when there are no banner images, so callers keep their existing fallback.
 *
 * Recommended source image: 1200 × 425, under 4 MB.
 */
export default function BannerCarousel({ promos, className = '' }) {
  const { openModal, lang } = useUI();
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Clicking a banner navigates to its internal link (e.g. /referral, /agent,
  // /follow) when set, opens an external link in a new tab, or otherwise shows
  // the promo detail.
  const onBannerClick = (p) => {
    const link = String(p?.buttonLink || '').trim();
    if (link.startsWith('/')) { navigate(link); return; }
    if (/^https?:\/\//i.test(link)) { window.open(link, '_blank', 'noopener'); return; }
    openModal('promo', p);
  };

  // When no promos are passed in, the banner fetches its own (active admin
  // promotions) so it can be dropped onto any page with zero wiring.
  const [fetched, setFetched] = useState([]);
  const selfFetch = promos === undefined;
  useEffect(() => {
    if (!selfFetch) return undefined;
    let alive = true;
    fetchPromotions().then((p) => { if (alive && Array.isArray(p)) setFetched(p); }).catch(() => {});
    return () => { alive = false; };
  }, [selfFetch]);

  const source = selfFetch ? fetched : (promos || []);
  // Region is a label, not a filter — show every promo banner, but put the ones
  // matching the player's currency/country first.
  const cur = profile?.currency;
  const country = profile?.country;
  const matchesViewer = (p) =>
    (!p.currency || !cur || p.currency === cur) &&
    (!p.country || !country || p.country === country);
  const slides = [...source]
    .sort((a, b) => (matchesViewer(b) ? 1 : 0) - (matchesViewer(a) ? 1 : 0))
    .map((p) => ({ p: localizePromo(p, lang), img: resolvePromoBanner(p, profile?.currency) }))
    .filter((s) => s.img);

  const [idx, setIdx] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    timer.current = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  useEffect(() => { if (idx >= slides.length) setIdx(0); }, [slides.length, idx]);

  if (!slides.length) return null;
  const safeIdx = Math.min(idx, slides.length - 1);

  return (
    <div className={`onward-banner ${className}`.trim()}>
      <div className="onward-banner-track" style={{ transform: `translateX(-${safeIdx * 100}%)` }}>
        {slides.map((s, i) => {
          const lines = s.p.description
            ? String(s.p.description).split('\n').map((l, j) => <span key={j}>{l}<br /></span>)
            : null;
          return (
            <div key={s.p.id ?? i} className="onward-banner-slide" onClick={() => onBannerClick(s.p)}>
              <img src={s.img} alt={s.p.title || 'Promotion'} className="onward-banner-img" />
              {(s.p.title || lines) && (
                <div className="onward-banner-text">
                  {s.p.title && <div className="onward-banner-title">{s.p.title}</div>}
                  {lines && <div className="onward-banner-desc">{lines}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {slides.length > 1 && (
        <div className="onward-banner-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to banner ${i + 1}`}
              className={`onward-banner-dot${i === safeIdx ? ' active' : ''}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
