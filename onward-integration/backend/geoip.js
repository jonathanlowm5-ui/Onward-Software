/*
 * geoip.js — best-effort IP geolocation + VPN/proxy detection.
 *
 * Uses the free ip-api.com endpoint (no API key, ~45 req/min). Results are
 * cached in-memory per function instance. Every failure degrades gracefully to
 * an empty geo object so a lookup problem can never block login/registration.
 *
 * In production the Cloud Function makes the outbound call; private/LAN IPs are
 * short-circuited and never sent to the API.
 */
const cache = new Map();
const CACHE_MAX = 5000;

const EMPTY = { country: '', countryCode: '', region: '', city: '', isp: '', proxy: false, hosting: false };

// RFC1918 / loopback / link-local — never look these up.
function isPrivate(ip) {
  if (!ip) return true;
  const s = String(ip).replace(/^::ffff:/i, '').trim();
  return (
    s === '127.0.0.1' || s === '::1' || /^localhost$/i.test(s) ||
    /^10\./.test(s) || /^192\.168\./.test(s) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(s) ||
    /^169\.254\./.test(s) || /^(fc|fd|fe80)/i.test(s)
  );
}

async function geoLookup(ip) {
  const clean = String(ip || '').replace(/^::ffff:/i, '').trim();
  if (isPrivate(clean)) return { ...EMPTY, ip: clean, country: 'Local network', local: true };
  if (cache.has(clean)) return cache.get(clean);

  let geo = { ...EMPTY, ip: clean };
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const url = `http://ip-api.com/json/${encodeURIComponent(clean)}` +
      '?fields=status,message,country,countryCode,regionName,city,isp,proxy,hosting,query';
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const d = await res.json();
    if (d && d.status === 'success') {
      geo = {
        ip: d.query || clean,
        country: d.country || '',
        countryCode: d.countryCode || '',
        region: d.regionName || '',
        city: d.city || '',
        isp: d.isp || '',
        proxy: !!d.proxy,
        hosting: !!d.hosting,
      };
      if (cache.size > CACHE_MAX) cache.clear();
      cache.set(clean, geo);
    }
  } catch {
    /* network/timeout -> empty geo, never throws */
  }
  return geo;
}

// Human-readable "City, Region, Country".
function geoLabel(g) {
  if (!g) return '';
  if (g.local) return 'Local network';
  return [g.city, g.region, g.country].filter(Boolean).join(', ');
}

// Is this geo in a blocked country, per app settings?
function isBlocked(settings, geo) {
  if (!settings || !settings.geoBlockEnabled) return false;
  const list = Array.isArray(settings.blockedCountries) ? settings.blockedCountries : [];
  if (!list.length || !geo || !geo.countryCode) return false;
  return list.map((c) => String(c).toUpperCase()).includes(String(geo.countryCode).toUpperCase());
}

module.exports = { geoLookup, geoLabel, isBlocked, isPrivate };
