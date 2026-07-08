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

// Admin-managed IP blocklist (Security page): settings.securityConfig.ipBlocks.
function ipBlocked(ip) {
  try {
    const list = (store.getSettings().securityConfig || {}).ipBlocks || [];
    return list.some((b) => b && (b.ip || b) === ip && (b.enabled === undefined || b.enabled !== false));
  } catch { return false; }
}

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
  if (ipBlocked(regIp)) return res.status(403).json({ error: 'Registration is not available.' });
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
  require('../marketing/auto').trigger('registration', player);
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

  // IP blocklist + country restriction checks before issuing a session.
  if (ipBlocked(clientIp(req))) return res.status(403).json({ error: 'Access is not available.' });
  const geo = await geoLookup(clientIp(req));
  if (isBlocked(store.getSettings(), geo)) {
    return res.status(403).json({ error: `Access isn’t available in your region${geo.country ? ` (${geo.country})` : ''}.` });
  }

  player = ensurePlayerCode(store, player) || player; // backfill legacy/demo players
  // Daily login streak (drives "login" missions): +1 on consecutive days,
  // unchanged on a same-day re-login, reset to 1 after a missed day.
  const today = new Date().toISOString().slice(0, 10);
  let loginStreak = Number(player.loginStreak || 0);
  if (player.lastLoginDay !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    loginStreak = player.lastLoginDay === yesterday ? loginStreak + 1 : 1;
  }
  player = store.update(PLAYERS, player.id, {
    lastLoginAt: new Date().toISOString(), lastLoginDay: today, loginStreak,
  }) || player;
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

// Welcome-bonus progress. The Promotions page shows a 4-tier welcome card;
// each tier the player claims bumps this counter. Once all 4 are claimed the
// card is hidden for good. welcomeClaimed flows into the profile via ...rest.
router.post('/welcome/claim', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const current = Math.max(0, Number(p.welcomeClaimed || 0));
  if (current >= 4) return res.json(view(p)); // already finished
  const updated = store.update(PLAYERS, p.id, { welcomeClaimed: current + 1 }) || p;
  res.json(view(updated));
});
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
  // Per-player game favourites (array of game ids/names).
  if (b.favorites !== undefined && Array.isArray(b.favorites)) {
    patch.favorites = [...new Set(b.favorites.map((x) => String(x).slice(0, 64)))].slice(0, 500);
  }

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
    store.insert('otp_log', {
      playerId: p.id, username: p.username, channel: field,
      target: field === 'email' ? p.email : p.phone, action: 'sent',
      ip: clientIp(req),
    });
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
    if (code !== String(p[`${field}Otp`])) {
      store.insert('otp_log', { playerId: p.id, username: p.username, channel: field, target: field === 'email' ? p.email : p.phone, action: 'failed', ip: clientIp(req) });
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    store.insert('otp_log', { playerId: p.id, username: p.username, channel: field, target: field === 'email' ? p.email : p.phone, action: 'verified', ip: clientIp(req) });
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
  // Responsible-gaming: self-exclusion + daily deposit limit (set in Profile).
  const limits = p.limits || {};
  if (limits.selfExcludeUntil && Date.parse(limits.selfExcludeUntil) > Date.now()) {
    return res.status(403).json({ error: `Self-exclusion active until ${String(limits.selfExcludeUntil).slice(0, 10)}` });
  }
  const dailyLimit = Number(limits.dailyDeposit || 0);
  if (dailyLimit > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const depositedToday = store.list('transactions')
      .filter((t) => String(t.playerId) === String(p.id) && t.type === 'deposit'
        && t.status !== 'rejected' && (t.createdAt || '').slice(0, 10) === today)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    if (depositedToday + amount > dailyLimit) {
      return res.status(403).json({ error: `Daily deposit limit reached (${dailyLimit.toLocaleString()} — you've deposited ${depositedToday.toLocaleString()} today)` });
    }
  }
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
  // A bound bank account AND verified identity are mandatory before any
  // withdrawal (standard anti-fraud gate).
  if (!bankBound(p.id))
    return res.status(403).json({ error: 'Please bind a bank account before withdrawing', code: 'BANK_REQUIRED' });
  if ((p.kyc_status || 'unverified') !== 'approved')
    return res.status(403).json({ error: 'Please complete KYC verification before withdrawing', code: 'KYC_REQUIRED' });
  if (!(amount >= 500)) return res.status(400).json({ error: 'Minimum withdrawal is 500' });
  if (amount > Number(p.balance || 0)) return res.status(400).json({ error: 'Amount exceeds balance' });
  const tx = store.insert('transactions', {
    playerId: p.id, username: p.username, type: 'withdrawal', amount,
    currency: normalizeCurrency(p.currency),
    method: req.body?.method || 'Bank', accountId: req.body?.accountId || null, status: 'pending', note: '',
  });
  res.status(201).json(tx);
});

