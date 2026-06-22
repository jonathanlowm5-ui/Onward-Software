/*
 * routes/notifications.js
 *
 * Notifications created in the admin and delivered to players on the frontend.
 *
 * Admin:  GET    /api/notifications           (?audience= &status=)
 *         POST   /api/notifications           (create draft)
 *         DELETE /api/notifications/:id
 *         POST   /api/notifications/:id/send   (mark as sent)
 * Public: GET    /api/notifications?active=1   (frontend reads sent ones)
 *
 * A notification: { id, title, body, audience, status, createdAt, sentAt }
 *   status: draft | sent
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'notifications';

// ---- list ---- (public when ?active=1, else admin)
router.get('/', (req, res, next) => {
  if (req.query.active === '1') {
    const rows = store.list(COLLECTION).filter((n) => n.status === 'sent');
    rows.sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''));
    return res.json(rows);
  }
  return requireAuth(req, res, () => {
    let rows = store.list(COLLECTION);
    if (req.query.audience) rows = rows.filter((n) => n.audience === req.query.audience);
    if (req.query.status) rows = rows.filter((n) => n.status === req.query.status);
    rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(rows);
  });
});

router.post('/', requireAuth, (req, res) => {
  const b = req.body || {};
  res.status(201).json(store.insert(COLLECTION, {
    title: String(b.title || '').trim(),
    body: String(b.body || '').trim(),
    audience: b.audience || 'all',
    status: 'draft',
  }));
});

router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id)) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

router.post('/:id/send', requireAuth, (req, res) => {
  const n = store.get(COLLECTION, req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  res.json(store.update(COLLECTION, req.params.id, { status: 'sent', sentAt: new Date().toISOString() }));
});

module.exports = router;
