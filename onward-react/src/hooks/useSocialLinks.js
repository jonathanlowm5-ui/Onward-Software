import { useEffect, useState } from 'react';
import api from '../services/api';

// Fetches the casino's official social-media links once (module-cached) for the
// footer "Follow Us" row. Returns { facebook, telegram, ... } (empty = not set).
let cache = null;
let inflight = null;

export default function useSocialLinks() {
  const [links, setLinks] = useState(cache || {});
  useEffect(() => {
    if (cache) { setLinks(cache); return undefined; }
    if (!inflight) {
      inflight = api.get('/social-links')
        .then((r) => { cache = r.data || {}; return cache; })
        .catch(() => { cache = {}; return cache; });
    }
    let alive = true;
    inflight.then((d) => { if (alive) setLinks(d); });
    return () => { alive = false; };
  }, []);
  return links;
}
