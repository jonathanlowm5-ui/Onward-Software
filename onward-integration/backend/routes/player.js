/*
 * routes/player.js — customer (frontend) account API, JWT-authenticated.
 *
 * Public:   POST /api/player/register   POST /api/player/login
 *           POST /api/player/forgot-password   GET /api/player/lookup?username=
 * Player:   GET/PUT /api/player/me   POST /api/player/me/change-password
 *           POST /api/player/me/2fa
 *           POST /api/player/me/verify/email/(request|confirm)
 *           POST /api/player/me/verify/mobile/(request|confirm)
 *           GET /api/player/wallet
 *           POST /api/player/deposit   POST /api/player/withdraw
 *           GET /api/player/transactions   GET /api/player/game-history
 *           GET /api/player/login-history
 *           GET/POST /api/player/bank-accounts   POST /api/player/kyc
 *
 * Shares the same `players`, `transactions`, `kyc`, `bank_accounts`,
 * `login_history` collections the admin reads/writes, so everything stays in
 * sync. Player profile rules (read-only Player ID / name / username / currency)
 * are enforced here on the server.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { signPlayer, requirePlayer } = require('../auth');
const {
  CURRENCIES, normalizeCurrency, generatePlayerCode, ensurePlayerCode,
  publicView, registeredFullName, holderMatchesPlayer, clientIp, deviceFrom, recordLogin, gen6,
} = require('../playerUtils');
const { geoLookup, isBlocked } = require('../geoip');

const router = express.Router();
const PLAYERS = 'players';
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function currentPlayer(req) {
  return store.get(PLAYERS, req.auth.sub);
}

// Does the player have an active bound bank account? (Gates withdrawals.)
function bankBound(playerId) {
  return store
    .list('bank_accounts')
    .some((a) => String(a.playerId) === String(playerId) && (a.status || 'active') === 'active');
}

// Public view + the runtime `bankBound` flag the frontend uses to decide whether
// to force the "Bind Bank Account" step on first login.
function view(p) {
  const v = publicView(p);
  if (v) v.bankBound = bankBound(p.id);
  return v;
}

// ---------- public: register ----------
router.post('/register', async (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  // Single full name (must match the player's bank account holder name exactly —
  // splitting into first/last risks mismatching the payment gateway).
  const fullName = String(b.fullName || b.full_name || b.name || `${b.first_name || ''} ${b.last_name || ''}`).trim().replace(/\s+/g, ' ');
  const mobile = String(b.mobile || b.phone || '').trim();
  const currency = normalizeCurrency(b.currency);

  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (!fullName) return res.status(400).json({ error: 'Name is required' });
  if (!emailOk(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!CURRENCIES.includes(currency)) return res.status(400).json({ error: 'Please choose a valid currency' });

  const players = store.list(PLAYERS);
  if (players.some((p) => (p.username || '').toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'That username is already taken' });
  if (players.some((p) => (p.email || '').toLowerCase() === email))
    return res.status(409).json({ error: 'That email is already registered' });

  // Geolocate the registration IP (for the admin + country restrictions).
  const regIp = clientIp(req);
  const geo = await geoLookup(regIp);
  if (isBlocked(store.getSettings(), geo)) {
    return res.status(403).json({ error: `Registration isn’t available in your region${geo.country ? ` (${geo.country})` : ''}.` });
  }

  // Permanent Player ID: ONW + random unique 7-digit number + currency.
  const playerCode = generatePlayerCode(store, currency);

  const player = store.insert(PLAYERS, {
    playerCode,
    username,
    email,
    fullName,
    phone: mobile,
    currency,
    dob: String(b.dob || b.dateOfBirth || '').trim(),
    country: b.country || '',
    referralCode: String(b.referral_code || b.referralCode || '').trim(),
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'player',
    status: 'active',
    balance: 0,
    bonus: 0,
    kyc_status: 'unverified',
    emailVerified: false,
    mobileVerified: false,
    twoFactorEnabled: false,
    vipLevel: 0,
    registrationIp: regIp,
    registrationCountry: geo.country || '',
    registrationCountryCode: geo.countryCode || '',
    registrationCity: geo.city || '',
    registrationIsp: geo.isp || '',
    registrationProxy: !!geo.proxy,
    registrationDevice: deviceFrom(req.headers['user-agent']),
    registrationUserAgent: String(req.headers['user-agent'] || ''),
  });
  await recordLogin(store, player, req, 'register');
  res.status(201).json({ token: signPlayer(player), player: view(player) });
});

// ---------- public: login (username or email) ----------
router.post('/login', async (req, res) => {
  const id = String(req.body?.username || req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  let player = store.list(PLAYERS).find(
    (p) => (p.username || '').toLowerCase() === id || (p.email || '').toLowerCase() === id
  );
  if (!player || !player.passwordHash || !bcrypt.compareSync(password, player.passwordHash))
    return res.status(401).json({ error: 'Invalid username or password' });
  if (player.status === 'blocked') return res.status(403).json({ error: 'Account is blocked' });
  if (player.status === 'suspended') return res.status(403).json({ error: 'Account is suspended — contact support' });

  // Country restriction check before issuing a session.
  const geo = await geoLookup(clientIp(req));
  if (isBlocked(store.getSettings(), geo)) {
    return res.status(403).json({ error: `Access isn’t available in your region${geo.country ? ` (${geo.country})` : ''}.` });
  }

  player = ensurePlayerCode(store, player) || player; // backfill legacy/demo players
  player = store.update(PLAYERS, player.id, { lastLoginAt: new Date().toISOString() }) || player;
  await recordLogin(store, player, req, 'login');
  res.json({ token: signPlayer(player), player: view(player) });
});

// ---------- public: forgot password (issues a reset acknowledgement) ----------
router.post('/forgot-password', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
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
  let p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  p = ensurePlayerCode(store, p) || p;
  // Heartbeat for "online" tracking (the frontend polls /me ~every 30s) and
  // reports the player's current section via ?loc=. Throttled so we don't write
  // on every poll, but we also write immediately when the section changes.
  const loc = String(req.query.loc || '').trim().slice(0, 32);
  const last = p.lastSeenAt ? new Date(p.lastSeenAt).getTime() : 0;
  const stale = Date.now() - last > 20000;
  if (stale || (loc && loc !== p.currentPage)) {
    p = store.update(PLAYERS, p.id, {
      lastSeenAt: new Date().toISOString(),
      ...(loc ? { currentPage: loc } : {}),
    }) || p;
  }
  res.json(view(p));
});

// Players may ONLY change email, mobile and avatar. Player ID, username, first
// name, last name, registration date and currency are system-fixed (admin only).
router.put('/me', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const patch = {};

  if (b.email !== undefined) {
    const email = String(b.email).trim().toLowerCase();
    if (!emailOk(email)) return res.status(400).json({ error: 'A valid email is required' });
    const taken = store.list(PLAYERS).some(
      (x) => x.id !== p.id && (x.email || '').toLowerCase() === email
    );
    if (taken) return res.status(409).json({ error: 'That email is already in use' });
    if (email !== (p.email || '').toLowerCase()) {
      patch.email = email;
      patch.emailVerified = false; // re-verify after a change
    }
  }
  const mobile = b.mobile !== undefined ? b.mobile : b.phone;
  if (mobile !== undefined) {
    patch.phone = String(mobile).trim();
    if (patch.phone !== (p.phone || '')) patch.mobileVerified = false;
  }
  if (b.avatar !== undefined) patch.avatar = b.avatar;

  res.json(view(store.update(PLAYERS, p.id, patch)));
});

// ---------- player: change password ----------
router.post('/me/change-password', requirePlayer, async (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (!p.passwordHash || !bcrypt.compareSync(current, p.passwordHash))
    return res.status(400).json({ error: 'Current password is incorrect' });
  if (next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  store.update(PLAYERS, p.id, { passwordHash: bcrypt.hashSync(next, 10) });
  await recordLogin(store, p, req, 'password-change');
  res.json({ ok: true });
});

// ---------- player: two-factor toggle (mock — stores the preference) ----------
router.post('/me/2fa', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const enabled = !!req.body?.enabled;
  res.json(view(store.update(PLAYERS, p.id, { twoFactorEnabled: enabled })));
});

// ---------- player: email / mobile verification (mock code sender) ----------
function requestCode(field) {
  return (req, res) => {
    const p = currentPlayer(req);
    if (!p) return res.status(404).json({ error: 'Player not found' });
    const code = gen6();
    const expires = Date.now() + 10 * 60 * 1000;
    store.update(PLAYERS, p.id, { [`${field}Otp`]: code, [`${field}OtpExpires`]: expires });
    // MOCK: a real build emails / SMSes the code. We return it as devCode so the
    // flow is testable end-to-end now; remove devCode when a provider is wired.
    res.json({ ok: true, message: `Verification code sent to your ${field}.`, devCode: code });
  };
}
function confirmCode(field) {
  return (req, res) => {
    const p = currentPlayer(req);
    if (!p) return res.status(404).json({ error: 'Player not found' });
    const code = String(req.body?.code || '').trim();
    if (!p[`${field}Otp`] || Date.now() > Number(p[`${field}OtpExpires`] || 0))
      return res.status(400).json({ error: 'Code expired — request a new one' });
    if (code !== String(p[`${field}Otp`]))
      return res.status(400).json({ error: 'Invalid verification code' });
    const flag = field === 'email' ? 'emailVerified' : 'mobileVerified';
    res.json(view(store.update(PLAYERS, p.id, { [flag]: true, [`${field}Otp`]: null, [`${field}OtpExpires`]: null })));
  };
}
router.post('/me/verify/email/request', requirePlayer, requestCode('email'));
router.post('/me/verify/email/confirm', requirePlayer, confirmCode('email'));
router.post('/me/verify/mobile/request', requirePlayer, requestCode('mobile'));
router.post('/me/verify/mobile/confirm', requirePlayer, confirmCode('mobile'));

// ---------- player: wallet ----------
router.get('/wallet', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json({ balance: Number(p.balance || 0), bonus: Number(p.bonus || 0), currency: normalizeCurrency(p.currency) });
});

// ---------- player: deposit / withdraw (create pending transactions) ----------
router.post('/deposit', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  const amount = Number(req.body?.amount || 0);
  if (!(amount >= 100)) return res.status(400).json({ error: 'Minimum deposit is 100' });
  const tx = store.insert('transactions', {
    playerId: p.id, username: p.username, type: 'deposit', amount,
    currency: normalizeCurrency(p.currency),
    method: req.body?.method || 'GCash', status: 'pending', note: '',
  });
  res.status(201).json(tx);
});

router.post('/withdraw', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  const amount = Number(req.body?.amount || 0);
  // A bound bank account is mandatory before any withdrawal.
  if (!bankBound(p.id))
    return res.status(403).json({ error: 'Please bind a bank account before withdrawing', code: 'BANK_REQUIRED' });
  if (!(amount >= 500)) return res.status(400).json({ error: 'Minimum withdrawal is 500' });
  if (amount > Number(p.balance || 0)) return res.status(400).json({ error: 'Amount exceeds balance' });
  const tx = store.insert('transactions', {
    playerId: p.id, username: p.username, type: 'withdrawal', amount,
    currency: normalizeCurrency(p.currency),
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

// ---------- player: own login history ----------
router.get('/login-history', requirePlayer, (req, res) => {
  const rows = store.list('login_history')
    .filter((g) => String(g.playerId) === String(req.auth.sub))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 50);
  res.json(rows);
});

// ---------- player: bank accounts (up to 2 active, name must match) ----------
const MAX_BANK_ACCOUNTS = 2;
router.get('/bank-accounts', requirePlayer, (req, res) => {
  res.json(
    store.list('bank_accounts').filter((a) => String(a.playerId) === String(req.auth.sub))
  );
});

router.post('/bank-accounts', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const bankName = String(b.bankName || b.bank || b.type || '').trim();
  const holder = String(b.holder || b.accountHolder || '').trim();
  const accountNumber = String(b.accountNumber || b.number || b.account || '').trim();

  if (!bankName) return res.status(400).json({ error: 'Bank name is required' });
  if (!holder) return res.status(400).json({ error: 'Account holder name is required' });
  if (!accountNumber) return res.status(400).json({ error: 'Bank account number is required' });
  // Account holder must match the player's registered name.
  if (!holderMatchesPlayer(p, holder))
    return res.status(400).json({ error: `Account holder must match your registered name (${registeredFullName(p)})` });
  // Up to two active bank accounts are allowed.
  const activeAccts = store
    .list('bank_accounts')
    .filter((a) => String(a.playerId) === String(p.id) && (a.status || 'active') === 'active');
  if (activeAccts.length >= MAX_BANK_ACCOUNTS)
    return res.status(409).json({ error: `You can have at most ${MAX_BANK_ACCOUNTS} bank accounts. Contact support to change one.` });
  // No exact duplicates.
  if (activeAccts.some((a) => String(a.accountNumber || a.number) === accountNumber && (a.bankName || a.bank) === bankName))
    return res.status(409).json({ error: 'That bank account is already saved.' });

  const acc = store.insert('bank_accounts', {
    playerId: p.id,
    username: p.username,
    bankName,
    bank: bankName, // backward-compat with older readers
    holder,
    accountNumber,
    number: accountNumber, // backward-compat
    status: 'active',
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
