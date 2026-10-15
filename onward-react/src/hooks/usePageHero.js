import { useEffect, useState } from 'react';
import api from '../services/api';

// Cached fetch of the admin-editable page hero text ({ key: {eyebrow,title,desc} }).
let cache = null;
let inflight = null;

export default function usePageHero(key) {
  const [hero, setHero] = useState(cache ? (cache[key] || {}) : {});
  useEffect(() => {
    let alive = true;
    const apply = (m) => { cache = m || {}; if (alive) setHero((m && m[key]) || {}); };
    if (cache) { apply(cache); return undefined; }
    inflight = inflight || api.get('/page-banners/text').then((r) => r.data).catch(() => ({}));
    inflight.then(apply);
    return () => { alive = false; };
  }, [key]);
  return hero || {};
}
