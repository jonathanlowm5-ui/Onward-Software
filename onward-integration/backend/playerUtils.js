/*
 * playerUtils.js — shared player helpers used by the player-facing API
 * (routes/player.js) and the admin API (routes/players.js) so both produce a
 * consistent player shape and the permanent Player ID is generated one way.
 *
 * Player ID format:  ONW0002918PHP
 *   ONW      platform code (constant)
 *   0002918  7-digit zero-padded auto-increment sequence (permanent)
 *   PHP      player's currency at registration
 */
const PLATFORM_CODE = 'ONW';

// Currencies offered at registration; the 3-letter code is baked into Player ID.
const CURRENCIES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];

const normalizeCurrency = (c) => {
  const up = String(c || '').toUpperCase().trim();
  return CURRENCIES.includes(up) ? up : 'PHP';
};

// Monotonic counter kept in settings. Single-threaded per function instance, so
// this is safe for our volume; bump to a Firestore transaction if you ever need
// strict cross-instance guarantees.
function nextPlayerSequence(store) {
  const s = store.getSettings() || {};
  const next = Number(s.playerSeq || 0) + 1;
  store.saveSettings({ playerSeq: next });
  return next;
}

const makePlayerCode = (seq, currency) =>
  `${PLATFORM_CODE}${String(seq).padStart(7, '0')}${normalizeCurrency(currency)}`;

// Assign a permanent Player ID the first time we see a player without one
// (covers the seeded demo player and any pre-existing records). Idempotent.
function ensurePlayerCode(store, player) {
  if (!player || player.playerCode) return player;
  const seq = nextPlayerSequence(store);
  return store.update('players', player.id, {
    seq,
    playerCode: makePlayerCode(seq, player.currency || 'PHP'),
  });
}

// Canonical, safe-to-send player shape. Strips secrets (hash, OTP codes).
function publicView(p) {
  if (!p) return null;
  const {
    passwordHash, emailOtp, emailOtpExpires, mobileOtp, mobileOtpExpires, twoFactorSecret, ...rest
  } = p;
  const fullName =
    p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.username;
  return {
    ...rest,
    fullName,
    playerCode: p.playerCode || '',
    currency: normalizeCurrency(p.currency),
    balance: Number(p.balance || 0),
    bonus: Number(p.bonus || 0),
    kyc_status: p.kyc_status || 'unverified',
    emailVerified: !!p.emailVerified,
    mobileVerified: !!p.mobileVerified,
    twoFactorEnabled: !!p.twoFactorEnabled,
    vipLevel: p.vipLevel || 0,
    status: p.status || 'active',
    registrationDate: p.createdAt || p.registrationDate || '',
  };
}

// Player's display name as registered, normalised for comparison.
const normName = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
function registeredFullName(player) {
  return (player.fullName || `${player.firstName || ''} ${player.lastName || ''}`).trim();
}
function holderMatchesPlayer(player, holder) {
  return normName(holder) === normName(registeredFullName(player));
}

// Best-effort client IP (Cloud Functions sit behind Hosting -> x-forwarded-for).
function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.ip || req.socket?.remoteAddress || '';
}

// Tiny user-agent summary for the admin "Device Information" column.
function deviceFrom(ua = '') {
  const s = String(ua);
  const os = /Windows/i.test(s) ? 'Windows'
    : /Android/i.test(s) ? 'Android'
    : /iPhone|iPad|iOS/i.test(s) ? 'iOS'
    : /Mac OS X|Macintosh/i.test(s) ? 'macOS'
    : /Linux/i.test(s) ? 'Linux' : 'Unknown OS';
  const br = /Edg/i.test(s) ? 'Edge'
    : /OPR|Opera/i.test(s) ? 'Opera'
    : /Chrome/i.test(s) ? 'Chrome'
    : /Firefox/i.test(s) ? 'Firefox'
    : /Safari/i.test(s) ? 'Safari' : 'Unknown browser';
  return `${br} on ${os}`;
}

// Record a login/security event the admin can review.
function recordLogin(store, player, req, event = 'login') {
  return store.insert('login_history', {
    playerId: player.id,
    username: player.username,
    event,
    ip: clientIp(req),
    device: deviceFrom(req.headers['user-agent']),
    userAgent: String(req.headers['user-agent'] || ''),
  });
}

const gen6 = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = {
  PLATFORM_CODE,
  CURRENCIES,
  normalizeCurrency,
  nextPlayerSequence,
  makePlayerCode,
  ensurePlayerCode,
  publicView,
  registeredFullName,
  holderMatchesPlayer,
  clientIp,
  deviceFrom,
  recordLogin,
  gen6,
};
