import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/*
 * Per-player game favourites.
 *  - Logged in: stored on the player's account (PUT /player/me { favorites }),
 *    so they're tied to that player and follow them across devices/browsers.
 *  - Guest: kept in localStorage until they log in.
 * A shared module state + window event keeps every game card and the sidebar
 * "Favorite" view in sync the instant a heart is tapped.
 */
const GUEST_KEY = 'onward_favorites';
const EVENT = 'onward-favorites-changed';

let favState = [];     // current favourites (string ids)
let seededFor = null;  // 'guest' | <playerId> — which source favState came from

function emit() { window.dispatchEvent(new Event(EVENT)); }
function readGuest() {
  try { const v = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]'); return Array.isArray(v) ? v.map(String) : []; }
  catch { return []; }
}
function writeGuest(ids) { try { localStorage.setItem(GUEST_KEY, JSON.stringify(ids)); } catch { /* unavailable */ } }
function clearGuest() { try { localStorage.removeItem(GUEST_KEY); } catch { /* unavailable */ } }

export default function useFavorites() {
  const { isLoggedIn, profile, updateProfile } = useAuth();
  const [, force] = useState(0);

  // Seed the shared state from the right source whenever the player changes.
  useEffect(() => {
    const key = isLoggedIn && profile ? String(profile.id) : 'guest';
    if (seededFor === key) return;
    if (key === 'guest') {
      favState = readGuest();
    } else {
      const acct = Array.isArray(profile?.favorites) ? profile.favorites.map(String) : [];
      const guest = readGuest();
      if (acct.length === 0 && guest.length > 0) {
        // First login after favouriting as a guest — migrate those onto the
        // account once, then clear the browser copy so it can't leak to others.
        favState = guest;
        updateProfile({ favorites: guest }).catch(() => {});
        clearGuest();
      } else {
        favState = acct;
      }
    }
    seededFor = key;
    emit();
  }, [isLoggedIn, profile, updateProfile]);

  // Re-render this component when favourites change anywhere.
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync); // other tabs (guest)
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  const isFavorite = (id) => favState.includes(String(id));
  const toggle = useCallback((id) => {
    const sid = String(id);
    const next = favState.includes(sid) ? favState.filter((x) => x !== sid) : [sid, ...favState];
    favState = next;
    emit(); // instant UI update everywhere
    if (isLoggedIn) updateProfile({ favorites: next }).catch(() => {});
    else writeGuest(next);
  }, [isLoggedIn, updateProfile]);

  return { favorites: [...favState], isFavorite, toggle, count: favState.length };
}