// ---------- player: notification feed (header bell) ----------
// Recent account events derived from the player's transactions: credited
// rewards, deposit/withdrawal status changes. Newest first, capped at 20.
router.get('/notifications', requirePlayer, (req, res) => {
  // Marketing / automation in-app messages for this player.
  const msgs = store.list('player_messages')
    .filter((m) => String(m.playerId) === String(req.auth.sub))
    .map((m) => ({ id: m.id, icon: m.icon || '📣', text: (m.title ? m.title + ' — ' : '') + (m.text || ''), at: m.createdAt || '' }));
  const rows = store.list('transactions')
    .filter((t) => String(t.playerId) === String(req.auth.sub))
    .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
    .slice(0, 20)
    .map((t) => {
      const amt = Number(t.amount || 0);
      const cur = t.currency || 'PHP';
      let icon = '💳'; let text = '';
      if (t.type === 'bonus') {
        icon = '🎁';
        text = t.note || `Bonus credited: ${amt} ${cur}`;
      } else if (t.type === 'deposit') {
        icon = t.status === 'approved' ? '✅' : t.status === 'rejected' ? '❌' : '⏳';
        text = `Deposit of ${amt} ${cur} ${t.status === 'approved' ? 'approved' : t.status === 'rejected' ? 'rejected' : 'pending review'}`;
      } else if (t.type === 'withdrawal') {
        icon = t.status === 'approved' ? '💸' : t.status === 'rejected' ? '❌' : '⏳';
        text = `Withdrawal of ${amt} ${cur} ${t.status === 'approved' ? 'paid out' : t.status === 'rejected' ? 'rejected' : 'pending review'}`;
      } else {
        text = t.note || `${t.type} — ${amt} ${cur}`;
      }
      return { id: t.id, icon, text, at: t.updatedAt || t.createdAt || '' };
    });
  res.json([...msgs, ...rows].sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 20));
});

