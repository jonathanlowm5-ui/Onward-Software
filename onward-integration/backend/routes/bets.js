/*
 * routes/bets.js — the wager ledger. Every bet placed through an integrated
 * game provider is recorded here; it powers wager missions, dashboard GGR and
 * (later) tournament leaderboards.
 *
 * POST /api/bets     record a bet — accepts either an admin token or the
 *                    aggregator key (X-Api-Key header matching settings.apiKey)
 *                    so provider callbacks can post without an admin session.
 *                    { playerId | username, game?, provider?, amount, win? }
 * GET  /api/bets     (admin) -> latest bets (?player= &limit=)
 * GET  /api/bets/summary (admin) -> { totalWagered, totalWon, ggr, count }
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();

// Admin token OR aggregator API key (for provider callbacks).
function requireAdminOrApiKey(req, res, next) {
  const key = String(req.headers['x-api-key'] || '');
  const configured = String(store.getSettings().apiKey || '');
  if (key && configured && key === configured) return next();
  return requireAuth(req, res, next);
}

router.post('/', requireAdminOrApiKey, (req, res) => {
  const b = req.body || {};
  let player = null;
  if (b.playerId) player = store.get('players', b.playerId);
  if (!player && b.username) {
    const uname = String(b.username).toLowerCase();
    player = store.list('players').find((p) => (p.username || '').toLowerCase() === uname);
  }
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const amount = Number(b.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'A positive bet amount is required' });
  const win = Number(b.win) || 0;

  const bet = store.insert('bets', {
    playerId: player.id,
    username: player.username,
    game: String(b.game || '').slice(0, 160),
    provider: String(b.provider || '').slice(0, 80),
    amount,
    win: win > 0 ? win : 0,
    currency: player.currency || 'PHP',
  });
  res.status(201).json(bet);
});

router.get('/', requireAuth, (req, res) => {
  let rows = store.list('bets');
  if (req.query.player) rows = rows.filter((x) => String(x.playerId) === String(req.query.player));
  rows = rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const limit = Math.min(500, Number(req.query.limit) || 100);
  res.json(rows.slice(0, limit));
});

router.get('/summary', requireAuth, (req, res) => {
  const rows = store.list('bets');
  const totalWagered = rows.reduce((s, x) => s + Number(x.amount || 0), 0);
  const totalWon = rows.reduce((s, x) => s + Number(x.win || 0), 0);
  res.json({ count: rows.length, totalWagered, totalWon, ggr: totalWagered - totalWon });
});

module.exports = router;
