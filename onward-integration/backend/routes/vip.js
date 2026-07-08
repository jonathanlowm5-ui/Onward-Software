/*
 * routes/vip.js — VIP tier configuration shared by the admin panel and the
 * player site.
 *
 * GET  /api/vip/tiers   (public)  -> [{ lv, n, ic, icImg, dep, exp, d, w, m, rb,
 *                                       rake, mgr, bonus, wMaxDay, wTxDay, wMin,
 *                                       wMaxSingle, c, cl, cd, rgb }, ...]
 * PUT  /api/vip/tiers   (admin, settings.manage) -> saves the full tiers array.
 *
 * The config lives in app_settings (settings.vipTiers) so a single source of
 * truth keeps the admin editor and the customer-facing VIP page in sync — when
 * an admin changes a tier name, icon picture, cashback or level bonus it is
 * immediately reflected on the player website.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

// ---- Canonical default tiers (admin economics + player-site theme colours) --
const NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Sapphire', 'Ruby', 'Emerald', 'Diamond', 'Royal', 'Legend'];
const ICS = ['🟤', '⚪', '🟡', '💠', '🔵', '🔴', '🟢', '💎', '👑', '🏆'];
const DEP = [1000, 5000, 15000, 50000, 120000, 250000, 500000, 1000000, 2500000, 5000000];
const EXP = [500, 2500, 7500, 25000, 60000, 125000, 250000, 500000, 1250000, 2500000];
const BONUS = [88, 188, 388, 888, 1888, 3888, 8888, 18888, 88888, 188888];
const W_MAX_DAY = [5000, 10000, 20000, 50000, 100000, 200000, 400000, 800000, 1500000, 3000000];
const W_TX_DAY = [3, 3, 4, 5, 6, 8, 10, 12, 15, 20];
const W_MIN = [200, 200, 200, 500, 500, 500, 1000, 1000, 1000, 1000];
const W_MAX_SINGLE = [5000, 10000, 20000, 50000, 100000, 200000, 400000, 800000, 1500000, 3000000];
// Player-site colour theme + rakeback (the customer VIP wheel uses these).
const THEME = [
  { c: '#cd7f32', cl: '#e3a565', cd: '#9c5e20', rgb: '205,127,50', rake: '1%' },
  { c: '#c0c8d0', cl: '#e6ecf2', cd: '#8b929b', rgb: '192,200,208', rake: '1.5%' },
  { c: '#f0c040', cl: '#fbe08a', cd: '#c9971a', rgb: '240,192,64', rake: '2%' },
  { c: '#34c759', cl: '#7ee59a', cd: '#1f8f3e', rgb: '52,199,89', rake: '2.5%' },
  { c: '#1ab5b5', cl: '#5fe0e0', cd: '#0f8585', rgb: '26,181,181', rake: '3%' },
  { c: '#3b82f6', cl: '#7dabff', cd: '#2360c8', rgb: '59,130,246', rake: '4%' },
  { c: '#a855f7', cl: '#c89bff', cd: '#7d34c8', rgb: '168,85,247', rake: '5%' },
  { c: '#ec4899', cl: '#f888bf', cd: '#bd2e74', rgb: '236,72,153', rake: '6%' },
  { c: '#ef4444', cl: '#f88080', cd: '#c22e2e', rgb: '239,68,68', rake: '8%' },
  { c: '#5ad1ed', cl: '#a8eeff', cd: '#22b8d4', rgb: '90,209,237', rake: '10%' },
];

function defaultTiers() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => ({
    lv: l,
    n: NAMES[l - 1],
    ic: ICS[l - 1],
    icImg: '',
    dep: DEP[l - 1],
    exp: EXP[l - 1],
    d: +(l * 0.5).toFixed(1),
    w: +(l * 0.8).toFixed(1),
    m: +(l * 1.2).toFixed(1),
    rb: +(l * 0.3).toFixed(1),
    rake: THEME[l - 1].rake,
    mgr: l >= 10 ? 'Dedicated' : l >= 7 ? 'Yes' : '—',
    bonus: BONUS[l - 1],
    wMaxDay: W_MAX_DAY[l - 1],
    wTxDay: W_TX_DAY[l - 1],
    wMin: W_MIN[l - 1],
    wMaxSingle: W_MAX_SINGLE[l - 1],
    c: THEME[l - 1].c,
    cl: THEME[l - 1].cl,
    cd: THEME[l - 1].cd,
    rgb: THEME[l - 1].rgb,
  }));
}

const num = (x, d = 0) => {
  const n = parseFloat(String(x).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (x, d = '') => (x === undefined || x === null ? d : String(x).trim());

// Sanitise one incoming tier, falling back to the matching default so the
// stored shape is always complete and safe to render on both apps.
function cleanTier(raw, i) {
  const def = defaultTiers()[i] || defaultTiers()[0];
  return {
    lv: def.lv,
    n: str(raw.n, def.n) || def.n,
    ic: str(raw.ic, def.ic).slice(0, 8) || def.ic,
    icImg: str(raw.icImg, '').slice(0, 2048), // hosted image URL (Firebase Storage)
    dep: num(raw.dep, def.dep),
    exp: num(raw.exp, def.exp),
    d: num(raw.d, def.d),
    w: num(raw.w, def.w),
    m: num(raw.m, def.m),
    rb: num(raw.rb, def.rb),
    rake: str(raw.rake, def.rake) || def.rake,
    mgr: str(raw.mgr, def.mgr) || def.mgr,
    bonus: num(raw.bonus, def.bonus),
    wMaxDay: num(raw.wMaxDay, def.wMaxDay),
    wTxDay: num(raw.wTxDay, def.wTxDay),
    wMin: num(raw.wMin, def.wMin),
    wMaxSingle: num(raw.wMaxSingle, def.wMaxSingle),
    c: str(raw.c, def.c) || def.c,
    cl: str(raw.cl, def.cl) || def.cl,
    cd: str(raw.cd, def.cd) || def.cd,
    rgb: str(raw.rgb, def.rgb) || def.rgb,
  };
}

function currentTiers() {
  const saved = store.getSettings().vipTiers;
  if (!Array.isArray(saved) || !saved.length) return defaultTiers();
  // Merge saved over defaults so newly added fields are always present.
  return defaultTiers().map((def, i) => (saved[i] ? cleanTier(saved[i], i) : def));
}

router.get('/tiers', (req, res) => {
  res.json(currentTiers());
});

// Player's live VIP progress: level + real deposit/points totals vs the next
// tier's thresholds (dep = total approved deposits, exp = total wagered).
const { requirePlayer } = require('../auth');
router.get('/me', requirePlayer, (req, res) => {
  const p = store.get('players', req.auth.sub);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const tiers = currentTiers();
  const depDone = store.list('transactions')
    .filter((t) => String(t.playerId) === String(p.id) && t.type === 'deposit' && t.status === 'approved')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const ptsDone = store.list('bets')
    .filter((b) => String(b.playerId) === String(p.id))
    .reduce((s, b) => s + Number(b.amount || 0), 0);

  // Level derived from thresholds (never below the admin-set player.vipLevel).
  let computed = 0;
  for (const t of tiers) {
    if (depDone >= Number(t.dep || 0) && ptsDone >= Number(t.exp || 0)) computed = t.lv;
  }
  const level = Math.max(Number(p.vipLevel || 0), computed);
  const next = tiers.find((t) => t.lv === level + 1) || null;

  res.json({
    level,
    levelName: (tiers.find((t) => t.lv === level) || {}).n || (level === 0 ? 'Member' : `VIP ${level}`),
    depDone, ptsDone,
    next: next ? { lv: next.lv, n: next.n, dep: Number(next.dep || 0), exp: Number(next.exp || 0) } : null,
    progress: next ? Math.min(100, Math.round(Math.min(
      depDone / Math.max(1, Number(next.dep || 1)),
      ptsDone / Math.max(1, Number(next.exp || 1))
    ) * 100)) : 100,
  });
});

router.put('/tiers', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const incoming = Array.isArray(req.body) ? req.body : req.body && req.body.tiers;
  if (!Array.isArray(incoming) || !incoming.length) {
    return res.status(400).json({ error: 'Expected an array of VIP tiers.' });
  }
  // Keep exactly 10 tiers, preserving order/levels.
  const tiers = defaultTiers().map((def, i) => cleanTier(incoming[i] || def, i));
  store.saveSettings({ vipTiers: tiers, vipUpdatedAt: new Date().toISOString() });
  res.json(tiers);
});

module.exports = router;
