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
const { requirePerm } = require('../permissions');
const { publicView, holderMatchesPlayer, registeredFullName } = require('../playerUtils');
const { isPrivate } = require('../geoip');

const router = express.Router();
const COLLECTION = 'players';

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Build an index of public IP -> set of player IDs (from registration, last
// login and the full login history). Private/LAN IPs are ignored so shared
// office/dev networks don't trigger false "same IP" fraud flags.
function buildIpIndex(store) {
  const map = new Map();
  const add = (ip, pid) => {
    if (!ip || isPrivate(ip)) return;
    const k = String(ip);
    if (!map.has(k)) map.set(k, new Set());
    map.get(k).add(String(pid));
  };
  store.list(COLLECTION).forEach((p) => { add(p.registrationIp, p.id); add(p.lastIp, p.id); });
  store.list('login_history').forEach((l) => add(l.ip, l.playerId));
  return map;
}

// IPs a player has used + how many OTHER accounts share any of them.
function sharedFor(map, p) {
  const ips = [...new Set([p.registrationIp, p.lastIp].filter((ip) => ip && !isPrivate(ip)).map(String))];
  const others = new Set();
  ips.forEach((ip) => (map.get(ip) || new Set()).forEach((pid) => { if (pid !== String(p.id)) others.add(pid); }));
  return { sharedIpCount: others.size, sharedIpFlag: others.size > 0, ips };
}

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
  const ipIndex = buildIpIndex(store);
  res.json(players.map((p) => {
    const s = sharedFor(ipIndex, p);
    return { ...publicView(p), sharedIpCount: s.sharedIpCount, sharedIpFlag: s.sharedIpFlag };
  }));
});

// ---- ADMIN: country / geo-block configuration (must be before /:id) ----
router.get('/geo-block/config', requireAuth, (req, res) => {
  const s = store.getSettings();
  res.json({ enabled: !!s.geoBlockEnabled, countries: Array.isArray(s.blockedCountries) ? s.blockedCountries : [] });
});
router.put('/geo-block/config', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const enabled = !!req.body?.enabled;
  const countries = Array.isArray(req.body?.countries)
    ? [...new Set(req.body.countries.map((c) => String(c).toUpperCase().trim().slice(0, 2)).filter(Boolean))]
    : [];
  store.saveSettings({ geoBlockEnabled: enabled, blockedCountries: countries });
  res.json({ enabled, countries });
});

// ---- ADMIN: suspend / reactivate ----
router.patch('/:id/toggle', requireAuth, requirePerm('players.status'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const status = p.status === 'active' ? 'suspended' : 'active';
  res.json(publicView(store.update(COLLECTION, req.params.id, { status })));
});

// ---- ADMIN: block / unblock ----
router.patch('/:id/block', requireAuth, requirePerm('players.status'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const blocked = req.body?.blocked === undefined ? true : !!req.body.blocked;
  res.json(publicView(store.update(COLLECTION, req.params.id, { status: blocked ? 'blocked' : 'active' })));
});

