/*
 * routes/promotions.js
 *
 * Public:  GET /api/promotions       (frontend; ?active=1 hides inactive AND expired)
 * Admin:   POST / PUT / DELETE / PATCH :id/toggle
 *
 * A promotion record:
 *   { id, image, title, description, startDate, endDate, status,
 *     buttonText, buttonLink, createdAt, updatedAt }
 *
 * status is one of: active | inactive
 * Expiry is derived from endDate (a promo past its endDate never shows on the
 * frontend, even if status is still 'active').
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'promotions';

function clean(body) {
  return {
    image: body.image || '',
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    startDate: body.startDate || '',
    endDate: body.endDate || '',
    status: body.status === 'inactive' ? 'inactive' : 'active',
    buttonText: body.buttonText || '',
    buttonLink: body.buttonLink || '',
  };
}

function isLive(p, today) {
  if (p.status !== 'active') return false;
  if (p.startDate && p.startDate > today) return false; // not started yet
  if (p.endDate && p.endDate < today) return false; // expired
  return true;
}

router.get('/', (req, res) => {
  let promos = store.list(COLLECTION);
  if (req.query.active === '1') {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    promos = promos.filter((p) => isLive(p, today));
  }
  res.json(promos);
});

router.post('/', requireAuth, (req, res) => {
  const data = clean(req.body);
  if (!data.title) return res.status(400).json({ error: 'Promotion title is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Promotion not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, (req, res) => {
  const promo = store.get(COLLECTION, req.params.id);
  if (!promo) return res.status(404).json({ error: 'Promotion not found' });
  const status = promo.status === 'active' ? 'inactive' : 'active';
  res.json(store.update(COLLECTION, req.params.id, { status }));
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Promotion not found' });
  res.json({ ok: true });
});

module.exports = router;
