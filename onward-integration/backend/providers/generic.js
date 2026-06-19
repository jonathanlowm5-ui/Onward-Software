/*
 * providers/generic.js — template for a REAL game aggregator.
 *
 * Enable with: AGGREGATOR=generic
 * Then fill in the two functions below to match YOUR provider's API. Almost
 * every aggregator follows the same two-call pattern:
 *
 *   1) a "game list / catalog" call            -> listGames()
 *   2) a "get launch / session URL" call        -> getLaunchUrl()
 *
 * Common conventions are scaffolded for you (base URL + key from the admin's
 * API Configuration, HMAC-signed requests). Replace the two TODO blocks with
 * the provider's real endpoints, field names, and signature scheme — those are
 * the ONLY provider-specific details. Everything else (storage, routes, the
 * frontend, the admin UI) already works.
 *
 * Requires Node 18+ (global fetch).
 */
const crypto = require('crypto');

// Map the provider's category labels onto our canonical set.
const CATEGORY_MAP = {
  slot: 'slots', slots: 'slots', video_slots: 'slots',
  live: 'live', livecasino: 'live', live_casino: 'live',
  sport: 'sports', sports: 'sports', sportsbook: 'sports',
  fish: 'fishing', fishing: 'fishing', fishhunter: 'fishing',
  crash: 'crash', instant: 'crash', arcade: 'crash',
};
const toCategory = (raw) => CATEGORY_MAP[String(raw || '').toLowerCase()] || 'slots';

// Sign a request body the way many aggregators expect (adjust to spec).
function sign(secret, payload) {
  return crypto.createHmac('sha256', secret || '').update(payload).digest('hex');
}

async function call(config, pathOrUrl, body) {
  const base = (config.baseUrl || '').replace(/\/$/, '');
  const url = /^https?:/.test(pathOrUrl) ? pathOrUrl : base + pathOrUrl;
  const json = JSON.stringify(body || {});
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': config.apiKey || '',
      'X-Signature': sign(config.apiSecret, json),
    },
    body: json,
  });
  if (!res.ok) throw new Error(`Aggregator ${res.status}: ${await res.text()}`);
  return res.json();
}

module.exports = {
  async listGames(config) {
    if (!config.baseUrl) throw new Error('Set the API Base URL in API Configuration first');

    // ---- TODO #1: replace with your provider's catalog call ------------------
    // Example shape — adjust the endpoint and response field names to spec:
    const data = await call(config, '/games/list', { environment: config.environment });
    const rows = data.games || data.items || data; // whatever the provider returns
    return rows.map((g) => ({
      externalId: String(g.id ?? g.game_id ?? g.code),
      name: g.name ?? g.title,
      provider: g.provider ?? g.vendor ?? '',
      category: toCategory(g.category ?? g.type),
      image: g.thumbnail ?? g.image ?? '',
      badge: g.is_hot ? 'hot' : g.is_new ? 'new' : '',
    }));
    // --------------------------------------------------------------------------
  },

  async getLaunchUrl(config, { game, playerId = 'guest', mode = 'real' }) {
    if (!config.baseUrl) throw new Error('Set the API Base URL in API Configuration first');

    // ---- TODO #2: replace with your provider's launch/session call -----------
    const data = await call(config, '/games/launch', {
      game_id: game.externalId || game.id,
      player_id: playerId,
      mode, // 'real' | 'demo'
      currency: 'PHP',
      lang: 'en',
      environment: config.environment,
    });
    return data.launch_url || data.url || data.gameUrl; // whatever the provider returns
    // --------------------------------------------------------------------------
  },
};
