import api from './api';
import {
  ALL_GAME_ICONS,
  GAMES,
  LIVE_GAMES,
  ALL_SLOTS,
  POPULAR_GAMES,
  PROVIDERS,
  PROMOS,
} from './data/gameData';

/**
 * Games / content service.
 *
 * Tries the live API first (so admin changes show up); if it is unreachable it
 * falls back to the bundled data extracted from the original site, exactly like
 * the original onward-api.js "offline-safe" behaviour.
 */

const CAT_MAP = { slots: 'slots', live: 'live', sports: 'sports', fishing: 'fish', crash: 'crash' };

function toCard(g) {
  return {
    id: g.id,
    name: g.name,
    provider: g.provider,
    icon: g.icon || '🎰',
    cat: CAT_MAP[g.category] || g.category || g.cat,
    badge: g.badge || '',
    color: g.color || '',
    img: g.image || g.img || '',
    launchUrl: g.launchUrl || '',
    popular: !!g.popular,
  };
}

// The catalogue is large (thousands of games), so fetch it once per session
// and share the promise between the lobby, slots and search screens.
let gamesCache = null;
export async function fetchGames() {
  if (gamesCache) return gamesCache;
  gamesCache = (async () => {
    try {
      const { data } = await api.get('/games?enabled=1');
      if (Array.isArray(data) && data.length) return data.map(toCard);
    } catch {
      /* fall through to bundled data */
    }
    return [...ALL_SLOTS]; // bundled fallback
  })();
  try { return await gamesCache; }
  catch (e) { gamesCache = null; throw e; }
}

export async function fetchBanners() {
  try {
    const { data } = await api.get('/banners?active=1');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* ignore */
  }
  return [];
}

export async function fetchPromotions() {
  try {
    const { data } = await api.get('/promotions?active=1');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* ignore */
  }
  return PROMOS;
}

export async function launchGame(id, player = 'guest') {
  try {
    const { data } = await api.get(`/aggregator/launch/${id}?player=${player}`);
    if (data?.url) return data.url;
  } catch {
    /* ignore */
  }
  return '';
}

// Re-export bundled datasets for components that render the static lobby.
export { ALL_GAME_ICONS, GAMES, LIVE_GAMES, ALL_SLOTS, POPULAR_GAMES, PROVIDERS, PROMOS };
