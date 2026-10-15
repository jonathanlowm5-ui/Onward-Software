import { useEffect, useState } from 'react';
import { fetchPromotions } from '../services/gamesService';

// Loads the live promotions once (module-cached) and picks the "welcome / first
// deposit" promo — the lowest-sequence welcome-type promotion. Used so the
// deposit modal bonus banner and the profile "activated bonus" card both show
// the SAME admin-uploaded promotion banner artwork.
let cache; // undefined = not loaded, null/obj = resolved
let inflight = null;

function pickWelcome(promos) {
  if (!Array.isArray(promos) || !promos.length) return null;
  const isWelcome = (p) => /welcome|first/i.test(String(p.type || '')) || /welcome|1st|first/i.test(String(p.title || ''));
  const welcome = promos.filter(isWelcome);
  const pool = welcome.length ? welcome : promos;
  return pool.slice().sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))[0] || null;
}

export default function useWelcomePromo() {
  const [promo, setPromo] = useState(cache);
  useEffect(() => {
    if (cache !== undefined) { setPromo(cache); return undefined; }
    if (!inflight) {
      inflight = fetchPromotions()
        .then((p) => { cache = pickWelcome(p); return cache; })
        .catch(() => { cache = null; return null; });
    }
    let alive = true;
    inflight.then((p) => { if (alive) setPromo(p); });
    return () => { alive = false; };
  }, []);
  return promo;
}
