/*
 * routes/games.js
 *
 * Public:  GET /api/games            (frontend; supports ?category= & ?enabled=1)
 * Admin:   POST /api/games           (add)
 *          PUT /api/games/:id        (edit)
 *          DELETE /api/games/:id     (delete)
 *          PATCH /api/games/:id/toggle (enable / disable)
 *
 * A game record:
 *   { id, name, provider, category, icon, badge, color,
 *     launchUrl, image, enabled, order, createdAt, updatedAt }
 *
 * category is one of: slots | live | sports | fishing | crash
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const COLLECTION = 'games';
const CATEGORIES = ['slots', 'live', 'sports', 'fishing', 'crash', 'table'];

function clean(body) {
  return {
    name: String(body.name || '').trim(),
    provider: String(body.provider || '').trim(),
    category: CATEGORIES.includes(body.category) ? body.category : 'slots',
    icon: body.icon || '',
    badge: body.badge || '',
    color: body.color || '',
    launchUrl: body.launchUrl || body.gameUrl || '',
    image: body.image || '',
    enabled: body.enabled === undefined ? true : !!body.enabled,
    popular: !!body.popular,
    order: Number.isFinite(+body.order) ? +body.order : 0,
  };
}

// ---- PUBLIC: list games (frontend) ----
router.get('/', (req, res) => {
  let games = store.list(COLLECTION);
  if (req.query.category) games = games.filter((g) => g.category === req.query.category);
  if (req.query.enabled === '1') games = games.filter((g) => g.enabled);
  games.sort((a, b) => (a.order || 0) - (b.order || 0));
  res.json(games);
});

// ---- PUBLIC: distinct providers (admin Providers page + frontend filters) ----
router.get('/providers', (req, res) => {
  const counts = {};
  store.list(COLLECTION).forEach((g) => {
    if (!g.provider) return;
    counts[g.provider] = (counts[g.provider] || 0) + 1;
  });
  res.json(Object.entries(counts).map(([name, games]) => ({ name, games })).sort((a, b) => a.name.localeCompare(b.name)));
});

// ---- ADMIN: import the bundled heibao catalogue (idempotent, by externalId) ----
router.post('/heibao-sync', requireAuth, requirePerm('content.manage'), (req, res) => {
  const { importMissing } = require('../heibaoImport');
  const r = importMissing(Number(req.body?.limit) || Infinity);
  if (r.remaining === 0 && r.total > 0) store.saveSettings({ heibaoImportDoneV2: true });
  res.json(r);
});

// ---- ADMIN: create ----
router.post('/', requireAuth, requirePerm('content.manage'), (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: 'Game name is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

// ---- ADMIN: update ----
router.put('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Game not found' });
  res.json(updated);
});

// ---- ADMIN: feature in Popular Games ----
router.patch('/:id/popular', requireAuth, requirePerm('content.manage'), (req, res) => {
  const game = store.get(COLLECTION, req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(store.update(COLLECTION, req.params.id, { popular: !game.popular }));
});

// ---- ADMIN: enable / disable ----
router.patch('/:id/toggle', requireAuth, requirePerm('content.manage'), (req, res) => {
  const game = store.get(COLLECTION, req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(store.update(COLLECTION, req.params.id, { enabled: !game.enabled }));
});

// ---- ADMIN: delete ----
router.delete('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Game not found' });
  res.json({ ok: true });
});

module.exports = router;
