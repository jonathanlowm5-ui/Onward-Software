import { useEffect, useState } from 'react';
import api from '../services/api';

/*
 * useWebDesign — the admin's Website Design settings (sidebar logo, primary
 * button colours, withdrawal-card gradient, VIP hero background). Fetched
 * once per session (module cache); returns null until saved by the admin, so
 * the built-in design stays untouched by default.
 */
let cached;
let pending;

export default function useWebDesign() {
  const [wd, setWd] = useState(cached ?? null);

  useEffect(() => {
    if (cached !== undefined) return;
    pending = pending || api.get('/web-design')
      .then((r) => { cached = r.data && Object.keys(r.data).length ? r.data : null; return cached; })
      .catch(() => { cached = null; return null; });
    let alive = true;
    pending.then((v) => { if (alive) setWd(v); });
    return () => { alive = false; };
  }, []);

  return wd;
}
