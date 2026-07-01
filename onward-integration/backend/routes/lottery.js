/*
 * routes/lottery.js — 4D lottery results captured server-side from 4DYES.
 *
 * The player site can't fetch 4dyes.com directly (CORS / iframe-only), so the
 * backend fetches the results page, parses it into structured pools and serves
 * clean JSON. Cached briefly (results only change on draw days).
 *
 * GET /api/lottery/results          -> { fetchedAt, source, pools: [...] }
 * GET /api/lottery/results?debug=1  -> also returns the raw HTML (to refine the
 *                                      parser) — admin/dev use.
 */
const express = require('express');

const router = express.Router();
const SOURCE = 'https://4dyes.com/pop.php?view=home';
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

let cache = { at: 0, html: '', pools: [], error: null };

async function refresh() {
  if (cache.html && Date.now() - cache.at < TTL_MS) return cache;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const r = await fetch(SOURCE, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: ctrl.signal });
    clearTimeout(timer);
    const html = await r.text();
    cache = { at: Date.now(), html, pools: parseResults(html), error: r.ok ? null : `HTTP ${r.status}` };
  } catch (e) {
    cache = { ...cache, at: Date.now(), error: e.message || 'fetch failed' };
  }
  return cache;
}

// Best-effort parser: 4D result pages list a company/pool name, a draw id/date,
// then 1st/2nd/3rd prizes and Special / Consolation blocks of 4-digit numbers.
// Kept resilient (unknown layouts just yield fewer fields) and easy to tune once
// we see the real markup via ?debug=1.
const strip = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
const POOLS = [
  { key: 'magnum', re: /magnum/i, label: 'Magnum 4D' },
  { key: 'damacai', re: /da\s*ma\s*cai|damacai|1\+3d/i, label: 'Da Ma Cai' },
  { key: 'toto', re: /toto|sports\s*toto/i, label: 'Sports Toto' },
  { key: 'singapore', re: /singapore|sg\s*pool/i, label: 'Singapore 4D' },
  { key: 'sabah', re: /sabah/i, label: 'Sabah 88' },
  { key: 'sarawak', re: /sarawak|cash\s*sweep/i, label: 'Sarawak Cashsweep' },
  { key: 'sandakan', re: /sandakan/i, label: 'Sandakan' },
  { key: 'gd', re: /grand\s*dragon|gd\s*lotto|perdana/i, label: 'GD Lotto' },
];

function parseResults(html) {
  if (!html) return [];
  const text = strip(html);
  const pools = [];
  for (const p of POOLS) {
    if (!p.re.test(text)) continue;
    // Grab the chunk of text following the pool name and pull 4-digit numbers.
    const idx = text.search(p.re);
    const chunk = text.slice(idx, idx + 600);
    const nums = (chunk.match(/\b\d{4}\b/g) || []);
    if (!nums.length) continue;
    pools.push({
      key: p.key,
      name: p.label,
      first: nums[0] || null,
      second: nums[1] || null,
      third: nums[2] || null,
      special: nums.slice(3, 13),
      consolation: nums.slice(13, 23),
    });
  }
  return pools;
}

router.get('/results', async (req, res) => {
  const c = await refresh();
  const body = {
    fetchedAt: c.at ? new Date(c.at).toISOString() : null,
    source: SOURCE,
    error: c.error || null,
    pools: c.pools || [],
  };
  if (req.query.debug) { body.raw = c.html; body.rawLength = c.html.length; }
  res.json(body);
});

module.exports = router;
