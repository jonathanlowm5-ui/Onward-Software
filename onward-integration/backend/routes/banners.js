/*
 * routes/banners.js
 *
 * Public:  GET /api/banners          (frontend; ?active=1 returns only active)
 * Admin:   POST / PUT / DELETE / PATCH :id/toggle
 *
 * A banner record:
 *   { id, image, title, subtitle, redirectUrl, active, sortOrder, createdAt, updatedAt }
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const COLLECTION = 'banners';

function clean(body) {
  return {
    image: body.image || '',
    title: String(body.title || '').trim(),
    subtitle: String(body.subtitle || '').trim(),
    redirectUrl: body.redirectUrl || '',
    active: body.active === undefined ? true : !!body.active,
    sortOrder: Number.isFinite(+body.sortOrder) ? +body.sortOrder : 0,
  };
}

router.get('/', (req, res) => {
  let banners = store.list(COLLECTION);
  if (req.query.active === '1') banners = banners.filter((b) => b.active);
  banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  res.json(banners);
});

router.post('/', requireAuth, requirePerm('content.manage'), (req, res) => {
  const data = clean(req.body);
  if (!data.image) return res.status(400).json({ error: 'Banner image is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Banner not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, requirePerm('content.manage'), (req, res) => {
  const banner = store.get(COLLECTION, req.params.id);
  if (!banner) return res.status(404).json({ error: 'Banner not found' });
  res.json(store.update(COLLECTION, req.params.id, { active: !banner.active }));
});

router.delete('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Banner not found' });
  res.json({ ok: true });
});

module.exports = router;
