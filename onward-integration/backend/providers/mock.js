/*
 * providers/mock.js — a fully working aggregator stand-in.
 *
 * Lets you exercise catalog import + on-demand launch URLs end-to-end with no
 * external service. Swap AGGREGATOR=generic (and fill in generic.js) when you
 * have a real provider.
 */
const crypto = require('crypto');

const CATALOG = [
  { externalId: 'pg-fortune-dragon', name: 'Fortune Dragon', provider: 'PG Soft', category: 'slots', badge: 'hot', image: 'https://placehold.co/300x300/162035/f0c040?text=Dragon' },
  { externalId: 'jili-gold-tiger', name: 'Gold Tiger', provider: 'Jili', category: 'slots', badge: 'new', image: 'https://placehold.co/300x300/1e2d47/daa520?text=Tiger' },
  { externalId: 'mg-lucky-koi', name: 'Lucky Koi', provider: 'Microgaming', category: 'slots', image: 'https://placehold.co/300x300/0c1120/008b8b?text=Koi' },
  { externalId: 'spribe-aviator', name: 'Aviator', provider: 'Spribe', category: 'crash', badge: 'hot', image: 'https://placehold.co/300x300/162035/dc143c?text=Aviator' },
  { externalId: 'evo-lightning-roulette', name: 'Lightning Roulette', provider: 'Evolution', category: 'live', badge: 'hot', image: 'https://placehold.co/300x300/1e2d47/228b22?text=Roulette' },
  { externalId: 'jili-ocean-king', name: 'Ocean King', provider: 'Jili', category: 'fishing', image: 'https://placehold.co/300x300/0c1120/1e90ff?text=Ocean' },
];

module.exports = {
  async listGames(/* config */) {
    return CATALOG;
  },

  async getLaunchUrl(config, { game, playerId = 'guest', mode = 'real' }) {
    // Mimic a real aggregator: sign a request and return a tokenised URL.
    const key = (config && config.apiKey) || 'demo-key';
    const secret = (config && config.apiSecret) || 'demo-secret';
    const ext = game.externalId || game.id;
    const payload = `${ext}|${playerId}|${mode}|${Date.now()}`;
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 24);
    const base = (config && config.baseUrl) || 'https://demo-aggregator.example.com';
    return `${base.replace(/\/api$/, '')}/launch/${encodeURIComponent(ext)}?key=${key}&player=${encodeURIComponent(playerId)}&mode=${mode}&token=${token}`;
  },
};
