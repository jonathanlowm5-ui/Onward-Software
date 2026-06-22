import { useEffect, useRef, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { resolvePromoBanner } from '../../utils/promoTerms';

/*
 * BannerCarousel — one responsive hero banner reused across the site (front
 * page, promotions page, …). It renders the admin promotions that have a banner
 * image (resolved to the viewer's currency) in a single fixed 16:7 frame, so a
 * single uploaded banner looks right everywhere — no need to upload different
 * sizes per page. Auto-rotates, click opens the promo detail. Renders nothing
 * when there are no banner images, so callers keep their existing fallback.
 *
 * Recommended source image: 1200 × 525 (16:7), under 4 MB.
 */
export default function BannerCarousel({ promos = [], className = '' }) {
  const { openModal } = useUI();
  const { profile } = useAuth();
  const slides = (promos || [])
    .map((p) => ({ p, img: resolvePromoBanner(p, profile?.currency) }))
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
        {slides.map((s, i) => (
          <img
            key={s.p.id ?? i}
            src={s.img}
            alt={s.p.title || 'Promotion'}
            className="onward-banner-img"
            onClick={() => openModal('promo', s.p)}
          />
        ))}
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
