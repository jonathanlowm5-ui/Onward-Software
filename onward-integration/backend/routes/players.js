/*
 * routes/players.js — customer (frontend) account registrations.
 *
 * IMPORTANT: players live in their own "players" collection, completely
 * separate from the admin "users" collection. The admin login (auth.js /
 * store.findUser) only ever looks at "users", so a registered player can never
 * be used to obtain an admin token.
 *
 * Public:  POST /api/players/register   { firstName,lastName,username,email,phone,password,referralCode }
 * Admin:   GET  /api/players            list registrations (no password hashes)
 *          PATCH /api/players/:id/toggle  active <-> suspended
 *          DELETE /api/players/:id        remove a registration
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { requireAuth } = require('../auth');
const { publicView, holderMatchesPlayer, registeredFullName } = require('../playerUtils');

const router = express.Router();
const COLLECTION = 'players';

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ---- PUBLIC: register (called by the frontend register form) ----
router.post('/register', (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');

  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!emailOk(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const players = store.list(COLLECTION);
  if (players.some((p) => (p.username || '').toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'That username is already taken' });
  if (players.some((p) => (p.email || '').toLowerCase() === email))
    return res.status(409).json({ error: 'That email is already registered' });

  const player = store.insert(COLLECTION, {
    firstName: String(b.firstName || '').trim(),
    lastName: String(b.lastName || '').trim(),
    username,
    email,
    phone: String(b.phone || '').trim(),
    referralCode: String(b.referralCode || '').trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    status: 'active',
  });

  res.status(201).json({ ok: true, player: publicView(player) });
});

// ---- ADMIN: list registrations (supports ?online=1, ?vip=1) ----
const ONLINE_WINDOW_MS = 5 * 60 * 1000; // "online" = seen in the last 5 minutes
router.get('/', requireAuth, (req, res) => {
  let players = store.list(COLLECTION);
  if (req.query.online) {
    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    players = players
      .filter((p) => p.lastSeenAt && new Date(p.lastSeenAt).getTime() >= cutoff)
      .sort((a, b) => String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')));
  } else if (req.query.vip) {
    players = players
      .filter((p) => Number(p.vipLevel || 0) > 0)
      .sort((a, b) => Number(b.vipLevel || 0) - Number(a.vipLevel || 0));
  } else {
    players = players.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
  res.json(players.map(publicView));
});

// ---- ADMIN: suspend / reactivate ----
router.patch('/:id/toggle', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const status = p.status === 'active' ? 'suspended' : 'active';
  res.json(publicView(store.update(COLLECTION, req.params.id, { status })));
});

// ---- ADMIN: block / unblock ----
router.patch('/:id/block', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const blocked = req.body?.blocked === undefined ? true : !!req.body.blocked;
  res.json(publicView(store.update(COLLECTION, req.params.id, { status: blocked ? 'blocked' : 'active' })));
});

// ---- ADMIN: kick (end the player's current session without blocking) ----
// Invalidates every token issued before now; the player is logged out on their
// next request but can sign back in. Also drops them from the online list.
router.post('/:id/kick', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  store.update(COLLECTION, req.params.id, {
    sessionValidAfter: Math.floor(Date.now() / 1000),
    lastSeenAt: new Date(0).toISOString(),
  });
  res.json({ ok: true });
});

// ---- ADMIN: read a player's wallet ----
router.get('/:id/wallet', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json({ playerId: p.id, balance: Number(p.balance || 0), bonus: Number(p.bonus || 0) });
});

// ---- ADMIN: credit / debit a wallet (also records a transaction) ----
function move(req, res, sign) {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const amount = Number(req.body?.amount || 0);
  if (!(amount > 0)) return res.status(400).json({ error: 'A positive amount is required' });
  const updated = store.update(COLLECTION, req.params.id, { balance: Number(p.balance || 0) + sign * amount });
  store.insert('transactions', {
    playerId: p.id, username: p.username, currency: p.currency || 'PHP',
    type: 'adjustment', amount: sign * amount,
    method: 'admin', source: 'manual-adjustment', status: 'approved',
    note: req.body?.note || (sign > 0 ? 'Admin credit' : 'Admin debit'),
  });
  res.json({ playerId: p.id, balance: updated.balance });
}
router.post('/:id/wallet/credit', requireAuth, (req, res) => move(req, res, 1));
router.post('/:id/wallet/debit', requireAuth, (req, res) => move(req, res, -1));

// ---- ADMIN: full player detail (incl. bank + recent login history) ----
router.get('/:id', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const banks = store.list('bank_accounts').filter((a) => String(a.playerId) === String(p.id));
  const logins = store.list('login_history')
    .filter((g) => String(g.playerId) === String(p.id))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 50);
  res.json({ ...publicView(p), bankAccounts: banks, loginHistory: logins });
});

// ---- ADMIN: reset a player's password ----
router.post('/:id/reset-password', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  store.update(COLLECTION, p.id, { passwordHash: bcrypt.hashSync(newPassword, 10) });
  res.json({ ok: true });
});

// ---- ADMIN: view a player's login history ----
router.get('/:id/login-history', requireAuth, (req, res) => {
  const rows = store.list('login_history')
    .filter((g) => String(g.playerId) === String(req.params.id))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

// ---- ADMIN: view / edit a player's bank information ----
router.get('/:id/bank', requireAuth, (req, res) => {
  res.json(store.list('bank_accounts').filter((a) => String(a.playerId) === String(req.params.id)));
});

router.put('/:id/bank', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const patch = {};
  if (b.bankName !== undefined || b.bank !== undefined) {
    patch.bankName = String(b.bankName || b.bank || '').trim();
    patch.bank = patch.bankName;
  }
  if (b.holder !== undefined) patch.holder = String(b.holder).trim();
  if (b.accountNumber !== undefined || b.number !== undefined) {
    patch.accountNumber = String(b.accountNumber || b.number || '').trim();
    patch.number = patch.accountNumber;
  }
  if (b.status !== undefined) patch.status = b.status;

  const existing = store
    .list('bank_accounts')
    .find((a) => String(a.playerId) === String(p.id) && (a.status || 'active') === 'active');
  if (existing) return res.json(store.update('bank_accounts', existing.id, patch));
  // None yet — create one (admin can bind on the player's behalf).
  const acc = store.insert('bank_accounts', {
    playerId: p.id, username: p.username, status: 'active',
    bankName: patch.bankName || '', bank: patch.bankName || '',
    holder: patch.holder || '', accountNumber: patch.accountNumber || '', number: patch.accountNumber || '',
  });
  res.status(201).json(acc);
});

// ---- ADMIN: manually verify email / mobile, or set KYC status ----
router.patch('/:id/verify', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const patch = {};
  if (req.body?.email !== undefined) patch.emailVerified = !!req.body.email;
  if (req.body?.mobile !== undefined) patch.mobileVerified = !!req.body.mobile;
  if (req.body?.kyc_status !== undefined) patch.kyc_status = String(req.body.kyc_status);
  res.json(publicView(store.update(COLLECTION, p.id, patch)));
});

// ---- ADMIN: edit allowed profile fields (admin may change name/currency) ----
router.put('/:id', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const allowed = ['firstName', 'lastName', 'fullName', 'email', 'phone', 'country', 'currency', 'vipLevel', 'status'];
  const patch = {};
  allowed.forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    patch.fullName = `${patch.firstName ?? p.firstName ?? ''} ${patch.lastName ?? p.lastName ?? ''}`.trim();
  }
  res.json(publicView(store.update(COLLECTION, p.id, patch)));
});

// ---- ADMIN: delete ----
router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Player not found' });
  res.json({ ok: true });
});

module.exports = router;
