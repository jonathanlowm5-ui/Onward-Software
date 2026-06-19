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

const router = express.Router();
const COLLECTION = 'players';

// Never expose the password hash.
function publicView(p) {
  const { passwordHash, ...rest } = p;
  return rest;
}

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

// ---- ADMIN: list registrations ----
router.get('/', requireAuth, (req, res) => {
  const players = store.list(COLLECTION).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
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
    playerId: p.id, type: 'adjustment', amount: sign * amount,
    method: 'admin', status: 'approved', note: req.body?.note || (sign > 0 ? 'Admin credit' : 'Admin debit'),
  });
  res.json({ playerId: p.id, balance: updated.balance });
}
router.post('/:id/wallet/credit', requireAuth, (req, res) => move(req, res, 1));
router.post('/:id/wallet/debit', requireAuth, (req, res) => move(req, res, -1));

// ---- ADMIN: delete ----
router.delete('/:id', requireAuth, (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Player not found' });
  res.json({ ok: true });
});

module.exports = router;