// ---------- player: transactions & game history ----------
router.get('/transactions', requirePlayer, (req, res) => {
  const rows = store.list('transactions')
    .filter((t) => String(t.playerId) === String(req.auth.sub))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

router.get('/game-history', requirePlayer, (req, res) => {
  // Primary source is the live bets ledger; legacy game_history rows merge in.
  const fromBets = store.list('bets')
    .filter((b) => String(b.playerId) === String(req.auth.sub))
    .map((b) => ({
      id: b.refId || b.id, game: b.game || b.gameName || 'Game',
      provider: b.provider || '', category: b.category || b.cat || '',
      wager: Number(b.amount || 0), win: Number(b.win || 0),
      createdAt: b.createdAt || '',
    }));
  const legacy = store.list('game_history')
    .filter((g) => String(g.playerId) === String(req.auth.sub));
  const rows = [...fromBets, ...legacy]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 200);
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


/* ---------- player: referral programme (every player can refer) ---------- */
// New players who enter THIS player's code (playerCode) at registration are
// counted as their referrals. Agents additionally see their agent-code downline
// on the Agent page — this endpoint is the lightweight everyone-can-share one.
router.get('/referral', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const code = p.playerCode || '';
  const referred = store.list(PLAYERS)
    .filter((x) => (x.referralCode || x.referral_code || '') === code)
    .map((x) => {
      const deps = store.list('transactions')
        .filter((t) => String(t.playerId) === String(x.id) && t.type === 'deposit' && t.status === 'approved');
      return {
        username: x.username, joined: (x.createdAt || '').slice(0, 10),
        deposited: deps.reduce((sum, t) => sum + Number(t.amount || 0), 0),
        active: deps.length > 0,
      };
    });
  const s = store.getSettings();
  res.json({
    code,
    reward: s.referralReward || '',
    total: referred.length,
    active: referred.filter((r) => r.active).length,
    referred: referred.slice(0, 100),
  });
});

/* ---------- player: wager / bonus summary (Profile → Wager panel) ---------- */
router.get('/wager', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const month = new Date().toISOString().slice(0, 7);
  const bets = store.list('bets').filter((b) => String(b.playerId) === String(p.id));
  const wageredMonth = bets.filter((b) => (b.createdAt || '').slice(0, 7) === month)
    .reduce((s2, b) => s2 + Number(b.amount || 0), 0);
  const bonuses = store.list('transactions')
    .filter((t) => String(t.playerId) === String(p.id) && t.type === 'bonus' && t.status === 'approved')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({
    bonusBalance: Number(p.bonus || 0),
    wageredMonth,
    wageredTotal: bets.reduce((s2, b) => s2 + Number(b.amount || 0), 0),
    bonuses: bonuses.slice(0, 20).map((t) => ({
      at: (t.createdAt || '').slice(0, 10), amount: Number(t.amount || 0),
      source: t.source || t.method || 'bonus', note: t.note || '',
    })),
  });
});

/* ---------- player: responsible-gaming limits (persisted + ENFORCED) ---------- */
router.get('/me/limits', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json(p.limits || {});
});
router.post('/me/limits', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const b = req.body || {};
  const limits = { ...(p.limits || {}) };
  if (b.dailyDeposit !== undefined) limits.dailyDeposit = Math.max(0, Number(b.dailyDeposit) || 0);
  if (b.sessionMinutes !== undefined) limits.sessionMinutes = Math.max(0, Number(b.sessionMinutes) || 0);
  if (b.selfExcludeDays !== undefined) {
    const days = Math.max(0, Number(b.selfExcludeDays) || 0);
    limits.selfExcludeUntil = days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : '';
  }
  store.update(PLAYERS, p.id, { limits });
  res.json(limits);
});

/* ---------- player: UI preferences (Profile → Customization) ---------- */
router.post('/me/prefs', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const prefs = { ...(p.prefs || {}), ...(req.body || {}) };
  store.update(PLAYERS, p.id, { prefs });
  res.json(prefs);
});

/* ---------- player: provably-fair seeds ---------- */
router.get('/me/fair', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const { serverSeed, ...pub } = p.fairSeeds || {};
  res.json(pub);
});
router.post('/me/fair/rotate', requirePlayer, (req, res) => {
  const p = currentPlayer(req);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const crypto = require('crypto');
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const fairSeeds = {
    clientSeed: String(req.body?.clientSeed || crypto.randomBytes(8).toString('hex')),
    serverSeedHash: crypto.createHash('sha256').update(serverSeed).digest('hex'),
    previousServerSeed: (p.fairSeeds || {}).serverSeed || '', // reveal last seed on rotation
    serverSeed, // kept server-side; revealed on the NEXT rotation
    rotatedAt: new Date().toISOString(),
  };
  store.update(PLAYERS, p.id, { fairSeeds });
  const { serverSeed: _hidden, ...pub } = fairSeeds;
  res.json(pub);
});

module.exports = router;