// ---- ADMIN: kick (end the player's current session without blocking) ----
// Invalidates every token issued before now; the player is logged out on their
// next request but can sign back in. Also drops them from the online list.
router.post('/:id/kick', requireAuth, requirePerm('players.kick'), (req, res) => {
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
router.post('/:id/wallet/credit', requireAuth, requirePerm('players.adjust'), (req, res) => move(req, res, 1));
router.post('/:id/wallet/debit', requireAuth, requirePerm('players.adjust'), (req, res) => move(req, res, -1));

// ---- ADMIN: manual deposit (credits the wallet + records a DEPOSIT, not an
// adjustment) — requires the bank/channel the funds were received into. ----
router.post('/:id/wallet/deposit', requireAuth, requirePerm('players.adjust'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const amount = Number(req.body?.amount || 0);
  if (!(amount > 0)) return res.status(400).json({ error: 'A positive amount is required' });
  const bank = String(req.body?.bank || '').trim();
  if (!bank) return res.status(400).json({ error: 'Please choose the bank of deposit' });
  const reference = String(req.body?.reference || '').trim();
  const updated = store.update(COLLECTION, req.params.id, { balance: Number(p.balance || 0) + amount });
  const txn = store.insert('transactions', {
    playerId: p.id, username: p.username, currency: p.currency || 'PHP',
    type: 'deposit', amount,
    method: bank, bank, source: 'manual-deposit', status: 'approved',
    reference: reference || undefined,
    note: req.body?.note || `Manual deposit via ${bank}`,
  });
  res.json({ playerId: p.id, balance: updated.balance, transaction: txn });
});

// ---- ADMIN: full player detail (incl. bank + login history + shared-IP accounts) ----
router.get('/:id', requireAuth, (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const banks = store.list('bank_accounts').filter((a) => String(a.playerId) === String(p.id));
  const logins = store.list('login_history')
    .filter((g) => String(g.playerId) === String(p.id))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 50);

  // Other accounts that have shared any of this player's public IPs.
  const ipIndex = buildIpIndex(store);
  const s = sharedFor(ipIndex, p);
  const relatedIds = new Set();
  s.ips.forEach((ip) => (ipIndex.get(ip) || new Set()).forEach((pid) => { if (pid !== String(p.id)) relatedIds.add(pid); }));
  const relatedAccounts = [...relatedIds].map((pid) => {
    const o = store.get(COLLECTION, pid);
    if (!o) return null;
    const sharedIps = s.ips.filter((ip) => String(o.registrationIp) === ip || String(o.lastIp) === ip);
    return { id: o.id, username: o.username, playerCode: o.playerCode, status: o.status, sharedIps };
  }).filter(Boolean);

  res.json({
    ...publicView(p),
    bankAccounts: banks,
    loginHistory: logins,
    sharedIpCount: relatedAccounts.length,
    sharedIpFlag: relatedAccounts.length > 0,
    relatedAccounts,
  });
});

// ---- ADMIN: reset a player's password ----
router.post('/:id/reset-password', requireAuth, requirePerm('players.resetpw'), (req, res) => {
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

router.put('/:id/bank', requireAuth, requirePerm('players.edit'), (req, res) => {
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
router.patch('/:id/verify', requireAuth, requirePerm('players.edit'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const patch = {};
  if (req.body?.email !== undefined) patch.emailVerified = !!req.body.email;
  if (req.body?.mobile !== undefined) patch.mobileVerified = !!req.body.mobile;
  if (req.body?.kyc_status !== undefined) patch.kyc_status = String(req.body.kyc_status);
  res.json(publicView(store.update(COLLECTION, p.id, patch)));
});

// ---- ADMIN: edit player profile (admin may change anything, incl. username) ----
router.put('/:id', requireAuth, requirePerm('players.edit'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const patch = {};

  // Username — must stay unique.
  if (b.username !== undefined) {
    const u = String(b.username).trim();
    if (u && u.toLowerCase() !== (p.username || '').toLowerCase()) {
      const taken = store.list(COLLECTION).some((x) => x.id !== p.id && (x.username || '').toLowerCase() === u.toLowerCase());
      if (taken) return res.status(409).json({ error: 'That username is already taken' });
      patch.username = u;
    }
  }
  // Email — must stay unique.
  if (b.email !== undefined) {
    const e = String(b.email).trim().toLowerCase();
    if (e && e !== (p.email || '').toLowerCase()) {
      const taken = store.list(COLLECTION).some((x) => x.id !== p.id && (x.email || '').toLowerCase() === e);
      if (taken) return res.status(409).json({ error: 'That email is already in use' });
      patch.email = e;
    }
  }
  // Single full name (must match the bank holder name — no first/last split).
  const fullName = b.fullName ?? b.realName ?? b.name;
  if (fullName !== undefined) patch.fullName = String(fullName).trim().replace(/\s+/g, ' ');
  if (b.phone !== undefined || b.mobile !== undefined) patch.phone = String(b.phone ?? b.mobile).trim();
  if (b.dob !== undefined) patch.dob = String(b.dob).trim();
  if (b.country !== undefined) patch.country = b.country;
  if (b.currency !== undefined) patch.currency = String(b.currency).toUpperCase();
  if (b.vipLevel !== undefined) patch.vipLevel = Math.max(0, Number(b.vipLevel) || 0);
  if (b.status !== undefined && ['active', 'suspended', 'blocked'].includes(b.status)) patch.status = b.status;
  else if (b.active !== undefined) patch.status = b.active ? 'active' : 'suspended';

  res.json(publicView(store.update(COLLECTION, p.id, patch)));
});

// ---- ADMIN: delete (cascades — removes the player AND all their data) ----
router.delete('/:id', requireAuth, requirePerm('players.delete'), (req, res) => {
  const p = store.get(COLLECTION, req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  let removed = 0;
  ['transactions', 'kyc', 'bank_accounts', 'login_history', 'game_history'].forEach((c) => {
    store.list(c)
      .filter((r) => String(r.playerId) === String(p.id))
      .forEach((r) => { if (store.remove(c, r.id)) removed += 1; });
  });
  store.remove(COLLECTION, p.id);
  res.json({ ok: true, deletedRelated: removed });
});

module.exports = router;
