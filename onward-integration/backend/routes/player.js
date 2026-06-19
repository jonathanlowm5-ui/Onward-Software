/*
 * routes/player.js — customer (frontend) account API, JWT-authenticated.
 *
 * Public:   POST /api/player/register   POST /api/player/login
 *           POST /api/player/forgot-password   GET /api/player/lookup?username=
 * Player:   GET/PUT /api/player/me   GET /api/player/wallet
 *           POST /api/player/deposit   POST /api/player/withdraw
 *           GET /api/player/transactions   GET /api/player/game-history
 *           GET/POST /api/player/bank-accounts   POST /api/player/kyc
 *
 * Shares the same `players`, `transactions`, `kyc`, `bank_accounts` collections
 * the admin reads/writes, so everything stays in sync.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { signPlayer, requirePlayer } = require('../auth');

const router = express.Router();
const PLAYERS = 'players';
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Never leak the password hash; expose a stable shape the frontend expects.
function publicView(p) {
  if (!p) return null;
  const { passwordHash, ...rest } = p;
  return {
    ...rest,
    fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.username,
    balance: Number(p.balance || 0),
    bonus: Number(p.bonus || 0),
    kyc_status: p.kyc_status || 'unverified',
    vipLevel: p.vipLevel || 0,
  };
}

function currentPlayer(req) {
  return store.get(PLAYERS, req.auth.sub);
}

// ---------- public: register ----------
router.post('/register', (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!emailOk(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const players = store.list(PLAYERS);
  if (players.some((p) => (p.username || '').toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'That username is already taken' });
  if (players.some((p) => (p.email || '').toLowerCase() === email))
    return res.status(409).json({ error: 'That email is already registered' });

  const player = store.insert(PLAYERS, {
    username,
    email,
    firstName: String(b.first_name || b.firstName || '').trim(),
    lastName: String(b.last_name || b.lastName || '').trim(),
    fullName: String(b.full_name || b.fullName || '').trim(),
    phone: String(b.phone || '').trim(),
    country: b.country || '',
    dob: b.dob || '',
    referralCode: String(b.referral_code || b.referralCode || '').trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'player',
    status: 'active',
    balance: 0,
    bonus: 0,
    kyc_status: 'unverified',
    vipLevel: 0,
  });
  res.status(201).json({ token: signPlayer(player), player: publicView(player) });
});

// ---------- public: login (username or email) ----------
router.post('/login', (req, res) => {
  const id = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const player = store.list(PLAYERS).find(
    (p) => (p.username || '').toLowerCase() === id || (p.email || '').toLowerCase() === id
  );
  if (!player || !player.passwordHash || !bcrypt.compareSync(password, player.passwordHash))
    return res.status(401).json({ error: 'Invalid username or password' });
  if (player.status === 'blocked') return res.status(403).json({ error: 'Account is blocked' });
  res.json({ token: signPlayer(player), player: publicView(player) });
});

// ---------- public: forgot password (issues a reset acknowledgement) ----------
router.post('/forgot-password', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  // Always 200 so we never reveal which emails exist.
  if (emailOk(email)) {
    const p = store.list(PLAYERS).find((x) => (x.email || '').toLowerCase() === email);
    if (p) store.update(PLAYERS, p.id, { resetRequestedAt: new Date().toISOString() });
  }
  res.json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
});

// ---------- public: username availability ----------
router.get('/lookup', (req, res) => {
  const username = String(req.query.username || '').trim().toLowerCase();
  const exists = store.list(PLAYERS).some((p) => (p.username || '').toLowerCase() === username);
  if (exists) return res.json({ exists: true });
  res.status(404).json({ exists: false });
});

// ---------- player: profile ----------
router.get('/me', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json(publicView(p));
});

router.put('/me', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const allowed = ['firstName', 'lastName', 'fullName', 'phone', 'country', 'dob', 'avatar'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  res.json(publicView(store.update(PLAYERS, p.id, patch)));
});

// ---------- player: wallet ----------
router.get('/wallet', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json({ balance: Number(p.balance || 0), bonus: Number(p.bonus || 0) });
});

// ---------- player: deposit / withdraw (create pending transactions) ----------
router.post('/deposit', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  const amount = Number(req.body?.amount || 0);
  if (!(amount >= 100)) return res.status(400).json({ error: 'Minimum deposit is 100' });
  const tx = store.insert('transactions', {
    playerId: p.id, username: p.username, type: 'deposit', amount,
    method: req.body?.method || 'GCash', status: 'pending', note: '',
  });
  res.status(201).json(tx);
});

router.post('/withdraw', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  const amount = Number(req.body?.amount || 0);
  if (!(amount >= 500)) return res.status(400).json({ error: 'Minimum withdrawal is 500' });
  if (amount > Number(p.balance || 0)) return res.status(400).json({ error: 'Amount exceeds balance' });
  const tx = store.insert('transactions', {
    playerId: p.id, username: p.username, type: 'withdrawal', amount,
    method: req.body?.method || 'Bank', accountId: req.body?.accountId || null, status: 'pending', note: '',
  });
  res.status(201).json(tx);
});

// ---------- player: transactions & game history ----------
router.get('/transactions', requirePlayer, (req, res) => {
  const rows = store.list('transactions')
    .filter((t) => String(t.playerId) === String(req.auth.sub))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

router.get('/game-history', requirePlayer, (req, res) => {
  const rows = store.list('game_history')
    .filter((g) => String(g.playerId) === String(req.auth.sub))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

// ---------- player: bank accounts ----------
router.get('/bank-accounts', requirePlayer, (req, res) => {
  res.json(store.list('bank_accounts').filter((a) => String(a.playerId) === String(req.auth.sub)));
});

router.post('/bank-accounts', requirePlayer, (req, res) => {
  const b = req.body || {};
  const acc = store.insert('bank_accounts', {
    playerId: req.auth.sub, type: b.type || '', bank: b.type || b.bank || '',
    holder: b.holder || '', number: b.number || b.account || '',
  });
  res.status(201).json(acc);
});

// ---------- player: KYC submission ----------
router.post('/kyc', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  const b = req.body || {};
  const rec = store.insert('kyc', {
    playerId: p.id, username: p.username, docType: b.docType || 'id',
    frontUrl: b.frontUrl || '', backUrl: b.backUrl || '', selfieUrl: b.selfieUrl || '',
    status: 'pending', note: '',
  });
  store.update(PLAYERS, p.id, { kyc_status: 'pending' });
  res.status(201).json(rec);
});

module.exports = router;
