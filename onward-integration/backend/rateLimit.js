/*
 * rateLimit.js — tiny in-memory fixed-window rate limiter.
 *
 * The API runs as a single pinned Cloud Function instance (functions.js:
 * maxInstances 1), so a per-process Map is a reliable throttle across all
 * requests. Keyed by client IP + a route bucket. Used to blunt credential
 * stuffing / OTP brute force on the auth surfaces.
 */
const buckets = new Map(); // key -> { count, resetAt }

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.ip || req.socket?.remoteAddress || 'unknown';
}

// max requests per windowMs for a given bucket name.
function rateLimit(bucket, max, windowMs) {
  return (req, res, next) => {
    const key = `${bucket}:${clientIp(req)}`;
    const now = Date.now();
    let e = buckets.get(key);
    if (!e || now > e.resetAt) { e = { count: 0, resetAt: now + windowMs }; buckets.set(key, e); }
    e.count += 1;
    if (e.count > max) {
      const retry = Math.ceil((e.resetAt - now) / 1000);
      res.set('Retry-After', String(retry));
      return res.status(429).json({ error: `Too many attempts. Try again in ${retry}s.` });
    }
    next();
  };
}

// Opportunistic cleanup so the Map can't grow unbounded on a long-lived
// instance. Runs at most once per minute, on request.
let lastSweep = 0;
function sweeper(req, res, next) {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, e] of buckets) if (now > e.resetAt) buckets.delete(k);
  }
  next();
}

module.exports = { rateLimit, sweeper };
