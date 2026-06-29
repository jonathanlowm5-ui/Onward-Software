/*
 * routes/sponsors.js
 *
 * Public:  GET /api/sponsors            (frontend; ?active=1 returns only active)
 * Admin:   POST / PUT / DELETE / PATCH :id/toggle
 *
 * A sponsor record:
 *   { id, icon, name, tier, link, active, sortOrder, createdAt, updatedAt }
 *
 * Backs the v16.2 "/sponsors" category page (Official partnerships).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'sponsors';

function clean(body) {
  return {
    icon: String(body.icon || '🏆').trim(),
    name: String(body.name || '').trim(),
    tier: String(body.tier || '').trim(),
    link: body.link || '',
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
  if (!data.name) return res.status(400).json({ error: 'Sponsor name is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Sponsor not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, (req, res) => {
  const row = store.get(COLLECTION, req.params.id);
  if (!row) return res.status(404).json({ error: 'Sponsor not found' });
  res.json(store.update(COLLECTION, req.params.id, { active: !row.active }));
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Sponsor not found' });
  res.json({ ok: true });
});

module.exports = router;
