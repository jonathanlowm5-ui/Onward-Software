/*
 * routes/settings.js — the "Settings -> API Configuration" page.
 *
 * GET  /api/settings   (admin)  -> { baseUrl, apiKey, environment, apiSecretSet }
 * PUT  /api/settings   (admin)  -> save baseUrl, apiKey, apiSecret, environment
 *
 * The secret is never sent back to the browser; the response only reports
 * whether one is stored (apiSecretSet).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const ENVIRONMENTS = ['development', 'production'];

function publicView(s) {
  return {
    baseUrl: s.baseUrl || '',
    apiKey: s.apiKey || '',
    environment: ENVIRONMENTS.includes(s.environment) ? s.environment : 'development',
    apiSecretSet: !!s.apiSecret,
    updatedAt: s.updatedAt || null,
  };
}

router.get('/', requireAuth, (req, res) => {
  res.json(publicView(store.getSettings()));
});

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const patch = {};
  if (req.body.baseUrl !== undefined) patch.baseUrl = String(req.body.baseUrl).trim();
  if (req.body.apiKey !== undefined) patch.apiKey = String(req.body.apiKey).trim();
  if (req.body.environment !== undefined)
    patch.environment = ENVIRONMENTS.includes(req.body.environment)
      ? req.body.environment
      : 'development';
  // Only overwrite the secret when a non-empty value is supplied.
  if (req.body.apiSecret) patch.apiSecret = String(req.body.apiSecret);
  res.json(publicView(store.saveSettings(patch)));
});

// Generic UI-config storage for admin pages (sports leagues, payment gateways,
// web/domain config, CS config, PWA/APK config, security, jackpot pool…).
// Whitelisted keys only — API secrets stay out of reach.
const CONFIG_KEYS = [
  'sportsLeagues', 'paymentGateways', 'webConfig', 'csConfig', 'pwaConfig',
  'apkVersions', 'providersConfig', 'securityConfig', 'jackpotPool',
  'onlineBaseline', 'referralReward',
];
router.get('/config', requireAuth, (req, res) => {
  const s = store.getSettings();
  const out = {};
  CONFIG_KEYS.forEach((k) => { out[k] = s[k] !== undefined ? s[k] : null; });
  res.json(out);
});
router.put('/config', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const patch = {};
  CONFIG_KEYS.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'No recognised config keys' });
  const s = store.saveSettings(patch);
  const out = {};
  CONFIG_KEYS.forEach((k) => { out[k] = s[k] !== undefined ? s[k] : null; });
  res.json(out);
});

// Reject URLs that resolve to loopback / private / link-local ranges so this
// server-side fetch can't be used for SSRF (e.g. probing cloud metadata at
// 169.254.169.254 or internal services). Hostnames are checked syntactically;
// literal private IPs are blocked outright.
function isBlockedHost(host) {
  const h = String(host || '').toLowerCase().replace(/^\[|\]$/g, '');
  if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) return true;
  if (h === '0.0.0.0' || h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 0) return true;
  }
  return false;
}

// Server-side reachability check for the admin's integration pages (game API
// connectors, payment gateways, domains). Never throws — returns { ok, ms }.
router.post('/ping-url', requireAuth, requirePerm('settings.manage'), async (req, res) => {
  const url = String(req.body?.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Enter a full http(s) URL' });
  let host = '';
  try { host = new URL(url).hostname; } catch { return res.status(400).json({ error: 'Invalid URL' }); }
  if (isBlockedHost(host)) return res.status(400).json({ error: 'That host is not allowed' });
  const started = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { method: 'HEAD', signal: ctrl.signal }).catch(() =>
      fetch(url, { method: 'GET', signal: ctrl.signal }));
    clearTimeout(timer);
    res.json({ ok: r.status < 500, status: r.status, ms: Date.now() - started });
  } catch (e) {
    res.json({ ok: false, error: e.name === 'AbortError' ? 'Timed out (6s)' : (e.message || 'Unreachable'), ms: Date.now() - started });
  }
});

module.exports = router;
