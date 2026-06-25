/*
 * routes/aggregator.js — connects the API Configuration to a real game provider.
 *
 * GET  /api/aggregator/status            (admin)  -> { provider, configured }
 * POST /api/aggregator/import            (admin)  -> pull catalog into games
 * GET  /api/aggregator/launch/:id?player= (public) -> { url }  (frontend uses this)
 *
 * The provider reads the admin's saved API Configuration (baseUrl/apiKey/
 * apiSecret/environment), so configuring it in the admin is all that's needed.
 */
const express = require('express');
const store = require('../store');
const provider = require('../providers');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

router.get('/status', requireAuth, (req, res) => {
  const s = store.getSettings();
  res.json({ provider: provider.name, configured: !!s.baseUrl, environment: s.environment || 'development' });
});

// Pull the upstream catalog and upsert into local games (matched by externalId).
router.post('/import', requireAuth, requirePerm('content.manage'), async (req, res) => {
  try {
    const config = store.getSettings();
    const catalog = await provider.listGames(config);
    const existing = store.list('games');
    const byExternal = {};
    existing.forEach((g) => { if (g.externalId) byExternal[g.externalId] = g; });

    let imported = 0;
    let updated = 0;
    let order = existing.length;
    for (const g of catalog) {
      const record = {
        externalId: g.externalId,
        name: g.name,
        provider: g.provider || '',
        category: g.category || 'slots',
        image: g.image || '',
        badge: g.badge || '',
        launchUrl: '', // resolved on demand via /launch
      };
      const found = byExternal[g.externalId];
      if (found) {
        store.update('games', found.id, record);
        updated++;
      } else {
        store.insert('games', { ...record, enabled: true, order: order++ });
        imported++;
      }
    }
    res.json({ ok: true, provider: provider.name, imported, updated, total: catalog.length });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// Resolve a real launch URL for a game (called by the frontend on click).
router.get('/launch/:id', async (req, res) => {
  const game = store.get('games', req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const playerId = req.query.player || 'guest';
  const mode = req.query.mode === 'demo' ? 'demo' : 'real';
  try {
    // Aggregator-backed game -> ask the provider for a fresh session URL.
    if (game.externalId) {
      const url = await provider.getLaunchUrl(store.getSettings(), { game, playerId, mode });
      return res.json({ url, source: 'aggregator' });
    }
    // Plain game with a fixed URL configured in the admin.
    if (game.launchUrl) return res.json({ url: game.launchUrl, source: 'static' });
    res.status(400).json({ error: 'No launch URL configured for this game' });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
