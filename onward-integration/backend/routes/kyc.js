/*
 * routes/kyc.js
 *
 * KYC submissions reviewed in the admin. Approving/rejecting writes the result
 * back onto the player record (kyc_status), which the customer frontend reads,
 * so a player's verification status updates after admin review.
 *
 * Admin:  GET   /api/kyc                 (?status=pending|approved|rejected)
 *         GET   /api/kyc/:id
 *         PATCH /api/kyc/:id/approve
 *         PATCH /api/kyc/:id/reject      { reason }
 * Public: POST  /api/kyc                 (player submits documents)
 *
 * A KYC record: { id, playerId, username, docType, frontUrl, backUrl,
 *                 selfieUrl, status, note, createdAt }
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const COLLECTION = 'kyc';
const PLAYERS = 'players';

function setPlayerKyc(playerId, status) {
  if (!playerId) return;
  if (store.get(PLAYERS, playerId)) store.update(PLAYERS, playerId, { kyc_status: status });
}

// ---- submit (frontend) ----
router.post('/', (req, res) => {
  const b = req.body || {};
  const rec = store.insert(COLLECTION, {
    playerId: b.playerId || null,
    username: b.username || '',
    docType: b.docType || 'id',
    frontUrl: b.frontUrl || '',
    backUrl: b.backUrl || '',
    selfieUrl: b.selfieUrl || '',
    status: 'pending',
    note: '',
  });
  setPlayerKyc(rec.playerId, 'pending');
  res.status(201).json(rec);
});

// ---- list (admin) ----
router.get('/', requireAuth, (req, res) => {
  let rows = store.list(COLLECTION);
  if (req.query.status) rows = rows.filter((k) => k.status === req.query.status);
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

router.get('/:id', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  res.json(k);
});

// ---- approve / reject ----
router.patch('/:id/approve', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  setPlayerKyc(k.playerId, 'approved');
  res.json(store.update(COLLECTION, req.params.id, { status: 'approved', note: req.body?.note || '' }));
});

router.patch('/:id/reject', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  setPlayerKyc(k.playerId, 'rejected');
  res.json(store.update(COLLECTION, req.params.id, { status: 'rejected', reason: req.body?.reason || '' }));
});

module.exports = router;
