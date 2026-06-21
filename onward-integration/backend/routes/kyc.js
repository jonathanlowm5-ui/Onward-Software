/*
 * routes/kyc.js
 *
 * KYC submissions reviewed in the admin. Approving/rejecting writes the result
 * back onto the player record (kyc_status), which the customer frontend reads,
 * so a player's verification status updates after admin review. If an admin has
 * set a KYC approval bonus, it is credited (once) when KYC is approved.
 *
 * Admin:  GET   /api/kyc                 (?status=pending|approved|rejected)
 *         GET   /api/kyc/config          -> { kycBonus }
 *         PUT   /api/kyc/config          { kycBonus }
 *         GET   /api/kyc/:id
 *         PATCH /api/kyc/:id/approve
 *         PATCH /api/kyc/:id/reject      { reason }
 * Public: POST  /api/kyc                 (player submits documents)
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

// Attach the player's real registration data so the admin review shows the
// actual email / mobile / DOB / name (not placeholders) and verified flags.
function withPlayer(k) {
  const p = k.playerId ? store.get(PLAYERS, k.playerId) : null;
  return {
    ...k,
    player: p ? {
      username: p.username,
      playerCode: p.playerCode,
      fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
      firstName: p.firstName, lastName: p.lastName,
      email: p.email, phone: p.phone, dob: p.dob || '', country: p.country || '',
      currency: p.currency, registrationDate: p.createdAt,
      emailVerified: !!p.emailVerified, mobileVerified: !!p.mobileVerified,
      kyc_status: p.kyc_status,
    } : null,
  };
}

// Credit the configured KYC approval bonus once per player.
function giveKycBonus(player) {
  const bonus = Number(store.getSettings().kycBonus || 0);
  if (!(bonus > 0) || player.kycBonusGiven) return 0;
  store.update(PLAYERS, player.id, {
    balance: Number(player.balance || 0) + bonus,
    kycBonusGiven: true,
  });
  store.insert('transactions', {
    playerId: player.id, username: player.username, currency: player.currency || 'PHP',
    type: 'bonus', amount: bonus, method: 'promo', source: 'kyc-bonus',
    status: 'approved', note: 'KYC approval bonus',
  });
  return bonus;
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
  res.json(rows.map(withPlayer));
});

// ---- KYC approval bonus config (must be before /:id) ----
router.get('/config', requireAuth, (req, res) => {
  res.json({ kycBonus: Number(store.getSettings().kycBonus || 0) });
});
router.put('/config', requireAuth, (req, res) => {
  const kycBonus = Math.max(0, Number(req.body?.kycBonus || 0));
  store.saveSettings({ kycBonus });
  res.json({ kycBonus });
});

router.get('/:id', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  res.json(withPlayer(k));
});

// ---- approve / reject ----
router.patch('/:id/approve', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  setPlayerKyc(k.playerId, 'approved');
  let bonus = 0;
  const player = k.playerId ? store.get(PLAYERS, k.playerId) : null;
  if (player) bonus = giveKycBonus(player);
  const updated = store.update(COLLECTION, req.params.id, {
    status: 'approved', note: req.body?.note || '', bonusGiven: bonus > 0 ? bonus : (k.bonusGiven || 0),
  });
  res.json({ ...updated, bonusCredited: bonus });
});

router.patch('/:id/reject', requireAuth, (req, res) => {
  const k = store.get(COLLECTION, req.params.id);
  if (!k) return res.status(404).json({ error: 'KYC record not found' });
  setPlayerKyc(k.playerId, 'rejected');
  res.json(store.update(COLLECTION, req.params.id, { status: 'rejected', reason: req.body?.reason || '' }));
});

module.exports = router;
