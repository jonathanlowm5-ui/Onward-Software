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

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const items = (Array.isArray(req.body && req.body.items) ? req.body.items : [])
    .map(clean).filter(Boolean).slice(0, 100);
  store.saveSettings({ tournaments: items, tournamentsUpdatedAt: new Date().toISOString() });
  res.json(items);
});

module.exports = router;
