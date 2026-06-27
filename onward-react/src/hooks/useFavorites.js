import { useEffect, useState, useCallback } from 'react';

/*
 * Player game favourites. Persisted to localStorage (per browser) and kept in
 * sync across every component that uses this hook via a custom window event, so
 * tapping the heart on a game card instantly updates the sidebar "Favorite"
 * view and any other card for the same game.
 */
const KEY = 'onward_favorites';
const EVENT = 'onward-favorites-changed';

function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v.map(String) : []; }
  catch { return []; }
}
function write(ids) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT));
}

export default function useFavorites() {
  const [ids, setIds] = useState(read);

  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // other tabs
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const isFavorite = useCallback((id) => ids.includes(String(id)), [ids]);
  const toggle = useCallback((id) => {
    const sid = String(id);
    const cur = read();
    const next = cur.includes(sid) ? cur.filter((x) => x !== sid) : [sid, ...cur];
    write(next);
    setIds(next);
  }, []);

  return { favorites: ids, isFavorite, toggle, count: ids.length };
}
