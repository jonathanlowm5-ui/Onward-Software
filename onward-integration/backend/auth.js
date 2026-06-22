/*
 * auth.js — admin authentication.
 *
 * Public read endpoints (the frontend) need no auth. Every write endpoint
 * (the admin panel) goes through requireAuth, which checks a Bearer JWT.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const TOKEN_TTL = '12h';

function sign(user) {
  return jwt.sign({ sub: user.username, role: user.role || 'admin' }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// Player / agent tokens carry the record id as `sub` plus a role.
function signPlayer(player) {
  return jwt.sign(
    { sub: player.id, role: player.role || 'player', username: player.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require a logged-in player (or agent). Sets req.auth = { sub, role, username }.
function requirePlayer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'player' && decoded.role !== 'agent') {
      return res.status(403).json({ error: 'Player account required' });
    }
    // Session invalidation: an admin "kick" stamps sessionValidAfter (epoch
    // seconds); any token issued before that is rejected (the player is logged
    // out on their next request but can still sign back in). Also reject if the
    // account was removed or blocked.
    try {
      const store = require('./store');
      const rec = store.get('players', decoded.sub);
      if (rec) {
        if (rec.status === 'blocked') return res.status(403).json({ error: 'Account is blocked' });
        if (rec.sessionValidAfter && decoded.iat && decoded.iat < rec.sessionValidAfter) {
          return res.status(401).json({ error: 'Session ended. Please sign in again.', code: 'KICKED' });
        }
      }
    } catch { /* store not ready — don't block legitimate users */ }
    req.auth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Accept any valid token (admin or player) — used for image uploads so both the
// admin panel and logged-in players (KYC docs, avatars) can upload.
function requireAnyUser(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    req.token = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { sign, signPlayer, requireAuth, requirePlayer, requireAnyUser, JWT_SECRET };
