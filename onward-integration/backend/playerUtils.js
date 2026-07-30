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
const { geoLookup } = require('./geoip');

const PLATFORM_CODE = 'ONW';

// Currencies offered at registration; the 3-letter code is baked into Player ID.
const CURRENCIES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];

const normalizeCurrency = (c) => {
  const up = String(c || '').toUpperCase().trim();
  return CURRENCIES.includes(up) ? up : 'PHP';
};

// A run of `n` random digits.
function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i += 1) s += Math.floor(Math.random() * 10);
  return s;
}

// Permanent Player ID: ONW + random 7-digit number + currency (e.g. ONW4829173MYR).
// The number is random (not sequential) and checked unique against existing codes.
function generatePlayerCode(store, currency) {
  const cur = normalizeCurrency(currency);
  const used = new Set(store.list('players').map((p) => p.playerCode).filter(Boolean));
  let code;
  let tries = 0;
  do {
    code = `${PLATFORM_CODE}${randomDigits(7)}${cur}`;
    tries += 1;
  } while (used.has(code) && tries < 100);
  return code;
}

// Assign a permanent Player ID the first time we see a player without one. Idempotent.
function ensurePlayerCode(store, player) {
  if (!player || player.playerCode) return player;
  return store.update('players', player.id, {
    playerCode: generatePlayerCode(store, player.currency || 'PHP'),
  });
}

// Canonical, safe-to-send player shape. Strips secrets (hash, OTP codes).
function publicView(p) {
  if (!p) return null;
  const {
    passwordHash, emailOtp, emailOtpExpires, mobileOtp, mobileOtpExpires, twoFactorSecret,
    fairSeeds, // contains the un-revealed server seed — never send to the client
    ...rest
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

// Sanitize a user-supplied media/document URL before it is stored and later
// rendered in the admin panel (KYC docs, agent selfies). Only http(s), inline
// image data-URIs, and site-relative /uploads paths are allowed; dangerous
// schemes like javascript:/vbscript:/file: are dropped to '' so a reviewing
// admin can never trigger script execution by opening a document link.
function safeMediaUrl(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^data:image\/(png|jpe?g|gif|webp|bmp);base64,/i.test(s)) return s;
  if (s.startsWith('/')) return s;
  return '';
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

// Record a login/security event the admin can review. Enriches the row (and the
// player's "last known" fields) with geolocation + VPN/proxy detection.
async function recordLogin(store, player, req, event = 'login') {
  const ip = clientIp(req);
  const row = store.insert('login_history', {
    playerId: player.id,
    username: player.username,
    event,
    ip,
    device: deviceFrom(req.headers['user-agent']),
    userAgent: String(req.headers['user-agent'] || ''),
  });
  let geo = {};
  try { geo = await geoLookup(ip); } catch { geo = {}; }
  try {
    store.update('login_history', row.id, {
      country: geo.country || '', countryCode: geo.countryCode || '', city: geo.city || '',
      region: geo.region || '', isp: geo.isp || '', proxy: !!geo.proxy, hosting: !!geo.hosting,
    });
    store.update('players', player.id, {
      lastIp: ip, lastCountry: geo.country || '', lastCountryCode: geo.countryCode || '',
      lastCity: geo.city || '', lastRegion: geo.region || '', lastIsp: geo.isp || '',
      lastProxy: !!geo.proxy, lastHosting: !!geo.hosting,
    });
  } catch { /* store unavailable — keep the bare login row */ }
  return { ...row, ...geo };
}

const gen6 = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = {
  PLATFORM_CODE,
  CURRENCIES,
  normalizeCurrency,
  generatePlayerCode,
  ensurePlayerCode,
  publicView,
  registeredFullName,
  holderMatchesPlayer,
  clientIp,
  deviceFrom,
  recordLogin,
  gen6,
  safeMediaUrl,
};
