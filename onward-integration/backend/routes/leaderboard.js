/*
 * routes/leaderboard.js
 *
 * Public:  GET /api/leaderboard         (frontend; sorted by points desc)
 * Admin:   POST / PUT / DELETE
 *
 * A leaderboard entry:
 *   { id, name, points, createdAt, updatedAt }
 *
 * Backs the v16.2 "/leaderboard" category page (weekly top players). Rank is
 * derived from points order at read time, so admins only manage name + points.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'leaderboard';

function clean(body) {
  return {
    name: String(body.name || '').trim(),
    points: Number.isFinite(+body.points) ? +body.points : 0,
  };
}

router.get('/', (req, res) => {
  const rows = store.list(COLLECTION)
    .slice()
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .map((r, i) => ({ ...r, rank: i + 1 }));
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: 'Player name is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Entry not found' });
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Entry not found' });
  res.json({ ok: true });
});

module.exports = router;
