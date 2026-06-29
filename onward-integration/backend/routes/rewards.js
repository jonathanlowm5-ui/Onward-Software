/*
 * routes/rewards.js
 *
 * Public:  GET /api/rewards             (frontend; ?active=1 returns only active)
 * Admin:   POST / PUT / DELETE / PATCH :id/toggle
 *
 * A reward record (Rewards Club store item):
 *   { id, icon, name, cost, active, sortOrder, createdAt, updatedAt }
 *
 * Backs the v16.2 "/rewards" category page (Rewards store).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'rewards';

function clean(body) {
  return {
    icon: String(body.icon || '🎁').trim(),
    name: String(body.name || '').trim(),
    cost: Number.isFinite(+body.cost) ? +body.cost : 0,
    active: body.active === undefined ? true : !!body.active,
    sortOrder: Number.isFinite(+body.sortOrder) ? +body.sortOrder : 0,
  };
}

router.get('/', (req, res) => {
  let rows = store.list(COLLECTION);
  if (req.query.active === '1') rows = rows.filter((r) => r.active);
  rows.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: 'Reward name is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Reward not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, (req, res) => {
  const row = store.get(COLLECTION, req.params.id);
  if (!row) return res.status(404).json({ error: 'Reward not found' });
  res.json(store.update(COLLECTION, req.params.id, { active: !row.active }));
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Reward not found' });
  res.json({ ok: true });
});

module.exports = router;
