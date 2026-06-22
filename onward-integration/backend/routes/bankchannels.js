/*
 * routes/bankchannels.js — bank / e-wallet / gateway channels managed on the
 * admin "Bank & Payment Gateway" page. Persisted so they drive the Manual
 * Deposit bank picker (and, later, the player deposit/withdraw options).
 *
 * Public:  GET /api/bank-channels?active=1   (enabled channels)
 * Admin:   GET /api/bank-channels            (all)
 *          POST / PUT /:id / PATCH /:id/toggle / DELETE /:id
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const COLLECTION = 'bank_channels';
const TYPES = ['bank', 'ewallet', 'crypto', 'gateway'];

function clean(b = {}) {
  return {
    n: String(b.n || b.name || '').trim(),
    type: TYPES.includes(b.type) ? b.type : 'bank',
    acct: String(b.acct || '').trim(),
    cur: String(b.cur || 'PHP').trim() || 'PHP',
    dep: b.dep ? 1 : 0,
    wd: b.wd ? 1 : 0,
    minD: String(b.minD || '').trim() || '—',
    minW: String(b.minW || '').trim() || '—',
    fee: String(b.fee || '').trim() || 'Free',
    key: String(b.key || '').trim(),
    on: b.on === undefined ? 1 : (b.on ? 1 : 0),
  };
}

router.get('/', (req, res, next) => {
  if (req.query.active === '1') {
    return res.json(store.list(COLLECTION).filter((c) => c.on));
  }
  return requireAuth(req, res, () => {
    const rows = store.list(COLLECTION).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    res.json(rows);
  });
});

router.post('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const data = clean(req.body);
  if (!data.n) return res.status(400).json({ error: 'Channel name is required' });
  res.status(201).json(store.insert(COLLECTION, data));
});

router.put('/:id', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Channel not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const c = store.get(COLLECTION, req.params.id);
  if (!c) return res.status(404).json({ error: 'Channel not found' });
  res.json(store.update(COLLECTION, req.params.id, { on: c.on ? 0 : 1 }));
});

router.delete('/:id', requireAuth, requirePerm('settings.manage'), (req, res) => {
  if (!store.remove(COLLECTION, req.params.id)) return res.status(404).json({ error: 'Channel not found' });
  res.json({ ok: true });
});

module.exports = router;
