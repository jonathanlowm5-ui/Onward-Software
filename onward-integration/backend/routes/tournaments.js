/*
 * routes/tournaments.js — admin-managed tournaments shown on the player site
 * (promotions page Tournaments section).
 *
 * GET /api/tournaments            (public) -> [ ...tournaments ]
 *     ?active=1                   only enabled ones (and not past their end)
 * PUT /api/tournaments            (admin, settings.manage) -> save full list
 *
 * Stored in app_settings (settings.tournaments). Each entry:
 *   { id, enabled, title, desc, banner, start, end,
 *     buyIn, prize, prizeFs, provider, games: [names] }
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 't' + Date.now().toString(36) + (seq++).toString(36);

function clean(t) {
  if (!t || typeof t !== 'object') return null;
  const title = str(t.title, 160).trim();
  if (!title) return null;
  return {
    id: str(t.id, 40) || newId(),
    enabled: t.enabled == null ? true : !!t.enabled,
    title,
    desc: str(t.desc, 600).trim(),
    banner: str(t.banner, 5000).trim(),        // uploaded banner URL
    start: str(t.start, 40).trim(),            // datetime-local / ISO
    end: str(t.end, 40).trim(),
    buyIn: str(t.buyIn, 200).trim(),           // buy-in / join condition
    prize: str(t.prize, 80).trim(),            // main prize pill, e.g. "₱200,000"
    prizeFs: str(t.prizeFs, 80).trim(),        // secondary pill, e.g. "2000 FS"
    provider: str(t.provider, 80).trim(),
    games: Array.isArray(t.games)
      ? [...new Set(t.games.map((g) => str(g, 120).trim()).filter(Boolean))].slice(0, 100)
      : [],
  };
}

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.tournaments) ? s.tournaments : [];
};

router.get('/', (req, res) => {
  let items = list();
  if (String(req.query.active || '') === '1') {
    const now = Date.now();
    items = items.filter((t) => {
      if (t.enabled === false) return false;
      if (t.end) { const e = Date.parse(t.end); if (!Number.isNaN(e) && now > e) return false; }
      return true;
    });
  }
  res.json(items);
});

// Live leaderboard: top players by REAL wagering on the tournament's games
// (or its provider) within the start/end window.
router.get('/:id/leaderboard', (req, res) => {
  const t = list().find((x) => String(x.id) === String(req.params.id));
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  const start = t.start ? Date.parse(t.start) : 0;
  const end = t.end ? Date.parse(t.end) : Infinity;
  const games = new Set((t.games || []).map((g) => String(g).toLowerCase()));
  const provider = String(t.provider || '').toLowerCase();

  const byPlayer = {};
  for (const b of store.list('bets')) {
    const ts = Date.parse(b.createdAt || '');
    if (Number.isNaN(ts) || ts < start || ts > end) continue;
    const game = String(b.game || b.gameName || '').toLowerCase();
    const prov = String(b.provider || '').toLowerCase();
    if (games.size && !games.has(game)) {
      if (!provider || prov !== provider) continue;
    } else if (!games.size && provider && prov !== provider) continue;
    const key = String(b.playerId);
    byPlayer[key] = byPlayer[key] || { playerId: key, username: b.username || 'player', wagered: 0, won: 0, bets: 0 };
    byPlayer[key].wagered += Number(b.amount || 0);
    byPlayer[key].won += Number(b.win || 0);
    byPlayer[key].bets += 1;
  }
  const mask = (u) => { const s = String(u || 'player'); return s.length <= 3 ? s[0] + '***' : s.slice(0, 3) + '***' + (s.length > 6 ? s.slice(-1) : ''); };
  const rows = Object.values(byPlayer)
    .sort((a, b) => b.wagered - a.wagered)
    .slice(0, 50)
    .map((r, i) => ({ rank: i + 1, player: mask(r.username), wagered: r.wagered, won: r.won, bets: r.bets }));
  res.json({ id: t.id, name: t.name || t.title || '', start: t.start || '', end: t.end || '', rows });
});

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const items = (Array.isArray(req.body && req.body.items) ? req.body.items : [])
    .map(clean).filter(Boolean).slice(0, 100);
  store.saveSettings({ tournaments: items, tournamentsUpdatedAt: new Date().toISOString() });
  res.json(items);
});

module.exports = router;
