import { useEffect, useState } from 'react';
import api from '../services/api';

// Cached fetch of the admin-uploaded page hero banners (shared across pages).
let cache = null;
let inflight = null;

export default function usePageBanner(key) {
  const [url, setUrl] = useState(cache ? (cache[key] || '') : '');
  useEffect(() => {
    let alive = true;
    const apply = (m) => { cache = m || {}; if (alive) setUrl((m && m[key]) || ''); };
    if (cache) { apply(cache); return undefined; }
    inflight = inflight || api.get('/page-banners').then((r) => r.data).catch(() => ({}));
    inflight.then(apply);
    return () => { alive = false; };
  }, [key]);
  return url;
}
